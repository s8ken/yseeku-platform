import { NextResponse } from 'next/server'
import { verifySignature } from '@/../../packages/lab/src/receipts/signing'

export async function POST(req: Request){
  try{
    const receipt = await req.json()
    const contentStr = JSON.stringify(receipt.content || {})
    const pubKey = receipt?.cryptography?.publicKey || process.env.SONATE_PUBLIC_KEY || ''
    const sigB64 = receipt?.cryptography?.signature || ''
    const { hashOk, signatureOk, computedHash, error } = verifySignature(contentStr, sigB64, pubKey)
    return NextResponse.json({ verifiable: hashOk && signatureOk, hashOk, signatureOk, computedHash, error })
  } catch (e:any){
    return NextResponse.json({ error: e?.message || 'verify_failed' }, { status: 400 })
  }
}