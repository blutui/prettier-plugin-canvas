import { assertNever } from '@/utils'
import { ASTBuilder } from './ast-builder'
import {
  CanvasCST,
  CanvasHtmlConcreteNode,
  CanvasHtmlCST,
  ConcreteAttributeNode,
  ConcreteCanvasExpression,
  ConcreteCanvasFilter,
  ConcreteCanvasTag,
  ConcreteCanvasTagClose,
  ConcreteCanvasTagNamed,
  ConcreteCanvasTagOpen,
  ConcreteCanvasVariable,
  ConcreteCanvasVariableOutput,
  ConcreteHtmlTagClose,
  ConcreteHtmlTagOpen,
  ConcreteNodeTypes,
  ConcreteTextNode,
  toCanvasHtmlCST,
} from './cst'
import {
  AttributeNode,
  CanvasBranch,
  CanvasExpression,
  CanvasFilter,
  CanvasHtmlNode,
  CanvasTag,
  CanvasVariable,
  CanvasVariableOutput,
  DocumentNode,
  HtmlElement,
  NodeTypes,
  nonTraversableProperties,
  ParentNode,
  Position,
  TextNode,
} from './types'
import { TAGS_WITHOUT_MARKUP } from './grammar'

export function isBranchedTag(node: CanvasHtmlNode) {
  return node.type === NodeTypes.CanvasTag && ['if', 'for'].includes(node.name)
}

function isConcreteCanvasBranchDisguisedAsTag(
  node: CanvasHtmlConcreteNode
): node is ConcreteCanvasTag & { name: 'else' } {
  return node.type === ConcreteNodeTypes.CanvasTag && ['else'].includes(node.name)
}

export function toCanvasHtmlAST(source: string): DocumentNode {
  const cst = toCanvasHtmlCST(source)
  return {
    type: NodeTypes.Document,
    source: source,
    name: '#document',
    children: cstToAst(cst),
    position: {
      start: 0,
      end: source.length,
    },
  }
}

export function getName(
  node: ConcreteCanvasTagClose | ConcreteHtmlTagClose | ParentNode | undefined
): string | null {
  if (!node) return null

  switch (node.type) {
    case NodeTypes.HtmlElement:
    case NodeTypes.HtmlDanglingMarkerClose:
    case NodeTypes.HtmlSelfClosingElement:
    case ConcreteNodeTypes.HtmlTagClose:
      return node.name
        .map((part) => {
          if (part.type === NodeTypes.TextNode || part.type === ConcreteNodeTypes.TextNode) {
            return part.value
          } else if (typeof part.markup === 'string') {
            return `{{${part.markup.trim()}}}`
          } else {
            return `{{${part.markup.rawSource}}}`
          }
        })
        .join('')
    case NodeTypes.AttrSingleQuoted:
      return node.name
        .map((part) => {
          if (typeof part === 'string') {
            return part
          } else {
            return part.source.slice(part.position.start, part.position.end)
          }
        })
        .join('')
    default:
      return node.name
  }
}

export function cstToAst(
  cst: CanvasHtmlCST | CanvasCST | ConcreteAttributeNode[]
): CanvasHtmlNode[] {
  if (cst.length === 0) return []

  const builder = buildAst(cst)

  return builder.ast
}

function buildAst(cst: CanvasHtmlCST | CanvasCST | ConcreteAttributeNode[]) {
  const builder = new ASTBuilder(cst[0].source)

  for (let i = 0; i < cst.length; i++) {
    const node = cst[i]

    switch (node.type) {
      case ConcreteNodeTypes.TextNode: {
        builder.push(toTextNode(node))
        break
      }

      case ConcreteNodeTypes.CanvasVariableOutput: {
        builder.push(toCanvasVariableOutput(node))
        break
      }

      case ConcreteNodeTypes.CanvasTagOpen: {
        console.log('open: CanvasTagOpen')
        break
      }

      case ConcreteNodeTypes.CanvasTagClose: {
        console.log('close: CanvasTagOpen')
        break
      }

      case ConcreteNodeTypes.CanvasTag: {
        builder.push(toCanvasTag(node))
        break
      }

      case ConcreteNodeTypes.CanvasRawTag: {
        console.log('push CanvasRawTag')
        break
      }

      case ConcreteNodeTypes.HtmlTagOpen: {
        builder.open(toHtmlElement(node))
        break
      }

      case ConcreteNodeTypes.HtmlTagClose: {
        if (isAcceptableDanglingMarkerClose(builder, cst as CanvasHtmlCST, i)) {
          console.log('push: DanglingMarker')
        } else {
          builder.close(node, NodeTypes.HtmlElement)
        }
        break
      }

      case ConcreteNodeTypes.HtmlComment: {
        builder.push({
          type: NodeTypes.HtmlComment,
          body: node.body,
          position: position(node),
          source: node.source,
        })
        break
      }

      default: {
        assertNever(node)
      }
    }
  }

  return builder
}

