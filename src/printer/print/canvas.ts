import { Doc, doc } from 'prettier'

import {
  CanvasAstPath,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  CanvasVariableOutput,
} from '@/types'

import {
  getWhitespaceTrim,
  hasMeaningfulLackOfLeadingWhitespace,
  hasMeaningfulLackOfTrailingWhitespace,
  markupLines,
} from '../utils'

const {
  builders: { group, indent, line },
} = doc

export function printCanvasVariableOutput(
  path: CanvasAstPath,
  _options: CanvasParserOptions,
  print: CanvasPrinter,
  { leadingSpaceGroupId, trailingSpaceGroupId }: CanvasPrinterArgs
) {
  const node: CanvasVariableOutput = path.node as CanvasVariableOutput

  const whitespaceStart = getWhitespaceTrim(
    node.whitespaceStart,
    hasMeaningfulLackOfLeadingWhitespace(node),
    leadingSpaceGroupId
  )
  const whitespaceEnd = getWhitespaceTrim(
    node.whitespaceEnd,
    hasMeaningfulLackOfTrailingWhitespace(node),
    trailingSpaceGroupId
  )

  if (typeof node.markup !== 'string') {
    const whitespace = node.markup.filters.length > 0 ? line : ' '
    return group([
      '{{',
      whitespaceStart,
      indent([whitespace, path.call((p: any) => print(p), 'markup')]),
      whitespace,
      whitespaceEnd,
      '}}',
    ])
  }

  const lines = markupLines(node.markup)
  if (lines.length > 1) {
    console.log('lines:', lines)
  }

  return group(['{{', whitespaceStart, ' ', node.markup, ' ', whitespaceEnd, '}}'])
}
