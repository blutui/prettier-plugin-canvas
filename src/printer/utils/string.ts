export const trimEnd = (x: string) => x.trimEnd()

export function bodyLines(str: string): string[] {
  return str
    .replace(/^(?: |\t)*(\r?\n)*|\s*$/g, '') // only want the meat
    .split(/\r?\n/)
}

export function reindent(lines: string[], skipFirst = false): string[] {
  const minIndentLevel = lines
    .filter((_, i) => (skipFirst ? i > 0 : true))
    .filter((line) => line.trim().length > 0)
    .map((line) => (line.match(/^\s*/) as any)[0].length)
    .reduce((a, b) => Math.min(a, b), Infinity)

  if (minIndentLevel === Infinity) {
    return lines
  }

  const indentStrip = new RegExp('^' + '\\s'.repeat(minIndentLevel))
  return lines.map((line) => line.replace(indentStrip, '')).map(trimEnd)
}
