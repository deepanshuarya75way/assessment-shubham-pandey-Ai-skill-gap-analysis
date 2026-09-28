import { motion } from "framer-motion";
import { Upload, Video } from "lucide-react";

export default function WelcomeBanner({
  user,
  onResume,
  onInterview,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 p-8 text-white shadow-xl"
    >
      {/* Background Glow */}

      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10">

        <p className="text-cyan-100">
          👋 Welcome Back
        </p>

        <h1 className="mt-2 text-5xl font-black">
          {user?.name}
        </h1>

        <p className="mt-5 max-w-2xl text-lg text-cyan-100">
          Upload your resume, analyze your skills,
          practice AI interviews and improve your
          confidence before your dream job interview.
        </p>

        <div className="mt-8 flex flex-wrap gap-8">

          <button
            onClick={onResume}
            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 transition hover:scale-105"
          >
            <Upload size={18} />
            Upload Resume
          </button>

          <button
            onClick={onInterview}
            className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold backdrop-blur hover:bg-white/20"
          >
            <Video size={18} />
            Start Interview
          </button>

        </div>

      </div>
    </motion.div>
  );
}