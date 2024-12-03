import * as ohm from 'ohm-js'

export const canvasHtmlGrammars = ohm.grammars(require('../../grammar/canvas-html.ohm.cjs'))

export interface CanvasGrammars {
  Canvas: ohm.Grammar
  CanvasHTML: ohm.Grammar
}

export const strictGrammars: CanvasGrammars = {
  Canvas: canvasHtmlGrammars['StrictCanvas'],
  CanvasHTML: canvasHtmlGrammars['StrictCanvasHTML'],
}

export const tolerantGrammars: CanvasGrammars = {
  Canvas: canvasHtmlGrammars['Canvas'],
  CanvasHTML: canvasHtmlGrammars['CanvasHTML'],
}

export const placeholderGrammars: CanvasGrammars = {
  Canvas: canvasHtmlGrammars['WithPlaceholderCanvas'],
  CanvasHTML: canvasHtmlGrammars['WithPlaceholderCanvasHTML'],
}

export const TAGS_WITHOUT_MARKUP = ['else']
