import { NextResponse } from 'next/server'
import crypto from 'crypto'

function sha256String(s: string){
  return 'sha256:' + crypto.createHash('sha256').update(s).digest('hex')
}

export async function POST(req: Request){
  try{
    const receipt = await req.json()
    const contentStr = JSON.stringify(receipt.content || {})
    const computed = sha256String(contentStr)
    const hashOk = String(receipt?.cryptography?.contentHash||'').toLowerCase() === computed.toLowerCase()
    // Signature verification stub; in production, use crypto.verify with ed25519 public key
    const signatureOk = Boolean(receipt?.cryptography?.signature)
    return NextResponse.json({ verifiable: hashOk && signatureOk, hashOk, signatureOk, computedHash: computed })
  } catch (e:any){
    return NextResponse.json({ error: e?.message || 'verify_failed' }, { status: 400 })
  }
}