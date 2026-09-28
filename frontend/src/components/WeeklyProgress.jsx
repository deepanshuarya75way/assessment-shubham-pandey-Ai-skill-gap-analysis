import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

const data = [

    { day: "Mon", score: 55 },

    { day: "Tue", score: 61 },

    { day: "Wed", score: 68 },

    { day: "Thu", score: 74 },

    { day: "Fri", score: 82 },

    { day: "Sat", score: 90 },

    { day: "Sun", score: 95 },

];

export default function WeeklyProgress() {

    return (

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

            <h2 className="mb-5 text-xl font-bold">

                Weekly Progress

            </h2>

            <div className="h-72">

                <ResponsiveContainer>

                    <LineChart data={data}>

                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="day" />

                        <YAxis />

                        <Tooltip />

                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#2563EB"
                            strokeWidth={4}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

        </div>

    );

}