// Prefixes that trigger formula execution in spreadsheet apps (CSV injection)
const CSV_INJECTION_CHARS = ['=', '+', '-', '@', '\t', '\r']

export function sanitizeCsvCell(value: string): string {
  if (CSV_INJECTION_CHARS.some(c => value.startsWith(c))) {
    return `'${value}`
  }
  return value
}
