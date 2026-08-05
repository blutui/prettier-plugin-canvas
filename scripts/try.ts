/**
 * Scratchpad for inspecting how a snippet flows through the plugin.
 *
 *   npm run try -- "{% if a %}x{% endif %}"
 *   npm run try -- --file path/to/thing.canvas
 *   npm run try -- --cst "{% set a = 1 %}"     show the Concrete Syntax Tree
 *   npm run try -- --ast "{% set a = 1 %}"     show the Abstract Syntax Tree
 *   npm run try -- --width 40 "…"              format at a given printWidth
 *
 * With no flags it prints the formatted output and whether formatting is
 * stable. Rebuilds the grammar first, so an edit to the .ohm file is picked up.
 */
import { readFileSync } from 'node:fs'
import * as prettier from 'prettier'

import { toCanvasHtmlCST } from '@/parser/cst'
import { toCanvasHtmlAST } from '@/parser/ast'
import * as plugin from '@/index'

const argv = process.argv.slice(2)

const flag = (name: string) => argv.includes(`--${name}`)
const valueOf = (name: string) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? undefined : argv[i + 1]
}

const filePath = valueOf('file')
const printWidth = Number(valueOf('width') ?? 80)

const positional = argv.filter(
  (arg, i) =>
    !arg.startsWith('--') && argv[i - 1] !== '--file' && argv[i - 1] !== '--width'
)

const source = filePath ? readFileSync(filePath, 'utf8') : positional.join(' ')

if (!source) {
  console.error('Nothing to format. Pass a snippet or --file <path>.')
  process.exit(1)
}

/** Drop the noisy bookkeeping so the shape of the tree is readable. */
const clean = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(clean)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value)) {
      if (['source', 'locStart', 'locEnd', 'position'].includes(key)) continue
      out[key] = clean(v)
    }
    return out
  }
  return value
}

console.log('─── SOURCE ' + '─'.repeat(58))
console.log(source)

if (flag('cst')) {
  console.log('\n─── CST ' + '─'.repeat(61))
  console.log(JSON.stringify(clean(toCanvasHtmlCST(source)), null, 2))
}

if (flag('ast')) {
  console.log('\n─── AST ' + '─'.repeat(61))
  console.log(JSON.stringify(clean(toCanvasHtmlAST(source).children), null, 2))
}

async function run() {
  try {
    const options: prettier.Options = {
      parser: 'canvas',
      plugins: [plugin as prettier.Plugin],
      printWidth,
    }
    const once = await prettier.format(source, options)
    const twice = await prettier.format(once, options)

    console.log(`\n─── OUTPUT (printWidth=${printWidth}) ` + '─'.repeat(43))
    console.log(once)

    if (once !== twice) {
      console.log('─── ⚠️  NOT IDEMPOTENT — formatting again gives ' + '─'.repeat(22))
      console.log(twice)
      process.exitCode = 1
    } else {
      console.log('─── stable ✓ ' + '─'.repeat(56))
    }
  } catch (error) {
    console.log('\n─── ERROR ' + '─'.repeat(59))
    console.error(error instanceof Error ? error.stack : error)
    process.exitCode = 1
  }
}

run()
