import { assertNever, deepGet, dropLast } from '@/utils'
import {
  CanvasCST,
  CanvasHtmlConcreteNode,
  CanvasHtmlCST,
  ConcreteAttrDoubleQuoted,
  ConcreteAttributeNode,
  ConcreteAttrSingleQuoted,
  ConcreteAttrUnquoted,
  ConcreteCanvasArgument,
  ConcreteCanvasComparison,
  ConcreteCanvasCondition,
  ConcreteCanvasExpression,
  ConcreteCanvasFilter,
  ConcreteCanvasNamedArgument,
  ConcreteCanvasNode,
  ConcreteCanvasRawTag,
  ConcreteCanvasTag,
  ConcreteCanvasTagBaseCase,
  ConcreteCanvasTagClose,
  ConcreteCanvasTagIncludeMarkup,
  ConcreteCanvasTagNamed,
  ConcreteCanvasTagOpen,
  ConcreteCanvasTagOpenNamed,
  ConcreteCanvasTagSetMarkup,
  ConcreteCanvasVariable,
  ConcreteCanvasVariableOutput,
  ConcreteHtmlRawTag,
  ConcreteHtmlTagClose,
  ConcreteHtmlTagOpen,
  ConcreteHtmlVoidElement,
  ConcreteIncludeOnlyClause,
  ConcreteIncludeWithClause,
  ConcreteNodeTypes,
  ConcreteTextNode,
  toCanvasHtmlCST,
} from './cst'
import {
  ASTBuildOptions,
  AttrDoubleQuoted,
  AttributeNode,
  AttrSingleQuoted,
  AttrUnquoted,
  CanvasArgument,
  CanvasBranch,
  CanvasBranchBaseCase,
  CanvasBranchNamed,
  CanvasBranchNode,
  CanvasBranchUnnamed,
  CanvasComparison,
  CanvasConditionalExpression,
  CanvasExpression,
  CanvasFilter,
  CanvasHtmlNode,
  CanvasNamedArgument,
  CanvasNode,
  CanvasString,
  CanvasTag,
  CanvasTagNamed,
  CanvasVariable,
  CanvasVariableLookup,
  CanvasVariableOutput,
  DocumentNode,
  HtmlElement,
  HtmlVoidElement,
  IncludeMarkup,
  IncludeOnlyClause,
  IncludeWithClause,
  NamedTags,
  NodeTypes,
  nonTraversableProperties,
  ParentNode,
  Position,
  RawMarkup,
  RawMarkupKinds,
  SetMarkup,
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

export function toCanvasHtmlAST(
  source: string,
  options: ASTBuildOptions = { mode: 'tolerant' }
): DocumentNode {
  const cst = toCanvasHtmlCST(source)
  return {
    type: NodeTypes.Document,
    source: source,
    name: '#document',
    children: cstToAst(cst, options),
    position: {
      start: 0,
      end: source.length,
    },
  }
}

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
        console.log('parent', suitableParent)
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
    case NodeTypes.AttrEmpty:
    case NodeTypes.AttrUnquoted:
    case NodeTypes.AttrDoubleQuoted:
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
  cst: CanvasHtmlCST | CanvasCST | ConcreteAttributeNode[],
  options: ASTBuildOptions
): CanvasHtmlNode[] {
  if (cst.length === 0) return []

  const builder = buildAst(cst, options)

  return builder.ast
}

