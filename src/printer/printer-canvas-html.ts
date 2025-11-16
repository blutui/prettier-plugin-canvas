import { doc, Doc, Printer } from 'prettier'

import type {
  AstPath,
  AttrDoubleQuoted,
  AttrEmpty,
  AttrSingleQuoted,
  AttrUnquoted,
  CanvasAstPath,
  CanvasBranch,
  CanvasExpression,
  CanvasHtmlNode,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  CanvasRawTag,
  CanvasTag,
  CanvasVariableOutput,
  DocumentNode,
  HtmlDanglingMarkerClose,
  HtmlElement,
  HtmlRawNode,
  HtmlSelfClosingElement,
  HtmlVoidElement,
  RawMarkup,
  TextNode,
} from '@/types'
import {
  getConditionalComment,
  NodeTypes,
  nonTraversableProperties,
  Position,
  RawMarkupKinds,
} from '@/parser'
import { assertNever } from '@/utils'

import { embed } from './embed'
import { preprocess } from './print-preprocess'
import {
  printCanvasBranch,
  printCanvasRawTag,
  printCanvasTag,
  printCanvasVariableOutput,
} from './print/canvas'
import { printChildren } from './print/children'
import { printElement } from './print/element'
import { bodyLines, hasLineBreakInRange, isEmpty, isTextLikeNode, reindent } from './utils'
import { printClosingTagSuffix, printOpeningTagPrefix } from './print/tag'

