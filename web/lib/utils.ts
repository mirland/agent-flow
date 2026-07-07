/** Convert a 0–1 alpha value to a two-character hex string (e.g. 0.5 → '80') */
export function alphaHex(alpha: number): string {
  return Math.floor(alpha * 255).toString(16).padStart(2, '0')
}

/** Format a token count for display (e.g. 128500 → '128k') */
export function formatTokens(tokens: number): string {
  return `${Math.floor(tokens / 1000)}k`
}

/** Truncate a file path to the last N segments (e.g. '/a/b/c/d.ts' → 'b/c/d.ts') */
export function truncatePath(path: string, segments = 3): string {
  return path.split('/').slice(-segments).join('/')
}

const CLAUDE_NEW = /claude-(sonnet|opus|haiku|fable|mythos)-(\d+)(?:-(\d+))?/
const CLAUDE_LEGACY = /claude-(\d+)(?:-(\d+))?-(sonnet|opus|haiku|fable|mythos)/
const GPT = /gpt-(\S+?)(?:-\d{4}-\d{2}-\d{2})?$/

/** Format a raw model ID for display (e.g. 'claude-opus-4-6-20250514' → 'Opus 4.6'). */
export function formatModelName(model: string): string {
  const base = model.replace(/-\d{8}$/, '')

  const m = base.match(CLAUDE_NEW)
  if (m) {
    const family = m[1][0].toUpperCase() + m[1].slice(1)
    return m[3] ? `${family} ${m[2]}.${m[3]}` : `${family} ${m[2]}`
  }

  const legacy = base.match(CLAUDE_LEGACY)
  if (legacy) {
    const family = legacy[3][0].toUpperCase() + legacy[3].slice(1)
    return legacy[2] ? `${family} ${legacy[1]}.${legacy[2]}` : `${family} ${legacy[1]}`
  }

  const gpt = model.match(GPT)
  if (gpt) return `GPT-${gpt[1]}`

  return base
}
