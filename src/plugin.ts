import { Plugin, SupportLanguage } from 'prettier'

import type { CanvasHtmlNode } from './types'

import { canvasHtmlLanguageName, parsers } from './parser'
import { printers } from './printer'

const languages: SupportLanguage[] = [
  {
    name: 'Canvas',
    parsers: [canvasHtmlLanguageName],
    extensions: ['.canvas', '.html'],
    vscodeLanguageIds: ['canvas', 'Canvas'],
  },
]

export const plugin: Plugin<CanvasHtmlNode> = {
  languages,
  parsers,
  printers,
}

export default plugin