const { builders, utils } = doc
const { align, fill, group, hardline, dedent, dedentToRoot, indent, join, line, softline } =
  builders

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
      return printElement(path as AstPath<HtmlVoidElement>, options, print, args)
    }

    case NodeTypes.HtmlSelfClosingElement: {
      return printElement(path as AstPath<HtmlSelfClosingElement>, options, print, args)
    }

    case NodeTypes.HtmlRawNode: {
      return printElement(path as AstPath<HtmlRawNode>, options, print, args)
    }

    case NodeTypes.RawMarkup: {
      const isRawMarkupIdentationSensitive = () => {
        switch (node.kind) {
          case RawMarkupKinds.javascript: {
            return node.value.includes('`')
          }
          default: {
            return false
          }
        }
      }

      if (isRawMarkupIdentationSensitive()) {
        return [node.value.trimEnd(), hardline]
      }

      const lines = bodyLines(node.value)
      const rawFirstLineIsntIndented = !!node.value.split(/\r?\n/)[0]?.match(/\S/)
      const shouldSkipFirstLine = rawFirstLineIsntIndented

      const body =
        lines.length > 0 && lines.find((line) => line.trim() !== '')
          ? join(hardline, reindent(lines, shouldSkipFirstLine))
          : softline

      return [indent([hardline, body]), hardline]
    }

    case NodeTypes.CanvasVariableOutput: {
      return printCanvasVariableOutput(path as AstPath<CanvasVariableOutput>, options, print, args)
    }

    case NodeTypes.CanvasRawTag: {
      return printCanvasRawTag(path as AstPath<CanvasRawTag>, options, print, args)
    }

    case NodeTypes.CanvasTag: {
      return printCanvasTag(path as AstPath<CanvasTag>, options, print, args)
    }

    case NodeTypes.CanvasBranch: {
      return printCanvasBranch(path as AstPath<CanvasBranch>, options, print, args)
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

    case NodeTypes.IncludeMarkup: {
      const snippet = path.call((p: any) => print(p), 'snippet')
      const doc: Doc = [snippet]
      if (node.ignoreMissing) {
        doc.push(' ', 'ignore missing')
      }
      if (node.withClause) {
        doc.push(
          ' ',
          path.call((p: any) => print(p), 'withClause')
        )
      }
      if (node.onlyClause) {
        doc.push(' ', 'only')
      }

      return doc
    }

    case NodeTypes.IncludeWithClause: {
      return [node.kind, ' ', path.call((p: any) => print(p), 'value')]
    }

    case NodeTypes.IncludeOnlyClause: {
      return node.value
    }

    case NodeTypes.SetMarkup: {
      const assignments = path.call((p: any) => print(p), 'value')

      return [node.name, ' = ', assignments]
    }

    case NodeTypes.LogicalExpression: {
      console.log('print:', NodeTypes.LogicalExpression)
      return ''
    }

    case NodeTypes.Comparison: {
      return group([
        path.call((p: any) => print(p), 'left'),
        indent([line, node.comparator, ' ', path.call((p: any) => print(p), 'right')]),
      ])
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
      let args: Doc[] = []

      if (node.args.length > 0) {
        const printed = path.map((p) => print(p), 'args')

        args = [
          '(',
          indent(align(2, [softline, join([',', line], printed)])),
          align(2, [softline, ')']),
        ]
      }

      return group(['| ', node.name, ...args])
    }

    case NodeTypes.NamedArgument: {
      return [
        path.call((p: any) => print(p), 'name'),
        ': ',
        path.call((p: any) => print(p), 'value'),
      ]
    }

    case NodeTypes.TextNode: {
      return printTextNode(path as AstPath<TextNode>, options, print)
    }

    case NodeTypes.Concatenation: {
      return [
        path.call((p) => print(p, { truncate: true }), 'start'),
        ' ~ ',
        path.call((p) => print(p, { truncate: true }), 'end'),
      ]
    }

    case NodeTypes.String: {
      const preferredQuote = options.canvasSingleQuote ? `'` : `"`
      const valueHasQuotes = node.value.includes(preferredQuote)
      const quote = valueHasQuotes ? oppositeQuotes[preferredQuote] : preferredQuote

      return [quote, node.value, quote]
    }

    case NodeTypes.Number: {
      if (args.truncate) {
        return node.value.replace(/\.\d+$/, '')
      } else {
        return node.value
      }
    }

    case NodeTypes.Range: {
      return [
        '(',
        path.call((p) => print(p, { truncate: true }), 'start'),
        '..',
        path.call((p) => print(p, { truncate: true }), 'end'),
        ')',
      ]
    }

    case NodeTypes.Sequence: {
      let args: Doc[] = []

      if (node.args.length > 0) {
        const printedArgs = path.map((p) => print(p), 'args')

        args = [softline, join([',', line], printedArgs)]
      }

      return group(['[', ...args, dedent([softline, ']'])])
    }

    case NodeTypes.Mapping: {
      let args: Doc[] = []

      if (node.args.length > 0) {
        const printedArgs = path.map((p) => print(p), 'args')

        args = [
          indent([line, join([',', line], printedArgs)]), // Indent the arguments
          line, // Ensure closing brace is on a new line
        ]
        // args = [softline, join([',', line], printedArgs)]
      }

      return group(['{', ...args, '}'])
    }

    case NodeTypes.CanvasLiteral: {
      return node.keyword
    }

    case NodeTypes.Function: {
      let args: Doc[] = []

      if (node.args.length > 0) {
        const printedArgs = path.map((p) => print(p), 'args')
        const shouldPrintOnSameLine =
          node.args.length === 1 && node.args[0].type === NodeTypes.Mapping

        if (shouldPrintOnSameLine) {
          args = [printedArgs[0]]
        } else {
          args = [indent([softline, join([',', line], printedArgs)]), softline]
        }
      }

      return group([node.name, '(', ...args, ')'])
    }

    case NodeTypes.ArrowFunction: {
      let args: Doc[] = []

      if (node.args.length > 0) {
        const printed = path.map((p) => print(p), 'args')
        const shouldPrintFirstArgumentSameLine = node.args[0].type !== NodeTypes.NamedArgument

        if (shouldPrintFirstArgumentSameLine) {
          const [firstDoc, ...rest] = printed
          const restDoc = isEmpty(rest) ? '' : indent([',', line, join([',', line], rest)])
          args = [firstDoc, restDoc]
        } else {
          args = []
        }
      }

      return group(['(', ...args, ') => ', path.call((p: any) => print(p), 'expression')])
    }

    case NodeTypes.VariableLookup: {
      const doc: Doc[] = []
      if (node.name) {
        doc.push(node.name)
      }
      const lookups: Doc[] = path.map((lookupPath, index) => {
        const lookup = lookupPath.node as CanvasExpression
        switch (lookup.type) {
          case NodeTypes.String: {
            const value = lookup.value
            // We prefer direct access
            // (for everything but stuff with dashes and stuff that starts with a number)
            const isGlobalStringLookup = index === 0 && !node.name
            if (!isGlobalStringLookup && /^\D/.test(value) && /^[a-z0-9_]+\??$/i.test(value)) {
              return ['.', value]
            }
            return ['[', print(lookupPath), ']']
          }
          default: {
            return ['[', print(lookupPath), ']']
          }
        }
      }, 'lookups')

      return [...doc, ...lookups]
    }

    default: {
      return assertNever(node)
    }
  }
}

export const printerCanvasHtml: Printer<CanvasHtmlNode> = {
  print: printNode,
  embed: embed,
  preprocess: preprocess as any,
  getVisitorKeys(node, nonTraversableKeys) {
    return Object.keys(node).filter(
      (key) =>
        !nonTraversableKeys.has(key) &&
        !nonTraversableProperties.has(key) &&
        hasOrIsNode(node, key as keyof CanvasHtmlNode)
    )
  },
}

function hasOrIsNode<N extends CanvasHtmlNode, K extends keyof N>(node: N, key: K) {
  const v = node[key]
  return Array.isArray(v) || isNode(v)
}

function isNode(x: unknown): x is CanvasHtmlNode {
  return x !== null && typeof x === 'object' && 'type' in x && typeof x.type === 'string'
}
