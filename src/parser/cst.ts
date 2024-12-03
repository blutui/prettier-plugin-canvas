import * as ohm from 'ohm-js'
import { toAST } from 'ohm-js/extras'

import { CanvasGrammars, placeholderGrammars, strictGrammars, tolerantGrammars } from './grammar'
import { NamedTags } from './types'

export enum ConcreteNodeTypes {
  HtmlComment = 'HtmlComment',
  HtmlTagOpen = 'HtmlTagOpen',
  HtmlTagClose = 'HtmlTagClose',
  CanvasVariableOutput = 'CanvasVariableOutput',
  CanvasTag = 'CanvasTag',
  TextNode = 'TextNode',

  CanvasVariable = 'CanvasVariable',
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

export interface ConcreteHtmlTagOpen extends ConcreteHtmlNodeBase<ConcreteNodeTypes.HtmlTagOpen> {
  name: (ConcreteTextNode | ConcreteCanvasVariableOutput)[]
}
export interface ConcreteHtmlTagClose extends ConcreteHtmlNodeBase<ConcreteNodeTypes.HtmlTagClose> {
  name: (ConcreteTextNode | ConcreteCanvasVariableOutput)[]
}

export type ConcreteAttributeNode = ConcreteCanvasNode

export type ConcreteCanvasNode = ConcreteCanvasTag | ConcreteCanvasVariableOutput

export type ConcreteCanvasTag = ConcreteCanvasTagNamed
export type ConcreteCanvasTagNamed = ConcreteCanvasTagInclude

interface ConcreteBasicCanvasNode<T> extends ConcreteBasicNode<T> {}

export interface ConcreteCanvasTagNode<Name, Markup>
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasTag> {
  markup: Markup
  name: Name
}

export interface ConcreteCanvasTagInclude
  extends ConcreteCanvasTagNode<NamedTags.include, ConcreteCanvasTagIncludeMarkup> {}

export interface ConcreteCanvasTagIncludeMarkup {}

export interface ConcreteCanvasVariableOutput
  extends ConcreteBasicCanvasNode<ConcreteNodeTypes.CanvasVariableOutput> {
  markup: ConcreteCanvasVariable | string
}

export interface ConcreteCanvasVariable
  extends ConcreteBasicNode<ConcreteNodeTypes.CanvasVariable> {
  rawSource: string
}

export type ConcreteHtmlNode = ConcreteHtmlComment | ConcreteHtmlTagOpen | ConcreteHtmlTagClose

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
    console.error('failed to match')
  }

  const HelperMappings: Mapping = {
    Node: 0,
    TextNode: textNode,
    orderedListOf: 0,

    listOf: 0,
    empty: () => null,
  }

  const CanvasMappings: Mapping = {
    canvasNode: 0,
  }

  const CanvasHTMLMappings: Mapping = {
    Node(nodes: ohm.Node) {
      const self = this as any
      const node = []

      return node.concat(nodes.toAST(self.args.mapping))
    },

    HtmlComment: {
      type: ConcreteNodeTypes.HtmlComment,
      body: markup(1),
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

    attrName: 0,
    attrNameTextNode: textNode,
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
