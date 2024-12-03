import { AstPath, Doc, ParserOptions } from 'prettier'

import * as AST from './parser'

export type { AstPath }

export type CanvasAstPath = AstPath<CanvasHtmlNode>
export type CanvasParserOptions = ParserOptions<CanvasHtmlNode> & {}
export type CanvasPrinterArgs = {
  leadingSpaceGroupId?: Symbol[] | Symbol
  trailingSpaceGroupId?: Symbol[] | Symbol
}
export type CanvasPrinter = (path: CanvasAstPath, args?: CanvasPrinterArgs) => Doc

export type Augmented<T, Aug> = {
  [Property in keyof T]: [T[Property]] extends [(infer Item)[] | undefined]
    ? [Item] extends [AST.CanvasHtmlNode]
      ? Augmented<Item, Aug>[]
      : Item[]
    : T[Property] extends infer P
      ? P extends AST.CanvasHtmlNode
        ? Augmented<P, Aug>
        : P
      : never
} & Aug

export type AllAugmentations = WithParent &
  WithSiblings &
  WithFamily &
  WithCssProperties &
  WithWhitespaceHelpers

export type WithParent = {
  parentNode?: ParentNode
}

export type WithSiblings = {
  prev: CanvasHtmlNode | undefined
  next: CanvasHtmlNode | undefined
}

export type WithFamily = {
  firstChild: CanvasHtmlNode | undefined
  lastChild: CanvasHtmlNode | undefined
}

export type WithCssProperties = {
  cssDisplay: string
  cssWhitespace: string
}

export type WithWhitespaceHelpers = {
  hasLeadingWhitespace: boolean
  hasTrailingWhitespace: boolean
  isLeadingWhitespaceSensitive: boolean
  isTrailingWhitespaceSensitive: boolean
}

export type AugmentedNode<Aug> = Augmented<AST.CanvasHtmlNode, Aug>

export type Augment<Aug> = <NodeType extends AugmentedNode<Aug>>(
  options: CanvasParserOptions,
  node: NodeType,
  parentNode?: NodeType
) => void

export type CanvasHtmlNode = Augmented<AST.CanvasHtmlNode, AllAugmentations>
export type DocumentNode = Augmented<AST.DocumentNode, AllAugmentations>
export type CanvasNode = Augmented<AST.CanvasNode, AllAugmentations>
export type ParentNode = Augmented<AST.ParentNode, AllAugmentations>
export type CanvasTag = Augmented<AST.CanvasNode, AllAugmentations>
export type CanvasVariableOutput = Augmented<AST.CanvasNode, AllAugmentations>
export type HtmlNode = Augmented<AST.HtmlNode, AllAugmentations>
export type HtmlTag = Exclude<HtmlNode, HtmlComment>
export type HtmlElement = Augmented<AST.HtmlElement, AllAugmentations>
export type HtmlDanglingMarkerClose = Augmented<AST.HtmlDanglingMarkerClose, AllAugmentations>
export type HtmlVoidElement = Augmented<AST.HtmlVoidElement, AllAugmentations>
export type HtmlSelfClosingElement = Augmented<AST.HtmlSelfClosingElement, AllAugmentations>
export type HtmlComment = Augmented<AST.HtmlComment, AllAugmentations>
export type TextNode = Augmented<AST.TextNode, AllAugmentations>
