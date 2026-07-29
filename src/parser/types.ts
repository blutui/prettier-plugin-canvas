import { ConcreteCanvasLiteral } from './cst'

export enum NodeTypes {
  Document = 'Document',
  CanvasRawTag = 'CanvasRawTag',
  CanvasTag = 'CanvasTag',
  CanvasBranch = 'CanvasBranch',
  CanvasVariableOutput = 'CanvasVariableOutput',
  CanvasComment = 'CanvasComment',
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
  Concatenation = 'Concatenation',
  String = 'String',
  Number = 'Number',
  CanvasLiteral = 'CanvasLiteral',
  Range = 'Range',
  Sequence = 'Sequence',
  Mapping = 'Mapping',
  Function = 'Function',
  ArrowFunction = 'ArrowFunction',
  VariableLookup = 'VariableLookup',
  Comparison = 'Comparison',
  TestExpression = 'TestExpression',
  TernaryExpression = 'TernaryExpression',
  UnaryExpression = 'UnaryExpression',
  LogicalExpression = 'LogicalExpression',

  RawMarkup = 'RawMarkup',
  IncludeMarkup = 'IncludeMarkup',
  SetMarkup = 'SetMarkup',
  ForMarkup = 'ForMarkup',
  ApplyMarkup = 'ApplyMarkup',
  AutoescapeMarkup = 'AutoescapeMarkup',
  WithMarkup = 'WithMarkup',
  FormMarkup = 'FormMarkup',
  MacroMarkup = 'MacroMarkup',
  MacroParameter = 'MacroParameter',
  BlockMarkup = 'BlockMarkup',
  GuardMarkup = 'GuardMarkup',
  IncludeWithClause = 'IncludeWithClause',
  IncludeOnlyClause = 'IncludeOnlyClause',
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
  | IncludeMarkup
  | IncludeWithClause
  | IncludeOnlyClause
  | SetMarkup
  | ForMarkup
  | ApplyMarkup
  | AutoescapeMarkup
  | WithMarkup
  | FormMarkup
  | MacroMarkup
  | MacroParameter
  | BlockMarkup
  | GuardMarkup
  | CanvasLogicalExpression
  | CanvasUnaryExpression
  | CanvasComparison
  | CanvasTestExpression
  | TextNode

/** The root node of all CanvasHTML ASTs */
export interface DocumentNode extends ASTNode<NodeTypes.Document> {
  children: CanvasHtmlNode[]
  name: '#document'
}

export type CanvasNode =
  | CanvasRawTag
  | CanvasTag
  | CanvasVariableOutput
  | CanvasBranch
  | CanvasComment

export type CanvasStatement = CanvasRawTag | CanvasTag | CanvasBranch

/**
 * Whitespace control modifiers. `-` trims all surrounding whitespace including
 * newlines, `~` trims only the whitespace on the line.
 */
export type CanvasTrim = '-' | '~' | ''

/** A Canvas comment: `{# ... #}`. The body is never reflowed. */
export interface CanvasComment extends ASTNode<NodeTypes.CanvasComment> {
  body: string
  whitespaceStart: CanvasTrim
  whitespaceEnd: CanvasTrim
}

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

  whitespaceStart: CanvasTrim
  whitespaceEnd: CanvasTrim
  delimiterWhitespaceStart: CanvasTrim
  delimiterWhitespaceEnd: CanvasTrim

  blockStartPosition: Position
  blockEndPosition: Position
}

export type CanvasTag = CanvasTagNamed | CanvasTagBaseCase

export type CanvasTagNamed =
  | CanvasTagDo
  | CanvasTagApply
  | CanvasTagAutoescape
  | CanvasTagBlock
  | CanvasTagGuard
  | CanvasTagEmbed
  | CanvasTagFor
  | CanvasTagForm
  | CanvasTagIf
  | CanvasTagMacro
  | CanvasTagWith
  | CanvasTagInclude
  | CanvasTagSet

export interface CanvasTagNode<Name, Markup> extends ASTNode<NodeTypes.CanvasTag> {
  /** eg. if, for, etc. */
  name: Name

  /** The non-name part inside the opening Canvas tag. {% tagName [markup] } */
  markup: Markup

  /** If the node has child nodes, the array of child nodes */
  children?: CanvasHtmlNode[]

  whitespaceStart: CanvasTrim
  whitespaceEnd: CanvasTrim
  delimiterWhitespaceStart?: CanvasTrim
  delimiterWhitespaceEnd?: CanvasTrim

  /**
   * The name optionally repeated on the closing tag, eg. the `title` in
   * `{% endblock title %}`. Documented for `block` and `macro`.
   */
  delimiterMarkup?: string

  /** The range of the opening tag {% tag %} */
  blockStartPosition: Position
  /** The range of the closing tag {% endtag %}, if it has one */
  blockEndPosition?: Position
}

export interface CanvasTagBaseCase extends CanvasTagNode<string, string> {}

export interface CanvasTagDo extends CanvasTagNode<NamedTags.do, CanvasVariable> {}

export interface CanvasTagIf extends CanvasTagConditional<NamedTags.if> {}

