import { Parser, Printer, SupportLanguage } from 'prettier'

import { toCanvasHtmlAST } from './parser'
import { printerCanvasHtml } from './printer'
import { locEnd, locStart } from '@/utils'

// https://prettier.io/docs/en/plugins.html#languages
export const languages: Partial<SupportLanguage>[] = [
  {
    name: 'Canvas',
    parsers: ['canvas'],
    extensions: ['.canvas'],
    vscodeLanguageIds: ['canvas'],
  },
]

// https://prettier.io/docs/en/plugins.html#parsers
export const parsers: Record<string, Parser> = {
  canvas: {
    parse: (source) => toCanvasHtmlAST(source),
    astFormat: 'canvas',
    locStart,
    locEnd,
  },
}

// https://prettier.io/docs/en/plugins.html#printers
export const printers: Record<string, Printer> = {
  canvas: printerCanvasHtml,
}
