export enum NodeTypes {
  Document = 'Document',
  CanvasRawTag = 'CanvasRawTag',
  CanvasTag = 'CanvasTag',
  CanvasBranch = 'CanvasBranch',
  CanvasVariableOutput = 'CanvasVariableOutput',
  HtmlSelfClosingElement = 'HtmlSelfClosingElement',
  HtmlVoidElement = 'HtmlVoidElement',
  HtmlDoctype = 'HtmlDoctype',
  HtmlComment = 'HtmlComment',
  HtmlElement = 'HtmlElement',
  HtmlDanglingMarkerClose = 'HtmlDanglingMarkerClose',
  HtmlRawNode = 'HtmlRawNode',
  AttrSingleQuoted = 'AttrSingleQuoted',
  AttrDoubleQuoted = 'AttrDoubleQuoted',
  AttrUnquoted = 'AttrUnquoted',
  AttrEmpty = 'AttrEmpty',
  TextNode = 'TextNode',

  CanvasVariable = 'CanvasVariable',
  CanvasFilter = 'CanvasFilter',
  NamedArgument = 'NamedArgument',
  String = 'String',
  VariableLookup = 'VariableLookup',
  LogicalExpression = 'LogicalExpression',

  RawMarkup = 'RawMarkup',
  IncludeMarkup = 'IncludeMarkup',
}

export interface Position {
  start: number
  end: number
}

export type CanvasHtmlNode =
  | DocumentNode
  | CanvasNode
  | HtmlDoctype
  | HtmlNode
  | AttributeNode
  | CanvasVariable
  | CanvasExpression
  | CanvasFilter
  | CanvasNamedArgument
  | RawMarkup
  | CanvasLogicalExpression
  | TextNode

/** The root node of all CanvasHTML ASTs */
export interface DocumentNode extends ASTNode<NodeTypes.Document> {
  children: CanvasHtmlNode[]
  name: '#document'
}

export type CanvasNode = CanvasRawTag | CanvasTag | CanvasVariableOutput | CanvasBranch

export type CanvasStatement = CanvasRawTag | CanvasTag | CanvasBranch

export interface HasChildren {
  children?: CanvasHtmlNode[]
}
export interface HasAttributes {
  attributes: AttributeNode[]
}
export interface HasValue {
  value: (TextNode | CanvasNode)[]
}
export interface HasName {
  name: string | CanvasVariableOutput
}
export interface HasCompoundName {
  name: (TextNode | CanvasNode)[]
}

export type ParentNode = Extract<
  CanvasHtmlNode,
  HasChildren | HasAttributes | HasValue | HasName | HasCompoundName
>

/**
 * A CanvasRawTag is one that is parsed such that its body is a raw string.
 */
export interface CanvasRawTag extends ASTNode<NodeTypes.CanvasRawTag> {
  name: string

  /** The non-name part inside the opening Canvas tag. {% tagName [markup] %} */
  markup: string

  body: RawMarkup

  whitespaceStart: '-' | ''
  whitespaceEnd: '-' | ''
  delimiterWhitespaceStart: '-' | ''
  delimiterWhitespaceEnd: '-' | ''

  blockStartPosition: Position
  blockEndPosition: Position
}

export type CanvasTag = CanvasTagNamed | CanvasTagBaseCase

export type CanvasTagNamed = CanvasTagDo | CanvasTagInclude

export interface CanvasTagNode<Name, Markup> extends ASTNode<NodeTypes.CanvasTag> {
  /** eg. if, for, etc. */
  name: Name

  /** The non-name part inside the opening Canvas tag. {% tagName [markup] } */
  markup: Markup

  /** If the node has child nodes, the array of child nodes */
  children?: CanvasHtmlNode[]

  whitespaceStart: '-' | ''
  whitespaceEnd: '-' | ''
  delimiterWhitespaceStart?: '-' | ''
  delimiterWhitespaceEnd?: '-' | ''

  /** The range of the opening tag {% tag %} */
  blockStartPosition: Position
  /** The range of the closing tag {% endtag %}, if it has one */
  blockEndPosition?: Position
}

export interface CanvasTagBaseCase extends CanvasTagNode<string, string> {}

