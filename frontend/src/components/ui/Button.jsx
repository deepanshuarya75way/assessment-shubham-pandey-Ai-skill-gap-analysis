import { motion } from "framer-motion";

export default function Button({
  children,
  onClick,
  className = "",
}) {
  return (
    <motion.button
      whileHover={{
        scale: 1.04,
      }}
      whileTap={{
        scale: 0.96,
      }}
      onClick={onClick}
      className={`rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-300/40 transition ${className}`}
    >
      {children}
    </motion.button>
  );
}