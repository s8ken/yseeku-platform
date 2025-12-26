"use client"
import { analyzeConversation } from "@/lib/resonate-engine"
import { Upload } from "lucide-react"

export default function FileUpload({ onResult }: { onResult: (r: any) => void }) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = await analyzeConversation(text)
    onResult(result)
  }

  return (
    <label className="cursor-pointer">
      <input type="file" accept=".txt,.json,.mhtml,.html" className="hidden" onChange={handleFile} />
      <div className="border-4 border-dashed border-cyan rounded-2xl p-16 hover:bg-cyan/10 transition-all flex flex-col items-center gap-4">
        <Upload size={64} className="text-cyan" />
        <p className="text-2xl">Drop your chat here</p>
      </div>
    </label>
  )
}