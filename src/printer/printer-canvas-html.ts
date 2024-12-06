import { doc, Doc, Printer } from 'prettier'

import type {
  AstPath,
  AttrDoubleQuoted,
  AttrEmpty,
  AttrSingleQuoted,
  AttrUnquoted,
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
import { getConditionalComment, NodeTypes, Position } from '@/parser'
import { assertNever } from '@/utils'

import { preprocess } from './print-preprocess'
import { printCanvasVariableOutput } from './print/canvas'
import { printChildren } from './print/children'
import { printElement } from './print/element'
import { bodyLines, hasLineBreakInRange, isTextLikeNode, reindent } from './utils'
import { printClosingTagSuffix, printOpeningTagPrefix } from './print/tag'

const { builders, utils } = doc
const { fill, group, hardline, indent, join, line, softline } = builders

const oppositeQuotes = {
  '"': "'",
  "'": '"',
}

function printAttributeName(
  path: AstPath<AttrEmpty | AttrSingleQuoted | AttrUnquoted | AttrDoubleQuoted>,
  _options: CanvasParserOptions,
  print: CanvasPrinter
): Doc {
  const node = path.node
  node.name
  return join(
    '',
    (path as any).map((part: AstPath<string | CanvasVariableOutput>) => {
      const value = part.node
      if (typeof value === 'string') {
        return value
      } else {
        // We want to force the CanvasVariableOutput to be on one line to avoid weird
        // issues.
        return utils.removeLines(print(part as AstPath<CanvasVariableOutput>))
      }
    }, 'name')
  )
}

function printAttribute<T extends Extract<CanvasHtmlNode, { attributePosition: Position }>>(
  path: AstPath<T>,
  options: CanvasParserOptions,
  print: CanvasPrinter
): Doc {
  const node = path.node
  const attrGroupId = Symbol('attr-group-id')

  const value = node.source.slice(node.attributePosition.start, node.attributePosition.end)
  const preferredQuote = options.singleQuote ? `'` : `"`
  const attributeValueContainsQuote = !!node.value.find(
    (valueNode) => isTextLikeNode(valueNode) && valueNode.value.includes(preferredQuote)
  )
  const quote = attributeValueContainsQuote ? oppositeQuotes[preferredQuote] : preferredQuote

  return [
    printAttributeName(path, options, print),
    '=',
    quote,
    hasLineBreakInRange(node.source, node.attributePosition.start, node.attributePosition.end)
      ? group([indent([softline, join(hardline, reindent(bodyLines(value), true))]), softline], {
          id: attrGroupId,
        })
      : value,
    quote,
  ]
}

function printTextNode(
  path: AstPath<TextNode>,
  options: CanvasParserOptions,
  _print: CanvasPrinter
) {
  const node = path.node

  if (node.value.match(/^\s*$/)) return ''
  const text = node.value

  const paragraphs = text
    .split(/(\r?\n){2,}/)
    .filter(Boolean)
    .map((curr) => {
      let doc = []
      const words = curr.trim().split(/\s+/g)
      let isFirst = true
      for (let j = 0; j < words.length; j++) {
        const word = words[j]
        if (isFirst) {
          isFirst = false
        } else {
          doc.push(line)
        }
        doc.push(word)
      }
      return fill(doc)
    })

  return [
    printOpeningTagPrefix(node, options),
    join(hardline, paragraphs),
    printClosingTagSuffix(node, options),
  ]
}

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

    case NodeTypes.AttrEmpty: {
      return printAttributeName(path as AstPath<AttrEmpty>, options, print)
    }

    case NodeTypes.AttrUnquoted:
    case NodeTypes.AttrSingleQuoted:
    case NodeTypes.AttrDoubleQuoted: {
      return printAttribute(
        path as AstPath<AttrUnquoted | AttrSingleQuoted | AttrDoubleQuoted>,
        options,
        print
      )
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
