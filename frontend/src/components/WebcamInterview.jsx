import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  Eye,
  Loader2,
  Mic,
  MicOff,
  Square,
  Video,
} from "lucide-react";
import { evaluateInterview } from "../api.js";

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function calculateReport(answer, seconds, cameraEnabled, speechSupported) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const contentScore = Math.min(100, Math.round((words / 80) * 100));
  const durationScore = seconds >= 30 && seconds <= 180 ? 90 : seconds > 10 ? 65 : 35;
  const presenceScore = cameraEnabled ? 90 : 30;
  const speechScore = speechSupported ? 90 : 45;
  const finalScore = Math.round(
    contentScore * 0.45 +
      durationScore * 0.2 +
      presenceScore * 0.25 +
      speechScore * 0.1,
  );

  let verdict = "Needs practice";
  if (finalScore >= 80) verdict = "Interview ready";
  else if (finalScore >= 60) verdict = "Moderate readiness";

  return {
    words,
    durationScore,
    contentScore,
    presenceScore,
    speechScore,
    finalScore,
    verdict,
  };
}

function buildConfidenceReport({
  transcript,
  seconds,
  cameraEnabled,
  speechSupported,
  faceFrames,
  centeredFrames,
  sampledFrames,
}) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const communicationScore = Math.min(
    100,
    Math.round((words / 80) * 65 + (seconds >= 30 ? 20 : 8) + (speechSupported ? 15 : 5)),
  );
  const facePresenceScore = sampledFrames
    ? Math.round((faceFrames / sampledFrames) * 100)
    : cameraEnabled
      ? 65
      : 20;
  const eyeContactScore = sampledFrames
    ? Math.round((centeredFrames / sampledFrames) * 100)
    : cameraEnabled
      ? 55
      : 15;
  const confidenceScore = Math.round(
    communicationScore * 0.4 + facePresenceScore * 0.25 + eyeContactScore * 0.35,
  );

  return {
    confidenceScore,
    eyeContactScore,
    communicationScore,
    facePresenceScore,
    words,
    seconds,
    method: sampledFrames
      ? "Estimated using webcam face position and speech transcript"
      : "Estimated using camera presence and speech transcript",
  };
}

