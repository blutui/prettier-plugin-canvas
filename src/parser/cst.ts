import * as ohm from 'ohm-js'
import { toAST } from 'ohm-js/extras'

import { CanvasGrammars, placeholderGrammars, strictGrammars, tolerantGrammars } from './grammar'
import { Comparators, NamedTags } from './types'

export enum ConcreteNodeTypes {
  HtmlDoctype = 'HtmlDoctype',
  HtmlComment = 'HtmlComment',
  HtmlRawTag = 'HtmlRawTag',
  HtmlVoidElement = 'HtmlVoidElement',
  HtmlSelfClosingElement = 'HtmlSelfClosingElement',
  HtmlTagOpen = 'HtmlTagOpen',
  HtmlTagClose = 'HtmlTagClose',
  CanvasVariableOutput = 'CanvasVariableOutput',
  CanvasRawTag = 'CanvasRawTag',
  CanvasTag = 'CanvasTag',
  CanvasTagOpen = 'CanvasTagOpen',
  CanvasTagClose = 'CanvasTagClose',
  AttrSingleQuoted = 'AttrSingleQuoted',
  AttrDoubleQuoted = 'AttrDoubleQuoted',
  AttrUnquoted = 'AttrUnquoted',
  AttrEmpty = 'AttrEmpty',
  TextNode = 'TextNode',

  CanvasVariable = 'CanvasVariable',
  CanvasFilter = 'CanvasFilter',
  NamedArgument = 'NamedArgument',
  VariableLookup = 'VariableLookup',
  String = 'String',
  Number = 'Number',
  Function = 'Function',
  ArrowFunction = 'ArrowFunction',
  Comparison = 'Comparison',
  Condition = 'Condition',

  IncludeMarkup = 'IncludeMarkup',
  SetMarkup = 'SetMarkup',
}

export interface ConcreteBasicNode<T> {
  type: T
  source: string
  locStart: number
  locEnd: number
}

export interface ConcreteHtmlNodeBase<T> extends ConcreteBasicNode<T> {
  attrList?: ConcreteAttributeNode[]
}

export interface ConcreteHtmlComment extends ConcreteBasicNode<ConcreteNodeTypes.HtmlComment> {
  body: string
}

export interface ConcreteHtmlVoidElement
  extends ConcreteHtmlNodeBase<ConcreteNodeTypes.HtmlVoidElement> {
  name: string
}

export interface ConcreteHtmlTagOpen extends ConcreteHtmlNodeBase<ConcreteNodeTypes.HtmlTagOpen> {
  name: (ConcreteTextNode | ConcreteCanvasVariableOutput)[]
}
export interface ConcreteHtmlTagClose extends ConcreteHtmlNodeBase<ConcreteNodeTypes.HtmlTagClose> {
  name: (ConcreteTextNode | ConcreteCanvasVariableOutput)[]
}

export interface ConcreteAttributeNodeBase<T> extends ConcreteBasicNode<T> {
  name: (ConcreteCanvasVariableOutput | ConcreteTextNode)[]
  value: (ConcreteCanvasNode | ConcreteTextNode)[]
}

export type ConcreteAttributeNode =
  | ConcreteCanvasNode
  | ConcreteAttrSingleQuoted
  | ConcreteAttrDoubleQuoted
  | ConcreteAttrUnquoted
  | ConcreteAttrEmpty

export interface ConcreteAttrSingleQuoted
  extends ConcreteAttributeNodeBase<ConcreteNodeTypes.AttrSingleQuoted> {}
export interface ConcreteAttrDoubleQuoted
  extends ConcreteAttributeNodeBase<ConcreteNodeTypes.AttrDoubleQuoted> {}
export interface ConcreteAttrUnquoted
  extends ConcreteAttributeNodeBase<ConcreteNodeTypes.AttrUnquoted> {}
export interface ConcreteAttrEmpty extends ConcreteBasicNode<ConcreteNodeTypes.AttrEmpty> {
  name: (ConcreteCanvasVariableOutput | ConcreteTextNode)[]
}

export type ConcreteCanvasNode =
  | ConcreteCanvasRawTag
  | ConcreteCanvasTagOpen
  | ConcreteCanvasTagClose
  | ConcreteCanvasTag
  | ConcreteCanvasVariableOutput

