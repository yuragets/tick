// Prefixes that trigger formula execution in spreadsheet apps (CSV injection)
const CSV_INJECTION_CHARS = ['=', '+', '-', '@', '\t', '\r']

export function sanitizeCsvCell(value: string): string {
  if (CSV_INJECTION_CHARS.some(c => value.startsWith(c))) {
    return `'${value}`
  }
  return value
}

export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 20)
}
