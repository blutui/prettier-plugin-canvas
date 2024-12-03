export enum NodeTypes {
  Document = 'Document',
  CanvasTag = 'CanvasTag',
  CanvasBranch = 'CanvasBranch',
  CanvasVariableOutput = 'CanvasVariableOutput',
  HtmlSelfClosingElement = 'HtmlSelfClosingElement',
  HtmlVoidElement = 'HtmlVoidElement',
  HtmlComment = 'HtmlComment',
  HtmlElement = 'HtmlElement',
  HtmlDanglingMarkerClose = 'HtmlDanglingMarkerClose',
  HtmlRawNode = 'HtmlRawNode',
  TextNode = 'TextNode',

  CanvasVariable = 'CanvasVariable',
  CanvasFilter = 'CanvasFilter',

  DoMarkup = 'DoMarkup',
  RawMarkup = 'RawMarkup',
}

export interface Position {
  start: number
  end: number
}

export type CanvasHtmlNode = DocumentNode | CanvasNode | HtmlNode | CanvasVariable | TextNode

export interface DocumentNode extends ASTNode<NodeTypes.Document> {
  children: CanvasHtmlNode[]
  name: '#document'
}

export type CanvasNode = CanvasTag | CanvasVariableOutput | CanvasBranch

export interface HasChildren {
  children?: CanvasHtmlNode[]
}
export interface HasValue {
  value: (TextNode | CanvasNode)[]
}

export type ParentNode = Extract<CanvasHtmlNode, HasChildren | HasValue>

export type CanvasTag = CanvasTagNamed

export type CanvasTagNamed = CanvasTagDo

export interface CanvasTagNode<Name, Markup> extends ASTNode<NodeTypes.CanvasTag> {
  name: Name

  markup: Markup

  children?: CanvasHtmlNode[]
}

export interface CanvasTagDo extends CanvasTagNode<NamedTags.do, DoMarkup> {}
export interface DoMarkup extends ASTNode<NodeTypes.DoMarkup> {}

export interface CanvasVariableOutput extends ASTNode<NodeTypes.CanvasVariableOutput> {
  markup: string | CanvasVariable
  whitespaceStart: '-' | ''
  whitespaceEnd: '-' | ''
}

export interface CanvasVariable extends ASTNode<NodeTypes.CanvasVariable> {
  expression: CanvasExpression

  filters: CanvasFilter[]

  rawSource: string
}

export type CanvasExpression = ''

export interface CanvasFilter extends ASTNode<NodeTypes.CanvasFilter> {
  name: string

  args: CanvasArgument[]
}

export type CanvasArgument = CanvasExpression

export interface TextNode extends ASTNode<NodeTypes.TextNode> {
  value: string
}

export interface ASTNode<T> {
  type: T
  position: Position
  source: string
}

export type CanvasBranch = CanvasBranchUnnamed

interface CanvasBranchNode<Name, Markup> extends ASTNode<NodeTypes.CanvasBranch> {
  name: Name

  markup: Markup

  children: CanvasHtmlNode[]
}

export interface CanvasBranchUnnamed extends CanvasBranchNode<null, string> {}

export type HtmlNode =
  | HtmlComment
  | HtmlElement
  | HtmlDanglingMarkerClose
  | HtmlVoidElement
  | HtmlSelfClosingElement
  | HtmlRawNode

export interface HtmlElement extends HtmlNodeBase<NodeTypes.HtmlElement> {
  /** The name of the tag can be compounded */
  name: (TextNode | CanvasVariableOutput)[]

  /** The child nodes delimited by the start and end tags */
  children: CanvasHtmlNode[]

  /** The range covered by the end tag */
  blockEndPosition: Position
}

export interface HtmlDanglingMarkerClose extends ASTNode<NodeTypes.HtmlDanglingMarkerClose> {
  name: (TextNode | CanvasVariableOutput)[]

  blockStartPosition: Position
}

export interface HtmlSelfClosingElement extends HtmlNodeBase<NodeTypes.HtmlSelfClosingElement> {
  name: (TextNode | CanvasVariableOutput)[]
}

export interface HtmlVoidElement extends HtmlNodeBase<NodeTypes.HtmlVoidElement> {
  name: string
}

export interface HtmlRawNode extends HtmlNodeBase<NodeTypes.HtmlRawNode> {
  body: RawMarkup

  name: string

  blockEndPosition: Position
}

export enum RawMarkupKinds {
  css = 'css',
}

export interface RawMarkup extends ASTNode<NodeTypes.RawMarkup> {
  kind: RawMarkupKinds
  value: string
  nodes: (CanvasNode | TextNode)[]
}

export interface HtmlComment extends ASTNode<NodeTypes.HtmlComment> {
  body: string
}

export interface HtmlNodeBase<T> extends ASTNode<T> {
  attributes: AttributeNode[]
  blockStartPosition: Position
}

export type AttributeNode = CanvasNode

export enum NamedTags {
  do = 'do',
  include = 'include',
}

export const HtmlNodeTypes = [
  NodeTypes.HtmlElement,
  NodeTypes.HtmlRawNode,
  NodeTypes.HtmlVoidElement,
  NodeTypes.HtmlSelfClosingElement,
] as const

export const CanvasNodeTypes = [
  NodeTypes.CanvasTag,
  NodeTypes.CanvasVariableOutput,
  NodeTypes.CanvasBranch,
] as const

export const nonTraversableProperties = new Set([
  'parentNode',
  'prev',
  'next',
  'firstChild',
  'lastChild',
])