function buildAst(
  cst: CanvasHtmlCST | CanvasCST | ConcreteAttributeNode[],
  options: ASTBuildOptions
) {
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
        builder.open(toCanvasTag(node, { ...options, isBlockTag: true }))
        break
      }

      case ConcreteNodeTypes.CanvasTagClose: {
        builder.close(node, NodeTypes.CanvasTag)
        break
      }

      case ConcreteNodeTypes.CanvasTag: {
        builder.push(toCanvasTag(node, { ...options, isBlockTag: false }))
        break
      }

      case ConcreteNodeTypes.CanvasRawTag: {
        console.log('push CanvasRawTag')
        break
      }

      case ConcreteNodeTypes.HtmlTagOpen: {
        builder.open(toHtmlElement(node, options))
        break
      }

      case ConcreteNodeTypes.HtmlTagClose: {
        if (isAcceptableDanglingMarkerClose(builder, cst as CanvasHtmlCST, i)) {
          builder.push(toHtmlDanglingMarkerClose(node, options))
        } else {
          builder.close(node, NodeTypes.HtmlElement)
        }
        break
      }

      case ConcreteNodeTypes.HtmlVoidElement: {
        builder.push(toHtmlVoidElement(node, options))
        break
      }

      case ConcreteNodeTypes.HtmlSelfClosingElement: {
        console.log('push HtmlSelfClosingElement')
        break
      }

      case ConcreteNodeTypes.HtmlDoctype: {
        console.log('push HtmlDoctype')
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

      case ConcreteNodeTypes.HtmlRawTag: {
        builder.push({
          type: NodeTypes.HtmlRawNode,
          name: node.name,
          body: toRawMarkup(node, options),
          attributes: toAttributes(node.attrList || [], options),
          position: position(node),
          source: node.source,
          blockStartPosition: {
            start: node.blockStartLocStart,
            end: node.blockStartLocEnd,
          },
          blockEndPosition: {
            start: node.blockEndLocStart,
            end: node.blockEndLocEnd,
          },
        })
        break
      }

      case ConcreteNodeTypes.AttrEmpty: {
        builder.push({
          type: NodeTypes.AttrEmpty,
          name: cstToAst(node.name, options) as (TextNode | CanvasVariableOutput)[],
          position: position(node),
          source: node.source,
        })
        break
      }

      case ConcreteNodeTypes.AttrSingleQuoted:
      case ConcreteNodeTypes.AttrDoubleQuoted:
      case ConcreteNodeTypes.AttrUnquoted: {
        const abstractNode: AttrUnquoted | AttrSingleQuoted | AttrDoubleQuoted = {
          type: node.type as unknown as
            | NodeTypes.AttrSingleQuoted
            | NodeTypes.AttrDoubleQuoted
            | NodeTypes.AttrUnquoted,
          name: cstToAst(node.name, options) as (TextNode | CanvasVariableOutput)[],
          position: position(node),
          source: node.source,

          // placeholders
          attributePosition: { start: -1, end: -1 },
          value: [],
        }
        const value = toAttributeValue(node.value, options)
        abstractNode.value = value
        abstractNode.attributePosition = toAttributePosition(node, value)
        builder.push(abstractNode)
        break
      }

      default: {
        assertNever(node)
      }
    }
  }

  return builder
}

function nameLength(names: (ConcreteCanvasVariableOutput | ConcreteTextNode)[]) {
  const start = names.at(0)!
  const end = names.at(-1)!
  return end.locEnd - start.locStart
}

function toAttributePosition(
  node: ConcreteAttrSingleQuoted | ConcreteAttrDoubleQuoted | ConcreteAttrUnquoted,
  value: (CanvasNode | TextNode)[]
): Position {
  if (value.length === 0) {
    return {
      start: node.locStart + nameLength(node.name) + '='.length + '"'.length,
      end: node.locStart + nameLength(node.name) + '='.length + '"'.length,
    }
  }

  return {
    start: value[0].position.start,
    end: value[value.length - 1].position.end,
  }
}

function toAttributeValue(
  value: (ConcreteCanvasNode | ConcreteTextNode)[],
  options: ASTBuildOptions
): (CanvasNode | TextNode)[] {
  return cstToAst(value, options) as (CanvasNode | TextNode)[]
}

function toAttributes(
  attrList: ConcreteAttributeNode[],
  options: ASTBuildOptions
): AttributeNode[] {
  return cstToAst(attrList, options) as AttributeNode[]
}

function canvasTagBaseAttributes(
  node: ConcreteCanvasTag | ConcreteCanvasTagOpen
): Omit<CanvasTag, 'name' | 'markup'> {
  return {
    type: NodeTypes.CanvasTag,
    position: position(node),
    whitespaceStart: node.whitespaceStart ?? '',
    whitespaceEnd: node.whitespaceEnd ?? '',
    blockStartPosition: position(node),
    source: node.source,
  }
}

function canvasBranchBaseAttributes(
  node: ConcreteCanvasTag
): Omit<CanvasBranch, 'name' | 'markup'> {
  return {
    type: NodeTypes.CanvasBranch,
    children: [],
    position: position(node),
    whitespaceStart: node.whitespaceStart ?? '',
    whitespaceEnd: node.whitespaceEnd ?? '',
    blockStartPosition: position(node),
    blockEndPosition: { start: -1, end: -1 },
    source: node.source,
  }
}

function toCanvasTag(
  node: ConcreteCanvasTag | ConcreteCanvasTagOpen,
  options: ASTBuildOptions & { isBlockTag: boolean }
): CanvasTag | CanvasBranch {
  if (typeof node.markup !== 'string') {
    return toNamedCanvasTag(node as ConcreteCanvasTagNamed, options)
  } else if (isConcreteCanvasBranchDisguisedAsTag(node)) {
    // `elseif`, `else`, but with unparsable markup.
    return toNamedCanvasBranchBaseCase(node)
  } else if (options.isBlockTag) {
    return {
      name: node.name,
      markup: markup(node.name, node.markup),
      children: options.isBlockTag ? [] : undefined,
      ...canvasTagBaseAttributes(node),
    }
  }

  return {
    name: node.name,
    markup: markup(node.name, node.markup),
    ...canvasTagBaseAttributes(node),
  }
}

