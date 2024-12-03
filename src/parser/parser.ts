import { Parser } from 'prettier'

import { locEnd, locStart } from '@/utils'
import { toCanvasHtmlAST } from './ast'
import type { CanvasHtmlNode } from './types'

export function parse(text: string): CanvasHtmlNode {
  return toCanvasHtmlAST(text)
}

export const canvasHtmlAstFormat = 'canvas-ast'

export const canvasHtmlLanguageName = 'canvas'

export const canvasHtmlParser: Parser = {
  parse,
  astFormat: canvasHtmlAstFormat,
  locStart,
  locEnd,
}
