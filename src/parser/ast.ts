import { assertNever } from '@/utils'
import { ASTBuilder } from './ast-builder'
import {
  CanvasCST,
  CanvasHtmlCST,
  ConcreteAttributeNode,
  ConcreteHtmlTagOpen,
  ConcreteNodeTypes,
  ConcreteTextNode,
  toCanvasHtmlCST,
} from './cst'
import {
  AttributeNode,
  CanvasHtmlNode,
  CanvasVariableOutput,
  DocumentNode,
  HtmlElement,
  NodeTypes,
  nonTraversableProperties,
  Position,
  TextNode,
} from './types'

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
        console.log('push: CanvasVariableOutput')
        break
      }

      case ConcreteNodeTypes.CanvasTag: {
        console.log('push: CanvasTag')
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

interface HasPosition {
  locStart: number
  locEnd: number
}

function position(node: HasPosition): Position {
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
