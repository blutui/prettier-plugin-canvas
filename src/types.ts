import { AstPath, Doc, ParserOptions } from 'prettier'

import * as AST from './parser'

export type { AstPath }

export function isCanvasHtmlNode(value: any): value is CanvasHtmlNode {
  return (
    value !== null &&
    typeof value === 'object' &&
    'type' in value &&
    AST.NodeTypes.hasOwnProperty(value.type)
  )
}

export type CanvasAstPath = AstPath<CanvasHtmlNode>
export type CanvasParserOptions = ParserOptions<CanvasHtmlNode> & {}
export type CanvasPrinterArgs = {
  leadingSpaceGroupId?: symbol[] | symbol
  trailingSpaceGroupId?: symbol[] | symbol
}
export type CanvasPrinter = (path: AstPath<CanvasHtmlNode>, args?: CanvasPrinterArgs) => Doc

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
  isDanglingWhitespaceSensitive: boolean
  isWhitespaceSensitive: boolean
  isLeadingWhitespaceSensitive: boolean
  isTrailingWhitespaceSensitive: boolean
  isIndentationSensitive: boolean
  hasLeadingWhitespace: boolean
  hasTrailingWhitespace: boolean
  hasDanglingWhitespace: boolean
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
export type CanvasStatement = Augmented<AST.CanvasStatement, AllAugmentations>
export type ParentNode = Augmented<AST.ParentNode, AllAugmentations>
export type CanvasRawTag = Augmented<AST.CanvasRawTag, AllAugmentations>
export type CanvasTag = Augmented<AST.CanvasNode, AllAugmentations>
export type CanvasTagNamed = Augmented<AST.CanvasTagNamed, AllAugmentations>
export type CanvasBranch = Augmented<AST.CanvasBranch, AllAugmentations>
export type CanvasBranchNamed = Augmented<AST.CanvasBranchNamed, AllAugmentations>
export type CanvasVariableOutput = Augmented<AST.CanvasVariableOutput, AllAugmentations>
export type HtmlNode = Augmented<AST.HtmlNode, AllAugmentations>
export type HtmlTag = Exclude<HtmlNode, HtmlComment>
export type HtmlElement = Augmented<AST.HtmlElement, AllAugmentations>
export type HtmlDanglingMarkerClose = Augmented<AST.HtmlDanglingMarkerClose, AllAugmentations>
export type HtmlVoidElement = Augmented<AST.HtmlVoidElement, AllAugmentations>
export type HtmlSelfClosingElement = Augmented<AST.HtmlSelfClosingElement, AllAugmentations>
export type HtmlRawNode = Augmented<AST.HtmlRawNode, AllAugmentations>
export type HtmlDoctype = Augmented<AST.HtmlDoctype, AllAugmentations>
export type HtmlComment = Augmented<AST.HtmlComment, AllAugmentations>
export type AttributeNode = Augmented<AST.AttributeNode, AllAugmentations>
export type AttrSingleQuoted = Augmented<AST.AttrSingleQuoted, AllAugmentations>
export type AttrDoubleQuoted = Augmented<AST.AttrDoubleQuoted, AllAugmentations>
export type AttrUnquoted = Augmented<AST.AttrUnquoted, AllAugmentations>
export type AttrEmpty = Augmented<AST.AttrEmpty, AllAugmentations>
export type CanvasExpression = Augmented<AST.CanvasExpression, AllAugmentations>
export type TextNode = Augmented<AST.TextNode, AllAugmentations>
export type RawMarkup = Augmented<AST.RawMarkup, AllAugmentations>
