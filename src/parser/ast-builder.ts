import { getName, isBranchedTag, position, toUnnamedCanvasBranch } from './ast'
import { ConcreteNodeTypes, type ConcreteCanvasTagClose, type ConcreteHtmlTagClose } from './cst'
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

    if (isBranchedTag(node)) {
      this.open(toUnnamedCanvasBranch(node))
    }
  }

  push(node: CanvasHtmlNode) {
    if (node.type === NodeTypes.CanvasBranch) {
      const previousBranch = this.findCloseableParentBranch(node)
      if (previousBranch) {
        previousBranch.blockEndPosition = { start: node.position.start, end: node.position.start }
        // close dangling open HTML nodes
        while (
          this.parent &&
          (this.parent as ParentNode) !== previousBranch &&
          this.parent.type === NodeTypes.HtmlElement
        ) {
          // 0-length blockEndPosition at the position of the next branch
          this.parent.blockEndPosition = { start: node.position.start, end: node.position.start }
          this.closeParentWith(node)
        }
        // close the previous branch
        this.closeParentWith(node)
      }
      this.open(node)
    } else {
      this.current.push(node)
    }
  }

  close(node: ConcreteCloseNode, nodeType: NodeTypes.CanvasTag | NodeTypes.HtmlElement) {
    if (isCanvasBranch(this.parent)) {
      this.parent.blockEndPosition = { start: node.locStart, end: node.locStart }
      this.closeParentWith(node)
    }

    if (!this.parent) {
      throw new Error(`Attempting to close ${nodeType} '${getName(node)}' before it was opened`)
    }

    if (getName(this.parent) !== getName(node) || this.parent.type !== nodeType) {
      const suitableParent = this.findCloseableParentNode(node)

      if (this.parent.type === NodeTypes.HtmlElement && suitableParent) {
        console.log(suitableParent)
      } else {
        throw new Error(
          `Attempting to close ${nodeType} '${getName(node)} before ${this.parent.type} '${getName(this.parent)}' was closed`
        )
      }
    }

    // The parent end is the end of the outer tag.
    this.parent.position.end = node.locEnd
    this.parent.blockEndPosition = position(node)
    if (this.parent.type == NodeTypes.CanvasTag && node.type == ConcreteNodeTypes.CanvasTagClose) {
      this.parent.delimiterWhitespaceStart = node.whitespaceStart ?? ''
      this.parent.delimiterWhitespaceEnd = node.whitespaceEnd ?? ''
    }
    this.cursor.pop()
    this.cursor.pop()
  }

  findCloseableParentBranch(next: CanvasBranch): CanvasBranch | null {
    for (let index = this.cursor.length - 1; index > 0; index -= 2) {
      const parent = deepGet<ParentNode>(this.cursor.slice(0, index), this.ast)
      const parentProperty = this.cursor[index] as string
      const isUnclosedHtmlElement =
        parent.type === NodeTypes.HtmlElement && parentProperty === 'children'
      if (parent.type === NodeTypes.CanvasBranch) {
        return parent
      } else if (!isUnclosedHtmlElement) {
        throw new Error(
          `Attempting to open CanvasBranch '${next.name}' before ${parent.type} '${getName(
            parent
          )}' was closed`
        )
      }
    }
    return null
  }

  findCloseableParentNode(
    current: ConcreteHtmlTagClose | ConcreteCanvasTagClose
  ): CanvasTag | null {
    for (let index = this.cursor.length - 1; index > 0; index -= 2) {
      const parent = deepGet<ParentNode>(this.cursor.slice(0, index), this.ast)
      if (
        getName(parent) === getName(current) &&
        parent.type === NodeTypes.CanvasTag &&
        ['if'].includes(parent.name)
      ) {
        return parent
      } else if (parent.type === NodeTypes.CanvasTag) {
        return null
      }
    }
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
