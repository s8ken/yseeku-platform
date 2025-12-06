import { NextResponse } from 'next/server'
import { analyzeConversation } from '@/lib/resonate-engine'

export async function POST(req: Request){
  const text = await req.text()
  const result = await analyzeConversation(text)
  return NextResponse.json(result)
}