interface ConcreteBasicCanvasNode<T> extends ConcreteBasicNode<T> {
  whitespaceStart: null | '-'
  whitespaceEnd: null | '-'
}

export interface ConcreteCanvasRawTag
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasRawTag> {
  name: string
  body: string
  children: (ConcreteTextNode | ConcreteCanvasNode)[]
  markup: string
  delimiterWhitespaceStart: null | '-'
  delimiterWhitespaceEnd: null | '-'
  blockStartLocStart: number
  blockStartLocEnd: number
  blockEndLocStart: number
  blockEndLocEnd: number
}

export type ConcreteCanvasTagOpen = ConcreteCanvasTagOpenBaseCase | ConcreteCanvasTagOpenNamed
export type ConcreteCanvasTagOpenNamed = ConcreteCanvasTagOpenIf

export interface ConcreteCanvasTagOpenNode<Name, Markup>
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasTagOpen> {
  name: Name
  markup: Markup
}

export interface ConcreteCanvasTagOpenBaseCase extends ConcreteCanvasTagOpenNode<string, string> {}

export interface ConcreteCanvasTagOpenIf
  extends ConcreteCanvasTagOpenNode<NamedTags.if, ConcreteCanvasCondition[]> {}
export interface ConcreteCanvasTagElseIf
  extends ConcreteCanvasTagNode<NamedTags.elseif, ConcreteCanvasCondition[]> {}

export interface ConcreteCanvasCondition extends ConcreteBasicNode<ConcreteNodeTypes.Condition> {
  relation: 'and' | 'or' | null
  expression: ConcreteCanvasComparison | ConcreteCanvasExpression
}

export interface ConcreteCanvasComparison extends ConcreteBasicNode<ConcreteNodeTypes.Comparison> {
  comparator: Comparators
  left: ConcreteCanvasExpression
  right: ConcreteCanvasExpression
}

export interface ConcreteCanvasTagClose
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasTagClose> {
  name: string
}

export type ConcreteCanvasTag = ConcreteCanvasTagNamed | ConcreteCanvasTagBaseCase
export type ConcreteCanvasTagNamed =
  | ConcreteCanvasTagDo
  | ConcreteCanvasTagElseIf
  | ConcreteCanvasTagInclude
  | ConcreteCanvasTagSet

export interface ConcreteCanvasTagNode<Name, Markup>
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasTag> {
  markup: Markup
  name: Name
}

export interface ConcreteCanvasTagBaseCase extends ConcreteCanvasTagNode<string, string> {}

export interface ConcreteCanvasTagDo
  extends ConcreteCanvasTagNode<NamedTags.do, ConcreteCanvasVariable> {}

export interface ConcreteCanvasTagInclude
  extends ConcreteCanvasTagNode<NamedTags.include, ConcreteCanvasTagIncludeMarkup> {}

export interface ConcreteCanvasTagIncludeMarkup
  extends ConcreteBasicNode<ConcreteNodeTypes.IncludeMarkup> {}

export interface ConcreteCanvasTagSet
  extends ConcreteCanvasTagNode<NamedTags.set, ConcreteCanvasTagSetMarkup> {}

export interface ConcreteCanvasTagSetMarkup extends ConcreteBasicNode<ConcreteNodeTypes.SetMarkup> {
  name: string
  value: ConcreteCanvasVariable
}

export interface ConcreteCanvasVariableOutput
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasVariableOutput> {
  markup: ConcreteCanvasVariable | string
}

export interface ConcreteCanvasVariable
  extends ConcreteBasicNode<ConcreteNodeTypes.CanvasVariable> {
  expression: ConcreteCanvasExpression
  filters: ConcreteCanvasFilter[]
  rawSource: string
}

export interface ConcreteCanvasFilter extends ConcreteBasicNode<ConcreteNodeTypes.CanvasFilter> {
  name: string
  args: ConcreteCanvasArgument[]
}

export type ConcreteCanvasArgument = ConcreteCanvasExpression | ConcreteCanvasNamedArgument

export interface ConcreteCanvasNamedArgument
  extends ConcreteBasicNode<ConcreteNodeTypes.NamedArgument> {
  name: ConcreteCanvasExpression
  value: ConcreteCanvasExpression
}

export type ConcreteCanvasExpression =
  | ConcreteStringLiteral
  | ConcreteNumberLiteral
  | ConcreteCanvasComparison
  | ConcreteCanvasFunction
  | ConcreteCanvasArrowFunction
  | ConcreteCanvasVariableLookup

