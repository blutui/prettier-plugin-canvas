import type { ConcreteHtmlTagClose } from './cst'
import { CanvasHtmlNode, NodeTypes, ParentNode } from './types'
import { deepGet, dropLast } from '@/utils'

type ConcreteCloseNode = ConcreteHtmlTagClose

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
    } else {
      this.current.push(node)
    }
  }

  close(node: ConcreteCloseNode, nodeType: NodeTypes.CanvasTag | NodeTypes.HtmlElement) {
    this.parent.position.end = node.locEnd
    this.cursor.pop()
    this.cursor.pop()
  }
}
