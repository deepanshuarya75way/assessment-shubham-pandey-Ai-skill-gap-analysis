import { motion } from "framer-motion";

export default function ProgressRing({
    title,
    value,
    color = "#2563EB",
}) {

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    const offset =
        circumference -
        (value / 100) * circumference;

    return (

        <motion.div
            whileHover={{ scale: 1.04 }}
            className="rounded-3xl bg-white shadow-lg border border-slate-200 p-6 flex flex-col items-center"
        >

            <svg
                width="140"
                height="140"
            >

                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="#E5E7EB"
                    strokeWidth="10"
                    fill="none"
                />

                <motion.circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke={color}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{
                        strokeDashoffset: circumference,
                    }}
                    animate={{
                        strokeDashoffset: offset,
                    }}
                    transition={{
                        duration: 1.5,
                    }}
                    transform="rotate(-90 70 70)"
                />

                <text
                    x="70"
                    y="78"
                    textAnchor="middle"
                    className="fill-slate-900 font-bold text-xl"
                >
                    {value}%
                </text>

            </svg>

            <h3 className="mt-8 font-bold">
                {title}
            </h3>

        </motion.div>

    );

}