export interface CanvasBranchElseif
  extends CanvasBranchNode<NamedTags.elseif, CanvasConditionalExpression> {}

export interface CanvasTagConditional<Name>
  extends CanvasTagNode<Name, CanvasConditionalExpression> {}

export type CanvasConditionalExpression =
  | CanvasLogicalExpression
  | CanvasUnaryExpression
  | CanvasComparison
  | CanvasTestExpression
  | CanvasExpression

/** A condition with a leading operator, eg. `not a` */
export interface CanvasUnaryExpression extends ASTNode<NodeTypes.UnaryExpression> {
  operator: string
  expression: CanvasConditionalExpression
}

/** `value is [not] defined`, `n is divisible by(3)` */
export interface CanvasTestExpression extends ASTNode<NodeTypes.TestExpression> {
  expression: CanvasExpression
  negate: boolean
  /** The test name, eg. `defined`, `divisible by` */
  name: string
  args: CanvasArgument[]
}

export interface CanvasLogicalExpression extends ASTNode<NodeTypes.LogicalExpression> {
  relation: 'and' | 'or'
  left: CanvasConditionalExpression
  right: CanvasConditionalExpression
}

export interface CanvasComparison extends ASTNode<NodeTypes.Comparison> {
  comparator: Comparators
  left: CanvasExpression
  right: CanvasExpression
}

export interface CanvasTagInclude extends CanvasTagNode<NamedTags.include, IncludeMarkup> {}

/** {% embed 'template' %} — same markup as include, but it opens a block. */
export interface CanvasTagEmbed extends CanvasTagNode<NamedTags.embed, IncludeMarkup> {}

/** {% include 'template' %} */
export interface IncludeMarkup extends ASTNode<NodeTypes.IncludeMarkup> {
  snippet: CanvasString | CanvasVariableLookup
  ignoreMissing: 'ignore missing' | null
  withClause: IncludeWithClause | null
  onlyClause: IncludeOnlyClause | null
}

export interface IncludeWithClause extends ASTNode<NodeTypes.IncludeWithClause> {
  kind: 'with'
  value: CanvasExpression
}

export interface IncludeOnlyClause extends ASTNode<NodeTypes.IncludeOnlyClause> {
  value: 'only'
}

export interface CanvasTagFor extends CanvasTagNode<NamedTags.for, ForMarkup> {}

/** {% block title %} or the shortcut {% block title page_title | title %} */
export interface CanvasTagBlock extends CanvasTagNode<NamedTags.block, BlockMarkup> {}

export interface BlockMarkup extends ASTNode<NodeTypes.BlockMarkup> {
  name: string
  /** Set on the shortcut form, which has no body and no end tag */
  value: CanvasVariable | null
}

/** {% guard function myFunc %} */
export interface CanvasTagGuard extends CanvasTagNode<NamedTags.guard, GuardMarkup> {}

export interface GuardMarkup extends ASTNode<NodeTypes.GuardMarkup> {
  kind: 'filter' | 'function' | 'test'
  name: string
}

/** {% apply lower | escape('html') %} — `filter` is the legacy alias. */
export interface CanvasTagApply
  extends CanvasTagNode<NamedTags.apply | NamedTags.filter, ApplyMarkup> {}

export interface ApplyMarkup extends ASTNode<NodeTypes.ApplyMarkup> {
  /** The chain, starting with the filter that carries no leading `|` */
  filters: CanvasFilter[]
}

/** {% autoescape 'html' %}, {% autoescape false %}, {% autoescape %} */
export interface CanvasTagAutoescape
  extends CanvasTagNode<NamedTags.autoescape, AutoescapeMarkup> {}

export interface AutoescapeMarkup extends ASTNode<NodeTypes.AutoescapeMarkup> {
  strategy: CanvasExpression | null
}

/** {% with { foo: 42 } only %} */
export interface CanvasTagWith extends CanvasTagNode<NamedTags.with, WithMarkup> {}

export interface WithMarkup extends ASTNode<NodeTypes.WithMarkup> {
  context: CanvasExpression | null
  onlyClause: IncludeOnlyClause | null
}

/** {% form 'contact' with { id: 'contact' } %} */
export interface CanvasTagForm extends CanvasTagNode<NamedTags.form, FormMarkup> {}

export interface FormMarkup extends ASTNode<NodeTypes.FormMarkup> {
  handle: CanvasExpression
  withClause: IncludeWithClause | null
}

/** {% macro input(name, value, type = 'text') %} */
export interface CanvasTagMacro extends CanvasTagNode<NamedTags.macro, MacroMarkup> {}

export interface MacroMarkup extends ASTNode<NodeTypes.MacroMarkup> {
  name: string
  parameters: MacroParameter[]
}

export interface MacroParameter extends ASTNode<NodeTypes.MacroParameter> {
  name: string
  defaultValue: CanvasExpression | null
}

/** {% for key, value in collection %} */
export interface ForMarkup extends ASTNode<NodeTypes.ForMarkup> {
  /** `[value]`, or `[key, value]` when iterating a hash */
  variables: string[]

