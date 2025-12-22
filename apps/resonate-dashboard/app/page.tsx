"use client"
import FileUpload from "@/components/FileUpload"
import RadarChart from "@/components/RadarChart"
import VerdictBadge from "@/components/VerdictBadge"
import { useState } from "react"

export default function Home() {
  const [result, setResult] = useState<any>(null)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-12">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-4">Resonate Mirror</h1>
        <p className="text-xl text-cyan-300">Upload any chat with Grok, Claude, Gemini, ChatGPT or your own bot</p>
        <p className="text-2xl mt-4">We’ll tell you in 30 seconds:</p>
        <p className="text-4xl font-bold text-cyan">Is this conversation alive?</p>
      </div>
      <FileUpload onResult={setResult} />
      {result && (
        <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <VerdictBadge score={result.ciq} velocity={result.maxVelocity} />
          <RadarChart data={result.fiveD} />
          <div className="text-center">
            <p className="text-lg italic">“{result.verdict}”</p>
          </div>
        </div>
      )}
      <footer className="text-center text-sm text-gray-500 mt-20">Powered by SYMBI Resonate – the trust engine for sovereign AI</footer>
    </main>
  )
}