function toNamedCanvasTag(
  node: ConcreteCanvasTagNamed | ConcreteCanvasTagOpenNamed,
  options: ASTBuildOptions
): CanvasTagNamed | CanvasBranchNamed {
  switch (node.name) {
    case NamedTags.do: {
      return {
        ...canvasTagBaseAttributes(node),
        name: NamedTags.do,
        markup: toCanvasVariable(node.markup),
      }
    }

    case NamedTags.include: {
      return {
        ...canvasTagBaseAttributes(node),
        name: node.name,
        markup: toIncludeMarkup(node.markup),
      }
    }

    case NamedTags.set: {
      return {
        ...canvasTagBaseAttributes(node),
        name: NamedTags.set,
        markup: toSetMarkup(node.markup),
      }
    }

    case NamedTags.if: {
      return {
        ...canvasTagBaseAttributes(node),
        name: node.name,
        markup: toConditionalExpression(node.markup),
        blockEndPosition: { start: -1, end: -1 },
        children: [],
      }
    }

    case NamedTags.elseif: {
      return {
        ...canvasBranchBaseAttributes(node),
        name: node.name,
        markup: toConditionalExpression(node.markup),
      }
    }

    default: {
      return assertNever(node)
    }
  }
}

function toNamedCanvasBranchBaseCase(node: ConcreteCanvasTagBaseCase): CanvasBranchBaseCase {
  return {
    name: node.name,
    type: NodeTypes.CanvasBranch,
    markup: node.name !== 'else' ? node.markup : '',
    position: { start: node.locStart, end: node.locEnd },
    children: [],
    blockStartPosition: { start: node.locStart, end: node.locEnd },
    blockEndPosition: { start: -1, end: -1 },
    whitespaceStart: node.whitespaceStart ?? '',
    whitespaceEnd: node.whitespaceEnd ?? '',
    source: node.source,
  }
}

export function toUnnamedCanvasBranch(parentNode: CanvasHtmlNode): CanvasBranchUnnamed {
  return {
    type: NodeTypes.CanvasBranch,
    name: null,
    markup: '',
    position: { start: parentNode.position.end, end: parentNode.position.end },
    blockStartPosition: { start: parentNode.position.end, end: parentNode.position.end },
    blockEndPosition: { start: -1, end: -1 },
    children: [],
    whitespaceStart: '',
    whitespaceEnd: '',
    source: parentNode.source,
  }
}

function toIncludeMarkup(node: ConcreteCanvasTagIncludeMarkup): IncludeMarkup {
  return {
    type: NodeTypes.IncludeMarkup,
    snippet: toExpression(node.snippet) as CanvasString | CanvasVariableLookup,
    ignoreMissing: node.ignoreMissing,
    withClause: toIncludeWithClause(node.withClause),
    onlyClause: toIncludeOnlyClause(node.onlyClause),
    position: position(node),
    source: node.source,
  }
}

function toIncludeWithClause(node: ConcreteIncludeWithClause): IncludeWithClause | null {
  if (!node) return null
  return {
    type: NodeTypes.IncludeWithClause,
    kind: node.kind,
    value: toExpression(node.value),
    position: position(node),
    source: node.source,
  }
}

function toIncludeOnlyClause(node: ConcreteIncludeOnlyClause): IncludeOnlyClause | null {
  if (!node) return null
  return {
    type: NodeTypes.IncludeOnlyClause,
    value: node.value,
    position: position(node),
    source: node.source,
  }
}

function toSetMarkup(node: ConcreteCanvasTagSetMarkup): SetMarkup {
  return {
    type: NodeTypes.SetMarkup,
    name: node.name,
    value: toCanvasVariable(node.value),
    position: position(node),
    source: node.source,
  }
}

function toRawMarkup(
  node: ConcreteHtmlRawTag | ConcreteCanvasRawTag,
  options: ASTBuildOptions
): RawMarkup {
  return {
    type: NodeTypes.RawMarkup,
    kind: toRawMarkupKind(node),
    nodes: cstToAst(node.children, options) as (TextNode | CanvasNode)[],
    value: node.body,
    position: {
      start: node.blockStartLocEnd,
      end: node.blockEndLocStart,
    },
    source: node.source,
  }
}

function toRawMarkupKind(node: ConcreteHtmlRawTag | ConcreteCanvasRawTag): RawMarkupKinds {
  switch (node.type) {
    case ConcreteNodeTypes.HtmlRawTag:
      return toRawMarkupKindFromHtmlNode(node)
    case ConcreteNodeTypes.CanvasRawTag:
      return toRawMarkupKindFromCanvasNode(node)
    default:
      return assertNever(node)
  }
}

