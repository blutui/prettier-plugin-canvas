import { doc, Doc, Printer } from 'prettier'

import type {
  AstPath,
  CanvasAstPath,
  CanvasHtmlNode,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  DocumentNode,
  HtmlDanglingMarkerClose,
  HtmlElement,
  TextNode,
} from '@/types'
import { getConditionalComment, NodeTypes } from '@/parser'

import { preprocess } from './print-preprocess'
import { assertNever } from '@/utils'
import { printChildren } from './print/children'
import { printElement } from './print/element'
import { bodyLines, reindent } from './utils'

const { builders } = doc
const { group, hardline, indent, join, line, softline } = builders

function printNode(
  path: CanvasAstPath,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs = {}
): Doc {
  const node = path.node
  switch (node.type) {
    case NodeTypes.Document: {
      return [printChildren(path as AstPath<DocumentNode>, options, print, args), hardline]
    }

    case NodeTypes.HtmlElement: {
      return printElement(path as AstPath<HtmlElement>, options, print, args)
    }

    case NodeTypes.HtmlDanglingMarkerClose: {
      return printElement(path as AstPath<HtmlDanglingMarkerClose>, options, print, args)
    }

    case NodeTypes.HtmlVoidElement: {
      return ''
    }

    case NodeTypes.HtmlSelfClosingElement: {
      return ''
    }

    case NodeTypes.HtmlRawNode: {
      return ''
    }

    case NodeTypes.CanvasVariableOutput: {
      return ''
    }

    case NodeTypes.CanvasTag: {
      return ''
    }

    case NodeTypes.CanvasBranch: {
      return ''
    }

    case NodeTypes.HtmlComment: {
      const conditionalComment = getConditionalComment(
        node.source.slice(node.position.start, node.position.end)
      )
      if (conditionalComment) {
      }

      return [
        '<!--',
        group([indent([line, join(hardline, reindent(bodyLines(node.body), true))]), line]),
        '-->',
      ]
    }

    case NodeTypes.CanvasVariable: {
      return ''
    }

    case NodeTypes.TextNode: {
      return printTextNode(path as AstPath<TextNode>, options, print)
    }

    default: {
      return assertNever(node)
    }
  }
}

export const printerCanvasHtml: Printer<CanvasHtmlNode> = {
  print: printNode,
  preprocess: preprocess as any,
}
