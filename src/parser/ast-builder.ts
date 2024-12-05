import { getName, position } from './ast'
import type { ConcreteCanvasTagClose, ConcreteHtmlTagClose } from './cst'
import {
  CanvasBranch,
  CanvasBranchNode,
  CanvasHtmlNode,
  CanvasTag,
  NodeTypes,
  ParentNode,
} from './types'
import { deepGet, dropLast } from '@/utils'

type ConcreteCloseNode = ConcreteCanvasTagClose | ConcreteHtmlTagClose

export class ASTBuilder {
  /** The AST is what we're building incrementally */
  ast: CanvasHtmlNode[]

  /**
   * The cursor represents the path to the array we would push nodes to.
   */
  cursor: (string | number)[]

  /** The source is the original string */
  source: string

  /**
   * Create a new AST Builder instance.
   * @param source The source code
   */
  constructor(source: string) {
    this.ast = []
    this.cursor = []
    this.source = source
  }

  get current(): CanvasHtmlNode[] {
    return deepGet<CanvasHtmlNode[]>(this.cursor, this.ast)
  }

  get currentPosition(): number {
    return (this.current || []).length - 1
  }

  get parent(): ParentNode | undefined {
    if (this.cursor.length == 0) return undefined
    return deepGet<ParentNode>(dropLast(1, this.cursor), this.ast)
  }

  get grandparent(): ParentNode | undefined {
    if (this.cursor.length < 4) return undefined
    return deepGet<ParentNode>(dropLast(3, this.cursor), this.ast)
  }

  open(node: CanvasHtmlNode) {
    this.current.push(node)
    this.cursor.push(this.currentPosition)
    this.cursor.push('children')
  }

  push(node: CanvasHtmlNode) {
    if (node.type === NodeTypes.CanvasBranch) {
      console.log('push: canvas branch')
    } else {
      this.current.push(node)
    }
  }

  close(node: ConcreteCloseNode, nodeType: NodeTypes.CanvasTag | NodeTypes.HtmlElement) {
    if (isCanvasBranch(this.parent)) {
      this.parent.blockEndPosition = { start: node.locStart, end: node.locEnd }
      this.closeParentWith(node)
    }

    if (!this.parent) {
      throw new Error(`Attempting to close ${nodeType} '${getName(node)}' before it was opened`)
    }

    if (getName(this.parent) !== getName(node) || this.parent.type !== nodeType) {
      const suitableParent = this.findCloseableParentNode(node)

      if (this.parent.type === NodeTypes.HtmlElement) {
        console.log(suitableParent)
      } else {
        throw new Error(
          `Attempting to close ${nodeType} '${getName(node)} before ${this.parent.type} '${getName(this.parent)}' was closed`
        )
      }
    }

    this.parent.position.end = node.locEnd
    this.parent.blockEndPosition = position(node)
    this.cursor.pop()
    this.cursor.pop()
  }

  findCloseableParentNode(
    current: ConcreteHtmlTagClose | ConcreteCanvasTagClose
  ): CanvasTag | null {
    return null
  }

  closeParentWith(next: CanvasHtmlNode | ConcreteCloseNode) {
    if (this.parent) {
      if ('locStart' in next) {
        this.parent.position.end = next.locStart
      } else {
        this.parent.position.end = next.position.start
      }
    }
    this.cursor.pop()
    this.cursor.pop()
  }
}

function isCanvasBranch(node: CanvasHtmlNode | undefined): node is CanvasBranchNode<any, any> {
  return !!node && node.type === NodeTypes.CanvasBranch
}