export interface ConcreteStringLiteral extends ConcreteBasicNode<ConcreteNodeTypes.String> {
  value: string
  single: boolean
}

export interface ConcreteNumberLiteral extends ConcreteBasicNode<ConcreteNodeTypes.Number> {
  value: string // float parsing is weird but supported
}

export interface ConcreteCanvasFunction extends ConcreteBasicNode<ConcreteNodeTypes.Function> {
  name: string
  args: ConcreteCanvasArgument[]
}

export interface ConcreteCanvasArrowFunction
  extends ConcreteBasicNode<ConcreteNodeTypes.ArrowFunction> {
  args: ConcreteCanvasArgument[]
  expression: ConcreteCanvasExpression
}

export interface ConcreteCanvasVariableLookup
  extends ConcreteBasicNode<ConcreteNodeTypes.VariableLookup> {
  name: string | null
  lookups: ConcreteCanvasExpression[]
}

export type ConcreteHtmlNode =
  | ConcreteHtmlComment
  | ConcreteHtmlVoidElement
  | ConcreteHtmlTagOpen
  | ConcreteHtmlTagClose

export interface ConcreteTextNode extends ConcreteBasicNode<ConcreteNodeTypes.TextNode> {
  value: string
}

export type CanvasHtmlConcreteNode = ConcreteHtmlNode | ConcreteCanvasNode | ConcreteTextNode

export type CanvasConcreteNode = ConcreteCanvasNode | ConcreteTextNode

export type CanvasHtmlCST = CanvasHtmlConcreteNode[]

export type CanvasCST = CanvasConcreteNode[]

interface Mapping {
  [k: string]: any
}

const markup = (i: number) => (tokens: ohm.Node[]) => tokens[i].sourceString.trim()

export interface CSTBuildOptions {
  mode: 'strict' | 'tolerant' | 'completion'
}

const Grammars: Record<CSTBuildOptions['mode'], CanvasGrammars> = {
  strict: strictGrammars,
  tolerant: tolerantGrammars,
  completion: placeholderGrammars,
}

export function toCanvasHtmlCST(
  source: string,
  options: CSTBuildOptions = { mode: 'tolerant' }
): CanvasHtmlCST {
  const grammars = Grammars[options.mode]
  const grammar = grammars.CanvasHTML
  return toCST(source, grammars, grammar, [
    'HelperMappings',
    'CanvasMappings',
    'CanvasHTMLMappings',
  ])
}

