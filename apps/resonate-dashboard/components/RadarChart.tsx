"use client"
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"

export default function RadarChart({ data }: { data: Record<string, number> }) {
  const chartData = [
    { dimension: "Reality", value: data.reality },
    { dimension: "Trust", value: data.trust },
    { dimension: "Ethical", value: data.ethical },
    { dimension: "Resonance", value: data.resonance },
    { dimension: "Canvas", value: data.canvas },
    { dimension: "Reality", value: data.reality },
  ]

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#38E1FF44" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#38E1FF", fontSize: 14 }} />
          <PolarRadiusAxis angle={90} domain={[0, 10]} tick={false} />
          <Radar name="Score" dataKey="value" stroke="#38E1FF" fill="#38E1FF" fillOpacity={0.6} strokeWidth={3} />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  )
}