export default function WebcamInterview({
  questions,
  onEvaluation,
  evaluation,
  onConfidenceReport,
  targetRole,
  candidateSkills,
  resumeProfile,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const faceTimerRef = useRef(null);
  const metricsRef = useRef({
    sampledFrames: 0,
    faceFrames: 0,
    centeredFrames: 0,
  });
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [eyeContactWarning, setEyeContactWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const normalizedQuestions = useMemo(() => questions, [questions]);

  const currentQuestion = normalizedQuestions[currentIndex] || null;
  const speechSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    return () => stopPractice();
  }, []);

  async function startPractice() {
    if (!currentQuestion) return;
    setCameraError("");
    setSpeechError("");
    setReport(null);
    setEyeContactWarning("");
    setSeconds(0);
    setTranscript(answers[currentQuestion.id] || "");
    metricsRef.current = {
      sampledFrames: 0,
      faceFrames: 0,
      centeredFrames: 0,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
      shouldListenRef.current = true;
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
      startFaceSampling();
      startSpeechRecognition();
    } catch {
      setCameraError("Camera or microphone permission denied.");
    }
  }

  function startFaceSampling() {
    faceTimerRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      metricsRef.current.sampledFrames += 1;

      if ("FaceDetector" in window) {
        try {
          const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(video);
          if (faces.length) {
            metricsRef.current.faceFrames += 1;
            const box = faces[0].boundingBox;
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;
            const targetX = video.videoWidth / 2;
            const targetY = video.videoHeight / 2;
            const xDistance = Math.abs(faceCenterX - targetX) / video.videoWidth;
            const yDistance = Math.abs(faceCenterY - targetY) / video.videoHeight;
            if (xDistance < 0.18 && yDistance < 0.22) {
              metricsRef.current.centeredFrames += 1;
            }
          }
        } catch {
          estimateFrameFromBrightness(video);
        }
      } else {
        estimateFrameFromBrightness(video);
      }
      updateLiveEyeContactWarning();
    }, 1200);
  }

  function updateLiveEyeContactWarning() {
    const { sampledFrames, faceFrames, centeredFrames } = metricsRef.current;
    if (sampledFrames < 3) return;

    const faceRatio = faceFrames / sampledFrames;
    const eyeRatio = centeredFrames / sampledFrames;

    if (faceRatio < 0.2) {
      setEyeContactWarning(
        "Face is not clearly visible. Please sit in front of the camera and keep your face inside the frame.",
      );
    } else if (eyeRatio < 0.35) {
      setEyeContactWarning(
        "Eye contact is low. Look near the webcam and keep your face centered while answering.",
      );
    } else {
      setEyeContactWarning("");
    }
  }

  function estimateFrameFromBrightness(video) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = 96;
    const height = 54;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, width, height);
    const data = context.getImageData(0, 0, width, height).data;
    let centerBrightness = 0;
    let edgeBrightness = 0;
    let centerPixels = 0;
    let edgePixels = 0;

    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        const centered = x > width * 0.28 && x < width * 0.72 && y > height * 0.16 && y < height * 0.86;
        if (centered) {
          centerBrightness += brightness;
          centerPixels += 1;
        } else {
          edgeBrightness += brightness;
          edgePixels += 1;
        }
      }
    }

    const centerAverage = centerBrightness / Math.max(1, centerPixels);
    const edgeAverage = edgeBrightness / Math.max(1, edgePixels);
    if (Math.abs(centerAverage - edgeAverage) > 8) {
      metricsRef.current.faceFrames += 1;
      metricsRef.current.centeredFrames += 0.65;
    }
  }

  function startSpeechRecognition() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setSpeechError(
        "Speech recognition is not supported in this browser. Use Chrome or Edge, or type the answer manually.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += `${result[0].transcript} `;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((value) => `${value} ${finalText}`.trim());
      }
      if (interimText) {
        setSpeechError(`Listening: ${interimText}`);
      }
    };

    recognition.onerror = () => {
      setSpeechError("Speech recognition paused. The system is reconnecting the mic automatically.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      if (shouldListenRef.current && streamRef.current) {
        window.setTimeout(() => {
          if (shouldListenRef.current && streamRef.current) {
            startSpeechRecognition();
          }
        }, 450);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopSpeechRecognition() {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }

  function stopPractice() {
    shouldListenRef.current = false;
    stopSpeechRecognition();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (faceTimerRef.current) {
      window.clearInterval(faceTimerRef.current);
      faceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setActive(false);
  }

  function saveCurrentAnswer() {
    if (!currentQuestion) return;
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: transcript,
    }));
  }

  function finishQuestion() {
    if (!currentQuestion) return;
    const cameraEnabled = Boolean(streamRef.current);
    saveCurrentAnswer();
    stopPractice();
    const answerReport = calculateReport(transcript, seconds, cameraEnabled, speechSupported);
    const confidenceReport = buildConfidenceReport({
      transcript,
      seconds,
      cameraEnabled,
      speechSupported,
      ...metricsRef.current,
    });
    setReport({ ...answerReport, ...confidenceReport });
    onConfidenceReport?.(confidenceReport);
    if (confidenceReport.eyeContactScore < 45) {
      setEyeContactWarning(
        "Eye contact is low. Keep your face centered and look near the webcam while answering.",
      );
    }
  }

  function goNextQuestion() {
    if (!currentQuestion) return;
    saveCurrentAnswer();
    const nextIndex = Math.min(currentIndex + 1, normalizedQuestions.length - 1);
    setCurrentIndex(nextIndex);
    setTranscript(answers[normalizedQuestions[nextIndex].id] || "");
    setReport(null);
    setSeconds(0);
  }

  async function finishInterview() {
    if (!currentQuestion) return;
    setEvaluationError("");
    const completedAnswers = {
      ...answers,
      [currentQuestion.id]: transcript,
    };
    setAnswers(completedAnswers);
    if (active) finishQuestion();
    setLoading(true);
    try {
      const payload = normalizedQuestions.map((question) => ({
        question_id: question.id,
        question: question.question,
        skill: question.skill,
        answer: completedAnswers[question.id] || "",
      }));
      const result = await evaluateInterview(payload, {
        targetRole,
        candidateSkills,
        resumeText: resumeProfile?.text || "",
      });
      onEvaluation?.(result);
    } catch (error) {
      setEvaluationError(error.message || "Could not evaluate this interview. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
className="
rounded-3xl
bg-white
p-8
shadow-xl
border
border-slate-200
"
>
      <div className="mb-8 flex items-center gap-2">
        <Video size={20} className="text-ocean" />
        <h2 className="section-title">4. Webcam Mock Interview With Speech Analysis</h2>
      </div>

      {eyeContactWarning ? (
        <div className="mb-8 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose">
          {eyeContactWarning}
        </div>
      ) : null}

      {!normalizedQuestions.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
          Upload and analyze the resume, select a role, analyze the skill gap, then click
          Generate 10-12 Resume-Based Webcam Questions. The webcam interview will use
          resume projects and extracted skills.
        </div>
      ) : null}

      {normalizedQuestions.length ? (
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="aspect-video overflow-hidden rounded-md border border-slate-300 bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          {cameraError ? (
            <p className="mt-2 text-sm font-semibold text-rose">{cameraError}</p>
          ) : null}
          {speechError ? (
            <p className="mt-2 text-sm font-semibold text-slate-600">{speechError}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={startPractice}
              disabled={active}
              className="inline-flex items-center gap-2 rounded-md bg-ocean px-3 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Camera size={16} />
              Start Webcam + Voice
            </button>
            <button
              onClick={finishQuestion}
              disabled={!active}
              className="inline-flex items-center gap-2 rounded-md bg-rose px-3 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Square size={16} />
              Finish Answer
            </button>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              {listening ? <Mic size={15} /> : <MicOff size={15} />}
              {seconds}s
            </span>
          </div>
        </div>

        <div>
          <div className="mb-3 rounded-md bg-slate-50 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                Question {currentIndex + 1} of {normalizedQuestions.length}
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-black text-amber ring-1 ring-amber-200">
                {currentQuestion.skill}
              </span>
              <span className="rounded-md bg-purple-50 px-2 py-1 text-xs font-black text-purple-700 ring-1 ring-purple-200">
                {currentQuestion.difficulty}
              </span>
            </div>
            <p className="text-sm font-bold leading-6 text-ink">
              {currentQuestion.question}
            </p>
          </div>

          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            className="min-h-40 w-full rounded-md border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-ocean"
            placeholder="Your spoken answer transcript will appear here. You can also edit it before evaluation."
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={goNextQuestion}
              disabled={currentIndex === normalizedQuestions.length - 1}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              <ArrowRight size={16} />
              Next Question
            </button>
            <button
              onClick={finishInterview}
              disabled={loading || !Object.values(answers).some((answer) => answer.trim()) && !transcript.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
              {loading ? "Evaluating..." : "Finish Interview & View Analysis"}
            </button>
          </div>
          {evaluationError ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-rose">
              {evaluationError}
            </p>
          ) : null}
        </div>
      </div>
      ) : null}

      {report ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck size={18} className="text-ocean" />
            <h3 className="text-sm font-black text-ink">Current Answer Report</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <Metric label="Final Score" value={`${report.finalScore}%`} />
            <Metric label="Confidence" value={`${report.confidenceScore}%`} />
            <Metric label="Eye Contact" value={`${report.eyeContactScore}%`} />
            <Metric label="Communication" value={`${report.communicationScore}%`} />
            <Metric label="Face Presence" value={`${report.facePresenceScore}%`} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-700">
            Verdict: {report.verdict}. Words: {report.words}. Speak in a structured
            format: definition, method, example, and result.
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
            <Eye size={14} />
            {report.method}
          </p>
        </div>
      ) : null}

      {evaluation ? (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="mb-3 text-sm font-black text-emerald-800">
            Final Spoken Interview Marks: {evaluation.average_score}%
          </h3>
          <div className="space-y-2">
            {evaluation.feedback.map((item) => (
              <div key={item.question_id} className="text-sm text-emerald-900">
                <p>
                  <span className="font-black">{item.skill}: </span>
                  {item.score}% - {item.feedback}
                </p>
                {item.strengths?.length ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-800">
                    Strengths: {item.strengths.join(", ")}
                  </p>
                ) : null}
                {item.improvements?.length ? (
                  <p className="mt-1 text-xs font-semibold text-rose">
                    Improve: {item.improvements.join(", ")}
                  </p>
                ) : null}
                {item.ideal_answer ? (
                  <p className="mt-1 text-xs leading-5 text-emerald-950">
                    Ideal outline: {item.ideal_answer}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