function toRawMarkupKindFromHtmlNode(
  node: ConcreteHtmlRawTag | ConcreteCanvasRawTag
): RawMarkupKinds {
  switch (node.name) {
    default:
      return RawMarkupKinds.text
  }
}

function toRawMarkupKindFromCanvasNode(
  node: ConcreteHtmlRawTag | ConcreteCanvasRawTag
): RawMarkupKinds {
  switch (node.name) {
    default:
      return RawMarkupKinds.text
  }
}

function toConditionalExpression(nodes: ConcreteCanvasCondition[]): CanvasConditionalExpression {
  if (nodes.length === 1) {
    return toComparisonOrExpression(nodes[0])
  }

  const [first, second] = nodes
  const [, ...rest] = nodes
  return {
    type: NodeTypes.LogicalExpression,
    relation: second.relation as 'and' | 'or',
    left: toComparisonOrExpression(first),
    right: toConditionalExpression(rest),
    position: {
      start: first.locStart,
      end: nodes[nodes.length - 1].locEnd,
    },
    source: first.source,
  }
}

function toComparisonOrExpression(
  node: ConcreteCanvasCondition
): CanvasComparison | CanvasExpression {
  const expression = node.expression
  switch (expression.type) {
    case ConcreteNodeTypes.Comparison:
      return toComparison(expression)
    default:
      return toExpression(expression)
  }
}

function toComparison(node: ConcreteCanvasComparison): CanvasComparison {
  return {
    type: NodeTypes.Comparison,
    comparator: node.comparator,
    left: toExpression(node.left),
    right: toExpression(node.right),
    position: position(node),
    source: node.source,
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
    case ConcreteNodeTypes.Concatenation: {
      return {
        type: NodeTypes.Concatenation,
        start: toExpression(node.start),
        end: toExpression(node.end),
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.String: {
      return {
        type: NodeTypes.String,
        position: position(node),
        single: node.single,
        value: node.value,
        source: node.source,
      }
    }

    case ConcreteNodeTypes.Number: {
      return {
        type: NodeTypes.Number,
        position: position(node),
        value: node.value,
        source: node.source,
      }
    }

    case ConcreteNodeTypes.CanvasLiteral: {
      return {
        type: NodeTypes.CanvasLiteral,
        value: node.value,
        keyword: node.keyword,
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.Range: {
      return {
        type: NodeTypes.Range,
        start: toExpression(node.start),
        end: toExpression(node.end),
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.Sequence: {
      return {
        type: NodeTypes.Sequence,
        args: node.args.map(toCanvasArgument),
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.Mapping: {
      return {
        type: NodeTypes.Mapping,
        args: node.args.map(toCanvasArgument),
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.Comparison: {
      return toComparison(node)
    }

    case ConcreteNodeTypes.Function: {
      return {
        type: NodeTypes.Function,
        name: node.name,
        args: node.args.map(toCanvasArgument),
        position: position(node),
        source: node.source,
      }
    }

    case ConcreteNodeTypes.ArrowFunction: {
      return {
        type: NodeTypes.ArrowFunction,
        args: node.args.map(toCanvasArgument),
        expression: toExpression(node.expression),
        position: position(node),
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

function toCanvasArgument(node: ConcreteCanvasArgument): CanvasArgument {
  switch (node.type) {
    case ConcreteNodeTypes.NamedArgument: {
      return toNamedArgument(node)
    }
    default: {
      return toExpression(node)
    }
  }
}

function toNamedArgument(node: ConcreteCanvasNamedArgument): CanvasNamedArgument {
  return {
    type: NodeTypes.NamedArgument,
    name: toExpression(node.name),
    value: toExpression(node.value),
    position: position(node),
    source: node.source,
  }
}

function toHtmlElement(node: ConcreteHtmlTagOpen, options: ASTBuildOptions): HtmlElement {
  return {
    type: NodeTypes.HtmlElement,
    name: cstToAst(node.name, options) as (TextNode | CanvasVariableOutput)[],
    attributes: toAttributes(node.attrList || [], options),
    position: position(node),
    blockStartPosition: position(node),
    blockEndPosition: { start: -1, end: -1 },
    children: [],
    source: node.source,
  }
}

function toHtmlVoidElement(
  node: ConcreteHtmlVoidElement,
  options: ASTBuildOptions
): HtmlVoidElement {
  return {
    type: NodeTypes.HtmlVoidElement,
    name: node.name,
    attributes: toAttributes(node.attrList || [], options),
    position: position(node),
    blockStartPosition: position(node),
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
