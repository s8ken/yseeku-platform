"use client"
import React from "react"

export default function VelocitySparkline({ points }: { points: number[] }){
  const max = Math.max(1, ...points)
  return (
    <div className="w-full h-10 bg-[#1a1a1f] rounded">
      <div className="relative w-full h-full">
        <svg className="absolute inset-0 w-full h-full">
          {points.map((v, i) => {
            const x = (i / Math.max(1, points.length - 1)) * 100
            const y = 100 - (v / max) * 100
            const prevX = ((i - 1) / Math.max(1, points.length - 1)) * 100
            const prevY = 100 - ((points[i - 1] || v) / max) * 100
            return i > 0 ? (
              <line key={i} x1={`${prevX}%`} y1={`${prevY}%`} x2={`${x}%`} y2={`${y}%`} stroke="#38E1FF" strokeWidth={2} />
            ) : null
          })}
        </svg>
      </div>
    </div>
  )
}