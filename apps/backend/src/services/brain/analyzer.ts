export function analyzeContext(input: { bedau: any; avgTrust: number; receipts: any[] }) {
  const observations: string[] = [];
  const trust = input.avgTrust;
  const emergence = input.bedau?.emergence_type || 'LINEAR';
  if (trust < 70) observations.push('low_trust');
  if (emergence !== 'LINEAR') observations.push('emergence_detected');
  const status = trust < 60 || emergence === 'HIGH_WEAK_EMERGENCE' ? 'critical' : trust < 75 || emergence === 'WEAK_EMERGENCE' ? 'warning' : 'healthy';
  return { status, observations };
}
