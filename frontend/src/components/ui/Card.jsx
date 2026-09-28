import { motion } from "framer-motion";

export default function Card({
  children,
  className = "",
}) {
  return (
    <motion.div
      whileHover={{
        y: -6,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`rounded-3xl border border-white/20 bg-white/70 p-6 shadow-xl backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}