const store = new Map<string, number>()
export function putState(s: string) { store.set(s, Date.now() + 10 * 60 * 1000) }
export function hasState(s: string) { const exp = store.get(s); if (!exp) return false; if (Date.now() > exp) { store.delete(s); return false } return true }
export function delState(s: string) { store.delete(s) }