function toCST<T>(
  source: string,
  grammars: CanvasGrammars,
  grammar: ohm.Grammar,
  cstMappings: ('HelperMappings' | 'CanvasMappings' | 'CanvasHTMLMappings')[],
  matchingSource: string = source,
  offset: number = 0
): T {
  const locStart = (tokens: ohm.Node[]) => offset + tokens[0].source.startIdx
  const locEnd = (tokens: ohm.Node[]) => offset + tokens[tokens.length - 1].source.endIdx
  const locEndSecondToLast = (tokens: ohm.Node[]) =>
    offset + tokens[tokens.length - 2].source.endIdx

  const textNode = {
    type: ConcreteNodeTypes.TextNode,
    value: function () {
      return (this as any).sourceString
    },
    locStart,
    locEnd,
    source,
  }

  const res = grammar.match(matchingSource, 'Node')
  if (res.failed()) {
    throw new SyntaxError(res.shortMessage)
  }

  const HelperMappings: Mapping = {
    Node: 0,
    TextNode: textNode,
    orderedListOf: 0,

    listOf: 0,
    empty: () => null,
    emptyListOf: () => [],
    nonemptyListOf(first: any, _sep: any, rest: any) {
      const self = this as any
      return [first.toAST(self.args.mapping)].concat(rest.toAST(self.args.mapping))
    },

    nonemptyOrderedListOf: 0,
    nonemptyOrderedListOfBoth(
      nonemptyListOfA: ohm.Node,
      _sep: ohm.Node,
      nonemptyListOfB: ohm.Node
    ) {
      const self = this as any
      return nonemptyListOfA
        .toAST(self.args.mapping)
        .concat(nonemptyListOfB.toAST(self.args.mapping))
    },
  }

  const CanvasMappings: Mapping = {
    canvasNode: 0,
    canvasRawTag: 0,

    canvasTagOpen: 0,
    canvasTagOpenStrict: 0,
    canvasTagOpenBaseCase: 0,
    canvasTagOpenRule: {
      type: ConcreteNodeTypes.CanvasTagOpen,
      name: 3,
      markup(nodes: ohm.Node[]) {
        const markupNode = nodes[6]
        const nameNode = nodes[3]
        if (NamedTags.hasOwnProperty(nameNode.sourceString)) {
          return markupNode.toAST((this as any).args.mapping)
        }
        return markupNode.sourceString.trim()
      },
      whitespaceStart: 1,
      whitespaceEnd: 7,
      locStart,
      locEnd,
      source,
    },

    canvasTagOpenBlock: 0,
    canvasTagOpenFor: 0,
    canvasTagOpenIf: 0,
    canvasTagOpenConditionalMarkup: 0,
    condition: {
      type: ConcreteNodeTypes.Condition,
      relation: 0,
      expression: 2,
      locStart,
      locEnd,
      source,
    },
    comparison: {
      type: ConcreteNodeTypes.Comparison,
      comparator: 2,
      left: 0,
      right: 4,
      locStart,
      locEnd,
      source,
    },

    canvasTagClose: {
      type: ConcreteNodeTypes.CanvasTagClose,
      name: 4,
      whitespaceStart: 1,
      whitespaceEnd: 7,
      locStart,
      locEnd,
      source,
    },

    canvasTag: 0,
    canvasTagStrict: 0,
    canvasTagBaseCase: 0,
    canvasTagDo: 0,
    canvasTagExtends: 0,
    canvasTagElse: 0,
    canvasTagInclude: 0,
    canvasTagSet: 0,
    canvasTagRule: {
      type: ConcreteNodeTypes.CanvasTag,
      name: 3,
      markup(nodes: ohm.Node[]) {
        const markupNode = nodes[6]
        const nameNode = nodes[3]
        if (NamedTags.hasOwnProperty(nameNode.sourceString)) {
          return markupNode.toAST((this as any).args.mapping)
        }
        return markupNode.sourceString.trim()
      },
      whitespaceStart: 1,
      whitespaceEnd: 7,
      source,
      locStart,
      locEnd,
    },

    canvasTagDoMarkup: 0,
    canvasTagSetMarkup: {
      type: ConcreteNodeTypes.SetMarkup,
      name: 0,
      value: 4,
      locStart,
      locEnd,
      source,
    },

    canvasDrop: {
      type: ConcreteNodeTypes.CanvasVariableOutput,
      markup: 3,
      whitespaceStart: 1,
      whitespaceEnd: 4,
      locStart,
      locEnd,
      source,
    },

    canvasDropCases: 0,
    canvasExpression: 0,
    canvasDropBaseCase: (sw: ohm.Node) => sw.sourceString.trimEnd(),
    canvasVariable: {
      type: ConcreteNodeTypes.CanvasVariable,
      expression: 0,
      filters: 1,
      rawSource: (tokens: ohm.Node[]) =>
        source.slice(locStart(tokens), tokens[tokens.length - 2].source.endIdx).trimEnd(),
      locStart,
      // The last node of this rule is a positive lookahead, we don't
      // want its endIdx, we want the endIdx of the previous one.
      locEnd: locEndSecondToLast,
      source,
    },

    canvasFilter: {
      type: ConcreteNodeTypes.CanvasFilter,
      name: 3,
      args(nodes: ohm.Node[]) {
        if (nodes[7].sourceString === '') {
          return []
        } else {
          return nodes[7].toAST((this as any).args.mapping)
        }
      },
      locStart,
      locEnd,
      source,
    },
    arguments: 0,
    tagArgument: 0,
    positionalArgument: 0,
    namedArgument: {
      type: ConcreteNodeTypes.NamedArgument,
      name: 0,
      value: 4,
      locStart,
      locEnd,
      source,
    },

    canvasString: 0,
    canvasDoubleQuotedString: {
      type: ConcreteNodeTypes.String,
      single: () => false,
      value: 1,
      locStart,
      locEnd,
      source,
    },
    canvasSingleQuotedString: {
      type: ConcreteNodeTypes.String,
      single: () => true,
      value: 1,
      locStart,
      locEnd,
      source,
    },

    canvasNumber: {
      type: ConcreteNodeTypes.Number,
      value: 0,
      locStart,
      locEnd,
      source,
    },

    canvasComparison: 0,

    canvasFunction: {
      type: ConcreteNodeTypes.Function,
      name: 0,
      args(nodes: ohm.Node[]) {
        if (nodes[4].sourceString === '') {
          return []
        } else {
          return nodes[4].toAST((this as any).args.mapping)
        }
      },
      locStart,
      locEnd,
      source,
    },

    canvasArrowFunction: {
      type: ConcreteNodeTypes.ArrowFunction,
      args(nodes: ohm.Node[]) {
        if (nodes[2].sourceString === '') {
          return []
        } else {
          return nodes[2].toAST((this as any).args.mapping)
        }
      },
      expression: 8,
      locStart,
      locEnd,
      source,
    },
    arrowFunctionArgumentList: 0,

    canvasVariableLookup: {
      type: ConcreteNodeTypes.VariableLookup,
      name: 0,
      lookups: 1,
      locStart,
      locEnd,
      source,
    },
    variableSegmentAsLookup: {
      type: ConcreteNodeTypes.VariableLookup,
      name: 0,
      lookups: () => [],
      locStart,
      locEnd,
      source,
    },

    lookup: 0,
    indexLookup: 3,
    dotLookup: {
      type: ConcreteNodeTypes.String,
      value: 3,
      locStart: (nodes: ohm.Node[]) => offset + nodes[2].source.startIdx,
      locEnd: (nodes: ohm.Node[]) => offset + nodes[nodes.length - 1].source.endIdx,
      source,
    },

    tagMarkup: (n: ohm.Node) => n.sourceString.trim(),
  }

  const CanvasHTMLMappings: Mapping = {
    Node(nodes: ohm.Node) {
      const self = this as any
      const node: ohm.Node[] = []

      return node.concat(nodes.toAST(self.args.mapping))
    },

    HtmlComment: {
      type: ConcreteNodeTypes.HtmlComment,
      body: markup(1),
      locStart,
      locEnd,
      source,
    },

    HtmlVoidElement: {
      type: ConcreteNodeTypes.HtmlVoidElement,
      name: 1,
      attrList: 3,
      locStart,
      locEnd,
      source,
    },

    HtmlTagOpen: {
      type: ConcreteNodeTypes.HtmlTagOpen,
      name: 1,
      attrList: 2,
      locStart,
      locEnd,
      source,
    },

    HtmlTagClose: {
      type: ConcreteNodeTypes.HtmlTagClose,
      name: 1,
      locStart,
      locEnd,
      source,
    },

    leadingTagNamePart: 0,
    leadingTagNameTextNode: textNode,
    trailingTagNamePart: 0,
    trailingTagNameTextNode: textNode,
    tagName(leadingPart: ohm.Node, trailingParts: ohm.Node) {
      const mappings = (this as any).args.mapping
      return [leadingPart.toAST(mappings)].concat(trailingParts.toAST(mappings))
    },

    AttrUnquoted: {
      type: ConcreteNodeTypes.AttrUnquoted,
      name: 0,
      value: 2,
      locStart,
      locEnd,
      source,
    },

    AttrSingleQuoted: {
      type: ConcreteNodeTypes.AttrSingleQuoted,
      name: 0,
      value: 3,
      locStart,
      locEnd,
      source,
    },

    AttrDoubleQuoted: {
      type: ConcreteNodeTypes.AttrDoubleQuoted,
      name: 0,
      value: 3,
      locStart,
      locEnd,
      source,
    },

    attrEmpty: {
      type: ConcreteNodeTypes.AttrEmpty,
      name: 0,
      locStart,
      locEnd,
      source,
    },

    attrName: 0,
    attrNameTextNode: textNode,
    attrDoubleQuotedValue: 0,
    attrSingleQuotedValue: 0,
    attrUnquotedValue: 0,
    attrDoubleQuotedTextNode: textNode,
    attrSingleQuotedTextNode: textNode,
    attrUnquotedTextNode: textNode,
  }

  const defaultMappings = {
    HelperMappings,
    CanvasMappings,
    CanvasHTMLMappings,
  }

  const selectedMappings = cstMappings.reduce(
    (mappings, key) => ({
      ...mappings,
      ...defaultMappings[key],
    }),
    {}
  )

  return toAST(res, selectedMappings) as T
}
