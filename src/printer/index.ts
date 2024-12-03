import { printerCanvasHtml } from './printer-canvas-html'
import { canvasHtmlAstFormat } from '@/parser'

export const printers = {
  [canvasHtmlAstFormat]: printerCanvasHtml,
}