  collection: CanvasVariable | CanvasRange
}

export interface CanvasTagSet extends CanvasTagNode<NamedTags.set, SetMarkup> {}

/** {% set name = value %} */
export interface SetMarkup extends ASTNode<NodeTypes.SetMarkup> {
  /** the name of the variable that is being set */
  name: string

  /** the value of the variable that is being set */
  value: CanvasVariable
}

export type CanvasBranch = CanvasBranchUnnamed | CanvasBranchBaseCase | CanvasBranchNamed

export type CanvasBranchNamed = CanvasBranchElseif

export interface CanvasBranchNode<Name, Markup> extends ASTNode<NodeTypes.CanvasBranch> {
  name: Name

  /** {% name [markup] %} */
  markup: Markup

  /** The child nodes of the branch */
  children: CanvasHtmlNode[]

  whitespaceStart: CanvasTrim
  whitespaceEnd: CanvasTrim

  blockStartPosition: Position
  blockEndPosition: Position
}

export interface CanvasBranchUnnamed extends CanvasBranchNode<null, string> {}

export interface CanvasBranchBaseCase extends CanvasBranchNode<string, string> {}

export interface CanvasVariableOutput extends ASTNode<NodeTypes.CanvasVariableOutput> {
  markup: string | CanvasVariable
  whitespaceStart: CanvasTrim
  whitespaceEnd: CanvasTrim
}

export interface CanvasVariable extends ASTNode<NodeTypes.CanvasVariable> {
  /** expression | filter1 | filter2 */
  expression: CanvasExpression

  /** expression | filter1 | filter2 */
  filters: CanvasFilter[]

  rawSource: string
}

export type CanvasExpression =
  | CanvasConcatenation
  | CanvasString
  | CanvasNumber
  | CanvasLiteral
  | CanvasRange
  | CanvasSequence
  | CanvasMapping
  | CanvasComparison
  | CanvasFunction
  | CanvasArrowFunction
  | CanvasTernaryExpression
  | CanvasVariableLookup

/** `condition ? consequent : alternate` */
export interface CanvasTernaryExpression extends ASTNode<NodeTypes.TernaryExpression> {
  condition: CanvasExpression
  consequent: CanvasExpression
  alternate: CanvasExpression
}

export interface CanvasFilter extends ASTNode<NodeTypes.CanvasFilter> {
  name: string

  args: CanvasArgument[]
}

export type CanvasArgument = CanvasExpression | CanvasNamedArgument

export interface CanvasNamedArgument extends ASTNode<NodeTypes.NamedArgument> {
  name: CanvasExpression

  /**
   * Named arguments and hash entries share this node but not their spelling:
   * function calls are documented as `range(low = 1)` and hashes as
   * `{ foo: 'bar' }`, so the source separator is preserved rather than
   * normalised to one of the two.
   */
  separator: '=' | ':'

  value: CanvasExpression
}

export interface CanvasConcatenation extends ASTNode<NodeTypes.Concatenation> {
  start: CanvasExpression
  end: CanvasExpression
}

export interface CanvasString extends ASTNode<NodeTypes.String> {
  single: boolean

  value: string
}

export interface CanvasNumber extends ASTNode<NodeTypes.Number> {
  /** as a string for compatibility with numbers like 100_000 */
  value: string
}

export interface CanvasLiteral extends ASTNode<NodeTypes.CanvasLiteral> {
  keyword: ConcreteCanvasLiteral['keyword']
  value: ConcreteCanvasLiteral['value']
}

export interface CanvasRange extends ASTNode<NodeTypes.Range> {
  start: CanvasExpression
  end: CanvasExpression

  /** Ranges are parenthesized everywhere except in `{% for i in 0..10 %}` */
  parenthesized: boolean
}

export interface CanvasSequence extends ASTNode<NodeTypes.Sequence> {
  args: CanvasArgument[]
}

export interface CanvasMapping extends ASTNode<NodeTypes.Mapping> {
  args: CanvasArgument[]
}

export interface CanvasFunction extends ASTNode<NodeTypes.Function> {
  name: string

  args: CanvasArgument[]
}

export interface CanvasArrowFunction extends ASTNode<NodeTypes.ArrowFunction> {
  args: CanvasArgument[]

  /** A single argument may be written without parentheses: `v => v > 38` */
  parenthesized: boolean

  expression: CanvasExpression
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
  canvas = 'canvas',
  css = 'css',
  html = 'html',
  javascript = 'javascript',
  json = 'json',
  text = 'text',
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

export type ValueNode = TextNode | CanvasNode

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

export interface ASTBuildOptions {
  mode: 'strict' | 'tolerant' | 'completion'
}

export enum Comparators {
  EQUAL = '==',
}

export enum NamedTags {
  apply = 'apply',
  autoescape = 'autoescape',
  block = 'block',
  do = 'do',
  elseif = 'elseif',
  embed = 'embed',
  filter = 'filter',
  for = 'for',
  form = 'form',
  guard = 'guard',
  macro = 'macro',
  with = 'with',
  if = 'if',
  include = 'include',
  set = 'set',
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
