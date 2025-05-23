import * as prettier from 'prettier'
import * as CanvasPlugin from '../src/index'

export async function format(str: string, options: prettier.Options = {}) {
  const defaultOptions: prettier.Options = {
    printWidth: 80,
  }

  return await prettier.format(str, {
    ...defaultOptions,
    ...options,
    parser: 'canvas',
    plugins: [...(options.plugins ?? []), CanvasPlugin] as any,
  })
}

export function heredoc(value: TemplateStringsArray | string, ...values: any[]): string {
  if (typeof value === 'string') {
    return stringToHeredoc(value)
  } else {
    return stringToHeredoc(renderStringTemplate(value, ...values))
  }
}

function stringToHeredoc(value: string): string {
  let addNewline = false
  const lines = value.split('\n')

  if (lines.length > 0 && lines[0] === '') {
    lines.shift()
  }
  if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
    addNewline = true
  }

  const indents = lines.map((line) => line.search(/[^ ]/)).filter((n) => n >= 0)
  const minIndentLength = Math.min(...indents)
  return lines.map((line) => line.slice(minIndentLength)).join('\n') + (addNewline ? '\n' : '')
}

function renderStringTemplate(strings: TemplateStringsArray, ...values: string[]): string {
  let result = ''
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    if (i < values.length) {
      result += `${values[i]}`
    }
  }

  return result
}