function toAttributes(attrList: ConcreteAttributeNode[]): AttributeNode[] {
  return cstToAst(attrList) as AttributeNode[]
}

function toCanvasTag(node: ConcreteCanvasTag | ConcreteCanvasTagOpen): CanvasTag | CanvasBranch {
  if (typeof node.markup !== 'string') {
    return toNamedCanvasTag(node as ConcreteCanvasTagNamed)
  } else if (isConcreteCanvasBranchDisguisedAsTag(node)) {
    return toNamedCanvasBranchBaseCase(node)
  }

  return {
    name: node.name,
    markup: markup(node.name, node.markup),
  }
}

function toCanvasVariableOutput(node: ConcreteCanvasVariableOutput): CanvasVariableOutput {
  return {
    type: NodeTypes.CanvasVariableOutput,
    markup: typeof node.markup === 'string' ? node.markup : toCanvasVariable(node.markup),
    whitespaceStart: node.whitespaceStart ?? '',
    whitespaceEnd: node.whitespaceEnd ?? '',
    position: position(node),
    source: node.source,
  }
}

function toCanvasVariable(node: ConcreteCanvasVariable): CanvasVariable {
  return {
    type: NodeTypes.CanvasVariable,
    expression: toExpression(node.expression),
    filters: node.filters.map(toFilter),
    position: position(node),
    rawSource: node.rawSource,
    source: node.source,
  }
}

function toExpression(node: ConcreteCanvasExpression): CanvasExpression {
  switch (node.type) {
    case ConcreteNodeTypes.String: {
      return {
        type: NodeTypes.String,
        position: position(node),
        single: node.single,
        value: node.value,
        source: node.source,
      }
    }

    case ConcreteNodeTypes.VariableLookup: {
      return {
        type: NodeTypes.VariableLookup,
        name: node.name,
        lookups: node.lookups.map(toExpression),
        position: position(node),
        source: node.source,
      }
    }

    default: {
      return assertNever(node)
    }
  }
}

function toFilter(node: ConcreteCanvasFilter): CanvasFilter {
  return {
    type: NodeTypes.CanvasFilter,
    name: node.name,
    args: node.args.map(toCanvasArgument),
    position: position(node),
    source: node.source,
  }
}

function toHtmlElement(node: ConcreteHtmlTagOpen): HtmlElement {
  return {
    type: NodeTypes.HtmlElement,
    name: cstToAst(node.name) as (TextNode | CanvasVariableOutput)[],
    attributes: toAttributes(node.attrList || []),
    position: position(node),
    blockStartPosition: position(node),
    blockEndPosition: { start: -1, end: -1 },
    children: [],
    source: node.source,
  }
}

function toTextNode(node: ConcreteTextNode): TextNode {
  return {
    type: NodeTypes.TextNode,
    value: node.value,
    position: position(node),
    source: node.source,
  }
}

function isAcceptableDanglingMarkerClose(
  builder: ASTBuilder,
  cst: CanvasHtmlCST,
  currIndex: number
): boolean {
  return isAcceptableDanglingMarker(builder)
}

function isAcceptableDanglingMarker(builder: ASTBuilder): boolean {
  const { parent, grandparent } = builder
  if (!parent || !grandparent) return false
  return (
    parent.type === NodeTypes.CanvasBranch &&
    grandparent.type === NodeTypes.CanvasTag &&
    ['if'].includes(grandparent.name)
  )
}

function markup(name: string, markup: string) {
  if (TAGS_WITHOUT_MARKUP.includes(name)) return ''
  return markup
}

interface HasPosition {
  locStart: number
  locEnd: number
}

export function position(node: HasPosition): Position {
  return {
    start: node.locStart,
    end: node.locEnd,
  }
}

export function walk(
  ast: CanvasHtmlNode,
  fn: (ast: CanvasHtmlNode, parentNode: CanvasHtmlNode | undefined) => void,
  parentNode?: CanvasHtmlNode
) {
  for (const key of Object.keys(ast)) {
    if (nonTraversableProperties.has(key)) {
      continue
    }

    const value = (ast as any)[key]
    if (Array.isArray(value)) {
      value.filter(isCanvasHtmlNode).forEach((node: CanvasHtmlNode) => walk(node, fn, ast))
    } else if (isCanvasHtmlNode(value)) {
      walk(value, fn, ast)
    }
  }

  fn(ast, parentNode)
}

export function isCanvasHtmlNode(value: any): value is CanvasHtmlNode {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    NodeTypes.hasOwnProperty(value.type)
  )
}