export interface CanvasTagDo extends CanvasTagNode<NamedTags.do, CanvasVariable> {}

export interface CanvasBranchElseif
  extends CanvasBranchNode<NamedTags.elseif, CanvasConditionalExpression> {}

export type CanvasConditionalExpression = CanvasLogicalExpression | CanvasExpression

export interface CanvasLogicalExpression extends ASTNode<NodeTypes.LogicalExpression> {
  relation: 'and' | 'or'
  left: CanvasConditionalExpression
  right: CanvasConditionalExpression
}

export interface CanvasTagInclude extends CanvasTagNode<NamedTags.include, IncludeMarkup> {}

export interface IncludeMarkup extends ASTNode<NodeTypes.IncludeMarkup> {}

export type CanvasBranch = CanvasBranchUnnamed | CanvasBranchBaseCase | CanvasBranchNamed

export type CanvasBranchNamed = CanvasBranchElseif

export interface CanvasBranchNode<Name, Markup> extends ASTNode<NodeTypes.CanvasBranch> {
  name: Name

  /** {% name [markup] %} */
  markup: Markup

  /** The child nodes of the branch */
  children: CanvasHtmlNode[]

  whitespaceStart: '-' | ''
  whitespaceEnd: '-' | ''

  blockStartPosition: Position
  blockEndPosition: Position
}

export interface CanvasBranchUnnamed extends CanvasBranchNode<null, string> {}

export interface CanvasBranchBaseCase extends CanvasBranchNode<string, string> {}

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

export type CanvasExpression = CanvasString | CanvasVariableLookup

export interface CanvasFilter extends ASTNode<NodeTypes.CanvasFilter> {
  name: string

  args: CanvasArgument[]
}

export type CanvasArgument = CanvasExpression | CanvasNamedArgument

export interface CanvasNamedArgument extends ASTNode<NodeTypes.NamedArgument> {
  name: string

  value: CanvasExpression
}

export interface CanvasString extends ASTNode<NodeTypes.String> {
  single: boolean

  value: string
}

export interface CanvasVariableLookup extends ASTNode<NodeTypes.VariableLookup> {
  name: string | null

  lookups: CanvasExpression[]
}

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

  /** The range covered by the dangling end tag */
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
  verbatim = 'verbatim',
}

export interface RawMarkup extends ASTNode<NodeTypes.RawMarkup> {
  kind: RawMarkupKinds
  value: string
  nodes: (CanvasNode | TextNode)[]
}

export interface HtmlDoctype extends ASTNode<NodeTypes.HtmlDoctype> {
  legacyDoctypeString: string | null
}

export interface HtmlComment extends ASTNode<NodeTypes.HtmlComment> {
  body: string
}

export interface HtmlNodeBase<T> extends ASTNode<T> {
  attributes: AttributeNode[]
  blockStartPosition: Position
}

export type AttributeNode =
  | CanvasNode
  | AttrSingleQuoted
  | AttrDoubleQuoted
  | AttrUnquoted
  | AttrEmpty

export interface AttrSingleQuoted extends AttributeNodeBase<NodeTypes.AttrSingleQuoted> {}

export interface AttrDoubleQuoted extends AttributeNodeBase<NodeTypes.AttrDoubleQuoted> {}

export interface AttrUnquoted extends AttributeNodeBase<NodeTypes.AttrUnquoted> {}

export interface AttrEmpty extends ASTNode<NodeTypes.AttrEmpty> {
  name: (TextNode | CanvasVariableOutput)[]
}

export interface AttributeNodeBase<T> extends ASTNode<T> {
  name: (TextNode | CanvasVariableOutput)[]

  value: ValueNode[]

  attributePosition: Position
}

export interface TextNode extends ASTNode<NodeTypes.TextNode> {
  value: string
}

export interface ASTNode<T> {
  /**
   * The type of the node, as a string.
   * This property is used in discriminated unions.
   */
  type: T

  /** The range that the node covers */
  position: Position

  /** The contents of the entire document */
  source: string
}

export enum NamedTags {
  do = 'do',
  elseif = 'elseif',
  if = 'if',
  include = 'include',
}

export const HtmlNodeTypes = [
  NodeTypes.HtmlElement,
  NodeTypes.HtmlDanglingMarkerClose,
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
