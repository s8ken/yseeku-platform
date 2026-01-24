function assert(c, m){ if(!c) throw new Error(m) }

async function testCompareVariants(){
  const detect = require('@sonate/detect')
  const content = 'We verify and validate with secure boundaries, privacy, and ethical clarity. Novel synthesis and innovation 2025 with 42% evidence.'

  const enhanced = new detect.EnhancedDetector()
  const balanced = new detect.BalancedSonateDetector()
  const calibrated = new detect.CalibratedSonateDetector()

  const er = await enhanced.analyzeContent({ content })
  const br = await balanced.analyzeContent({ content })
  const cr = await calibrated.analyzeContent({ content })

  const e = er.assessment.overallScore
  const b = br.assessment.overallScore
  const c = cr.assessment.overallScore

  assert(typeof e === 'number' && typeof b === 'number' && typeof c === 'number', 'invalid scores')
  assert(b <= e, 'balanced should not exceed enhanced')
  assert(c >= b, 'calibrated should be at least balanced')
  assert(c <= Math.round(e * 1.1), 'calibrated should be within +10% of enhanced')

  console.log('PASS: Compare Enhanced vs Balanced vs Calibrated')
}

async function main(){
  try{
    await testCompareVariants()
  }catch(e){
    console.error('FAIL:', e && e.message || e)
    process.exitCode = 1
    return
  }
}

main()