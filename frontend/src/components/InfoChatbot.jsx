import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bot,
  User,
  Send,
  Paperclip,
  Copy,
  RefreshCw,
  Sparkles,
  Image,
  Video,
  FileText,
  X,
  Loader2,
  MessageCircle,
  Trash2,
  Check,
ThumbsUp,
ThumbsDown,
} from "lucide-react";


import { askAI } from "../api";

function QuickPrompt({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition hover:border-blue-500 hover:bg-blue-50"
    >
      {text}
    </button>
  );
}

function TypingAnimation() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-4 shadow">
      <Loader2 className="animate-spin text-blue-500" size={18} />
      <span className="text-sm text-slate-500">
        Gemini is thinking...
      </span>
    </div>
  );
}

export default function InfoChatbot({
  candidateSkills,
  resumeProfile,
  gapReport,
  evaluation,
  confidenceReport,
  roadmap,
}) {

  const context = useMemo(
    () => ({
      skills: candidateSkills || [],
      projects: resumeProfile?.projects || [],
      resumeScore: gapReport?.score || 0,
      interviewScore: evaluation?.average_score || 0,
      confidenceScore:
        confidenceReport?.confidenceScore || 0,
      eyeContactScore:
        confidenceReport?.eyeContactScore || 0,
      communicationScore:
        confidenceReport?.communicationScore || 0,
      roadmapCount: roadmap?.length || 0,
    }),
    [
      candidateSkills,
      resumeProfile,
      gapReport,
      evaluation,
      confidenceReport,
      roadmap,
    ]
  );

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "👋 Hello! I'm your AI Career Assistant.\n\nI can help you with:\n\n• Resume Review\n• Skill Gap Analysis\n• Interview Preparation\n• Roadmap Suggestions\n• ATS Optimization\n\nAsk me anything!",
    },
  ]);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);

  const [open, setOpen] = useState(false);

  const chatRef = useRef(null);

  const [copied, setCopied] = useState(null);

  const [feedback, setFeedback] = useState({});

  const suggestions = [
    "Summarize my resume",
    "What are my strengths?",
    "What skills are missing?",
    "Generate interview questions",
    "How can I improve ATS score?",
    "Which projects should I add?"
  ];

  const bottomRef = useRef(null);
  useEffect(() => {
    const saved = localStorage.getItem("resume_ai_chat");

    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // ---------------------------
  // Save Chat
  // ---------------------------

  useEffect(() => {
    localStorage.setItem(
      "resume_ai_chat",
      JSON.stringify(messages)
    );
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const quickPrompts = [
    "Improve my resume",
    "Generate interview questions",
    "Analyze my skills",
    "How can I increase my ATS score?",
    "Explain my roadmap",
    "What projects should I build?",
  ];

  function getAttachmentIcon(type) {
    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Video;
    return FileText;
  }

  async function handleAttachment(e) {

    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const parsed = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {

            const item = {
              id:
                file.name +
                file.size +
                Date.now(),

              name: file.name,

              type:
                file.type || "unknown",

              previewUrl:
                file.type.startsWith("image/") ||
                  file.type.startsWith("video/")
                  ? URL.createObjectURL(file)
                  : "",

              textPreview: "",
            };

            if (
              file.type.startsWith("text/") ||
              file.name.endsWith(".txt")
            ) {
              const reader = new FileReader();

              reader.onload = () => {

                item.textPreview =
                  String(reader.result).slice(
                    0,
                    1000
                  );

                resolve(item);
              };

              reader.readAsText(file);

            } else {

              resolve(item);

            }

          })
      )
    );

    setAttachments((prev) => [
      ...prev,
      ...parsed,
    ]);

    e.target.value = "";
  }

  function removeAttachment(id) {
    setAttachments((prev) =>
      prev.filter((a) => a.id !== id)
    );
  }

  async function handleSend(message = input) {

    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");

    setLoading(true);

    try {

      const resumeText =
        resumeProfile?.extracted_text || "";

      const response = await askAI(
        message,
        resumeText
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.answer,
        },
      ]);

    } catch (err) {

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "❌ Unable to contact Gemini API.\n\n" +
            err.message,
        },
      ]);

    } finally {

      setLoading(false);

    }
  }

  function copyMessage(text) {
    navigator.clipboard.writeText(text);
  }

  async function regenerate() {

    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUser) return;

    await handleSend(lastUser.text);

  }

  return (
  <>
    {/* Floating Chat Button */}

    <button
      onClick={() => setOpen(!open)}
      className="
      fixed
      bottom-6
      right-6
      z-50
      h-16
      w-16
      rounded-full
      bg-gradient-to-r
      from-blue-600
      via-indigo-600
      to-purple-600
      text-white
      shadow-2xl
      transition-all
      duration-300
      hover:scale-110
      hover:shadow-blue-500/40
      flex
      items-center
      justify-center
      "
    >
      {open ? <X size={28} /> : <MessageCircle size={28} />}
    </button>

    {/* Chat Window */}

    {open && (
      <div
        className="
        fixed
        bottom-24
        right-6
        z-50
        w-[400px]
        h-[700px]
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-[0_20px_60px_rgba(0,0,0,0.20)]
        overflow-hidden
        flex
        flex-col
        "
      >
        {/* Header */}

        <div
          className="
          bg-gradient-to-r
          from-blue-700
          via-indigo-700
          to-purple-700
          p-5
          text-white
          "
        >
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div
                className="
                h-12
                w-12
                rounded-full
                bg-white/20
                backdrop-blur
                flex
                items-center
                justify-center
                "
              >
                <Bot size={26} />
              </div>

              <div>

                <h2 className="font-bold text-lg">
                  AI Resume Assistant
                </h2>

                <p className="text-xs opacity-90">
                  Powered by Gemini AI
                </p>

              </div>

            </div>

            <button
              onClick={() => setOpen(false)}
              className="
              rounded-full
              p-2
              hover:bg-white/20
              transition
              "
            >
              <X size={20} />
            </button>

          </div>
        </div>

        {/* Quick Suggestions */}

        <div
          className="
          border-b
          bg-slate-100
          px-3
          py-3
          "
        >
          <div
            className="
            flex
            gap-2
            overflow-x-auto
            scrollbar-hide
            "
          >
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => setInput(item)}
                className="
                whitespace-nowrap
                rounded-full
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-xs
                font-medium
                hover:border-blue-500
                hover:bg-blue-50
                transition
                "
              >
                <Sparkles
                  size={13}
                  className="inline mr-1"
                />
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Header */}

        <div
          className="
          flex
          items-center
          justify-between
          border-b
          bg-white
          px-4
          py-3
          "
        >
          <div>

            <h3 className="font-semibold text-slate-700">
              Conversation
            </h3>

            <p className="text-xs text-slate-400">
              Chat history is saved automatically
            </p>

          </div>

          <button
            onClick={() => {
              localStorage.removeItem("resume_ai_chat");

              setMessages([
                {
                  role: "assistant",
                  text:
                    "👋 Hello! I'm your AI Career Assistant.\n\nHow can I help you today?",
                },
              ]);
            }}
            className="
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-red-300
            px-3
            py-2
            text-red-600
            hover:bg-red-50
            transition
            "
          >
            <Trash2 size={16} />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div
  ref={bottomRef}
  className="
  flex-1
  overflow-y-auto
  bg-slate-50
  px-4
  py-5
  space-y-5
  "
>
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`flex ${
        msg.role === "user"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
        relative
        max-w-[85%]
        rounded-2xl
        px-4
        py-3
        shadow-sm

        ${
          msg.role === "user"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm"
            : "bg-white border rounded-bl-sm"
        }
        `}
      >
        {/* Avatar */}

        <div className="mb-2 flex items-center gap-2">

          {msg.role === "assistant" ? (
            <>
              <Bot
                size={18}
                className="text-blue-600"
              />
              <span className="text-xs font-semibold text-blue-600">
                Gemini
              </span>
            </>
          ) : (
            <>
              <User
                size={18}
                className="text-white"
              />
              <span className="text-xs font-semibold">
                You
              </span>
            </>
          )}

        </div>

        {/* Markdown */}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({
              inline,
              className,
              children,
              ...props
            }) {
              const match = /language-(\w+)/.exec(
                className || ""
              );

              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className="
                  rounded
                  bg-slate-100
                  px-1
                  py-0.5
                  text-pink-600
                  "
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {msg.text}
        </ReactMarkdown>

        {/* Action Buttons */}

        {msg.role === "assistant" && (
          <div className="mt-4 flex items-center gap-2">

            {/* Copy */}

            <button
              onClick={() => {
                copyMessage(msg.text);

                setCopied(index);

                setTimeout(() => {
                  setCopied(null);
                }, 1500);
              }}
              className="
              rounded-lg
              border
              p-2
              hover:bg-slate-100
              transition
              "
            >
              {copied === index ? (
                <Check
                  size={16}
                  className="text-green-600"
                />
              ) : (
                <Copy size={16} />
              )}
            </button>

            {/* Like */}

            <button
              onClick={() =>
                setFeedback((prev) => ({
                  ...prev,
                  [index]: "like",
                }))
              }
              className={`
              rounded-lg
              border
              p-2
              transition

              ${
                feedback[index] === "like"
                  ? "bg-green-100 text-green-600"
                  : "hover:bg-green-50"
              }
              `}
            >
              <ThumbsUp size={16} />
            </button>

            {/* Dislike */}

            <button
              onClick={() =>
                setFeedback((prev) => ({
                  ...prev,
                  [index]: "dislike",
                }))
              }
              className={`
              rounded-lg
              border
              p-2
              transition

              ${
                feedback[index] === "dislike"
                  ? "bg-red-100 text-red-600"
                  : "hover:bg-red-50"
              }
              `}
            >
              <ThumbsDown size={16} />
            </button>

            {/* Regenerate */}

            <button
              onClick={regenerate}
              className="
              ml-auto
              flex
              items-center
              gap-2
              rounded-lg
              border
              px-3
              py-2
              hover:bg-blue-50
              transition
              "
            >
              <RefreshCw size={15} />
              Retry
            </button>

          </div>
        )}
      </div>
    </div>
  ))}

  {/* Typing Animation */}

  {loading && <TypingAnimation />}
          {/* Attachment Preview */}

        {attachments.length > 0 && (
          <div className="mt-4 space-y-3">

            {attachments.map((file) => {

              const Icon = getAttachmentIcon(file.type);

              return (
                <div
                  key={file.id}
                  className="
                  rounded-2xl
                  border
                  bg-white
                  p-3
                  shadow-sm
                  "
                >
                  <div className="flex items-start justify-between">

                    <div className="flex items-start gap-3">

                      <div className="rounded-xl bg-slate-100 p-3">
                        <Icon
                          size={22}
                          className="text-blue-600"
                        />
                      </div>

                      <div>

                        <p className="font-medium text-sm">
                          {file.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {file.type}
                        </p>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        removeAttachment(file.id)
                      }
                      className="
                      rounded-lg
                      p-2
                      hover:bg-red-100
                      transition
                      "
                    >
                      <X
                        size={16}
                        className="text-red-500"
                      />
                    </button>

                  </div>

                  {/* Image Preview */}

                  {file.previewUrl &&
                    file.type.startsWith("image/") && (
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="
                        mt-3
                        h-44
                        w-full
                        rounded-xl
                        object-cover
                        border
                        "
                      />
                    )}

                  {/* Video Preview */}

                  {file.previewUrl &&
                    file.type.startsWith("video/") && (
                      <video
                        controls
                        src={file.previewUrl}
                        className="
                        mt-3
                        w-full
                        rounded-xl
                        border
                        "
                      />
                    )}

                  {/* Text Preview */}

                  {file.textPreview && (
                    <pre
                      className="
                      mt-3
                      max-h-40
                      overflow-auto
                      rounded-xl
                      bg-slate-100
                      p-3
                      text-xs
                      "
                    >
                      {file.textPreview}
                    </pre>
                  )}

                </div>
              );

            })}

          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">

  <div className="flex items-end gap-3">

    {/* Upload Button */}

    <label
      className="
      h-12
      w-12
      rounded-xl
      border
      cursor-pointer
      flex
      items-center
      justify-center
      hover:bg-slate-100
      transition
      "
    >
      <Paperclip size={20} />

      <input
        type="file"
        multiple
        hidden
        onChange={handleAttachment}
      />
    </label>

    {/* Input */}

    <textarea
      rows={1}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" &&
          !e.shiftKey
        ) {
          e.preventDefault();
          handleSend();
        }
      }}
      placeholder="Ask anything about your resume..."
      className="
      flex-1
      resize-none
      rounded-2xl
      border
      px-4
      py-3
      outline-none
      focus:ring-2
      focus:ring-blue-500
      max-h-36
      "
    />

    {/* Send */}

    <button
      disabled={loading || !input.trim()}
      onClick={() => handleSend()}
      className="
      h-12
      w-12
      rounded-xl
      bg-gradient-to-r
      from-blue-600
      to-indigo-600
      text-white
      flex
      items-center
      justify-center
      transition
      hover:scale-105
      disabled:opacity-50
      disabled:cursor-not-allowed
      "
    >
      {loading ? (
        <Loader2
          size={20}
          className="animate-spin"
        />
      ) : (
        <Send size={20} />
      )}
    </button>

  </div>

  {/* Footer */}

  <div className="mt-3 flex items-center justify-between">

    <span className="text-xs text-slate-400">
      Powered by Gemini AI
    </span>

    <button
      onClick={regenerate}
      className="
      flex
      items-center
      gap-2
      text-xs
      text-blue-600
      hover:text-blue-800
      transition
      "
    >
      <RefreshCw size={14} />
      Regenerate
    </button>

  </div>

</div>

</div>
)}

</>
);
}