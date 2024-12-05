import { doc, Doc, Printer } from 'prettier'

import type {
  AstPath,
  CanvasAstPath,
  CanvasHtmlNode,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  CanvasVariableOutput,
  DocumentNode,
  HtmlDanglingMarkerClose,
  HtmlElement,
  TextNode,
} from '@/types'
import { getConditionalComment, NodeTypes } from '@/parser'
import { assertNever } from '@/utils'

import { preprocess } from './print-preprocess'
import { printCanvasVariableOutput } from './print/canvas'
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
      console.log('print:', NodeTypes.HtmlVoidElement)
      return ''
    }

    case NodeTypes.HtmlSelfClosingElement: {
      console.log('print:', NodeTypes.HtmlSelfClosingElement)
      return ''
    }

    case NodeTypes.HtmlRawNode: {
      console.log('print:', NodeTypes.HtmlRawNode)
      return ''
    }

    case NodeTypes.RawMarkup: {
      console.log('print:', NodeTypes.RawMarkup)
      return ''
    }

    case NodeTypes.CanvasVariableOutput: {
      return printCanvasVariableOutput(path as AstPath<CanvasVariableOutput>, options, print, args)
    }

    case NodeTypes.CanvasRawTag: {
      console.log('print:', NodeTypes.CanvasRawTag)
      return ''
    }

    case NodeTypes.CanvasTag: {
      console.log('print:', NodeTypes.CanvasTag)
      return ''
    }

    case NodeTypes.CanvasBranch: {
      console.log('print:', NodeTypes.CanvasBranch)
      return ''
    }

    case NodeTypes.AttrSingleQuoted: {
      console.log('print:', NodeTypes.AttrSingleQuoted)
      return ''
    }

    case NodeTypes.HtmlDoctype: {
      console.log('print:', NodeTypes.HtmlDoctype)
      return ''
    }

    case NodeTypes.HtmlComment: {
      const conditionalComment = getConditionalComment(
        node.source.slice(node.position.start, node.position.end)
      )

      if (conditionalComment) {
        const { startTag, body, endTag } = conditionalComment

        return [
          startTag,
          group([indent([line, join(hardline, reindent(bodyLines(body), true))]), line]),
          endTag,
        ]
      }

      if (
        node.body.includes('prettier-ignore') ||
        node.body.includes('display:') ||
        node.body.includes('white-space:')
      ) {
        return node.source.slice(node.position.start, node.position.end)
      }

      return [
        '<!--',
        group([indent([line, join(hardline, reindent(bodyLines(node.body), true))]), line]),
        '-->',
      ]
    }

    case NodeTypes.LogicalExpression: {
      console.log('print:', NodeTypes.LogicalExpression)
      return ''
    }

    case NodeTypes.CanvasVariable: {
      const name = path.call((p: any) => print(p), 'expression')
      let filters: Doc = ''
      if (node.filters.length > 0) {
        filters = [
          line,
          join(
            line,
            path.map((p) => print(p), 'filters')
          ),
        ]
      }

      return [name, filters]
    }

    case NodeTypes.CanvasFilter: {
      console.log('print:', NodeTypes.CanvasFilter)
      return ''
    }

    case NodeTypes.NamedArgument: {
      console.log('print:', NodeTypes.NamedArgument)
      return ''
    }

    case NodeTypes.TextNode: {
      console.log('print:', NodeTypes.TextNode)
      return printTextNode(path as AstPath<TextNode>, options, print)
    }

    case NodeTypes.String: {
      console.log('print:', NodeTypes.String)
      return ''
    }

    case NodeTypes.VariableLookup: {
      const doc: Doc[] = []
      if (node.name) {
        doc.push(node.name)
      }
      const lookups: Doc[] = []

      return [...doc, ...lookups]
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
