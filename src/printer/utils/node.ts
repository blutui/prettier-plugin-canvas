import { CanvasNodeTypes, HtmlNodeTypes, NodeTypes, Position } from '@/parser'
import {
  CanvasHtmlNode,
  CanvasNode,
  CanvasTag,
  CanvasVariableOutput,
  HtmlComment,
  HtmlDanglingMarkerClose,
  HtmlElement,
  HtmlNode,
  HtmlSelfClosingElement,
  HtmlVoidElement,
  TextNode,
} from '@/types'

export function isPreLikeNode(node: { cssWhitespace: string }) {
  return node.cssWhitespace.startsWith('pre')
}

export function hasNoCloseMarker(
  node: CanvasHtmlNode
): node is
  | HtmlComment
  | HtmlVoidElement
  | HtmlSelfClosingElement
  | HtmlDanglingMarkerClose
  | HtmlElement {
  return hasNoChildren(node) || isHtmlDanglingMarkerOpen(node)
}

export function hasNoChildren(
  node: CanvasHtmlNode
): node is HtmlComment | HtmlVoidElement | HtmlSelfClosingElement | HtmlDanglingMarkerClose {
  return (
    isSelfClosing(node) ||
    isVoidElement(node) ||
    isHtmlComment(node) ||
    isHtmlDanglingMarkerClose(node)
  )
}

export function isHtmlDanglingMarkerOpen(
  node: CanvasHtmlNode
): node is Omit<HtmlElement, 'blockPositionEnd'> & { blockEndPosition: Position } {
  return (
    node.type === NodeTypes.HtmlElement && node.blockEndPosition.start === node.blockEndPosition.end
  )
}

export function isHtmlDanglingMarkerClose(node: CanvasHtmlNode): node is HtmlDanglingMarkerClose {
  return node.type === NodeTypes.HtmlDanglingMarkerClose
}

export function isHtmlComment(node: CanvasHtmlNode): node is HtmlComment {
  return node.type === NodeTypes.HtmlComment
}

export function isSelfClosing(node: CanvasHtmlNode): node is HtmlSelfClosingElement {
  return node.type === NodeTypes.HtmlSelfClosingElement
}

export function isVoidElement(node: CanvasHtmlNode): node is HtmlVoidElement {
  return node.type === NodeTypes.HtmlVoidElement
}

export function isTextLikeNode(node: CanvasHtmlNode | undefined): node is TextNode {
  return !!node && node.type === NodeTypes.TextNode
}

export function isCanvasNode(node: CanvasHtmlNode | undefined): node is CanvasNode {
  return !!node && CanvasNodeTypes.includes(node.type as any)
}

export function isHtmlNode(node: CanvasHtmlNode | undefined): node is HtmlNode {
  return !!node && HtmlNodeTypes.includes(node.type as any)
}

export function hasNonTextChild(node: CanvasHtmlNode) {
  return (
    (node as any).children &&
    (node as any).children.some((child: CanvasHtmlNode) => child.type !== NodeTypes.TextNode)
  )
}

export function isPrettierIgnoreHtmlNode(node: CanvasHtmlNode | undefined): node is HtmlComment {
  return (
    !!node && node.type === NodeTypes.HtmlComment && /^\s*prettier-ignore(?=\s|$)/m.test(node.body)
  )
}

export function isPrettierIgnoreCanvasNode(node: CanvasHtmlNode | undefined): node is CanvasTag {
  return (
    !!node &&
    node.type === NodeTypes.CanvasTag &&
    node.name === '#' &&
    /^\s*prettier-ignore(?=\s|$)/m.test(node.markup)
  )
}

export function isPrettierIgnoreNode(
  node: CanvasHtmlNode | undefined
): node is HtmlComment | CanvasTag {
  return isPrettierIgnoreCanvasNode(node) || isPrettierIgnoreHtmlNode(node)
}

export function hasPrettierIgnore(node: CanvasHtmlNode) {
  return isPrettierIgnoreNode(node) || isPrettierIgnoreNode(node.prev)
}

export function forceNextEmptyLine(node: CanvasHtmlNode | undefined) {
  if (!node) return false
  if (!node.next) return false
}

export function forceBreakContent(node: CanvasHtmlNode) {
  return (
    forceBreakChildren(node) ||
    (node.type === NodeTypes.HtmlElement &&
      node.children.length > 0 &&
      (isTagNameIncluded(['body', 'script', 'style'], node.name) ||
        node.children.some((child) => hasNonTextChild(child)))) ||
    (node.firstChild &&
      node.firstChild === node.lastChild &&
      node.firstChild.type !== NodeTypes.TextNode &&
      hasLeadingLineBreak(node.firstChild) &&
      (!node.lastChild.isTrailingWhitespaceSensitive || hasTrailingLineBreak(node.lastChild)))
  )
}

export function forceBreakChildren(node: CanvasHtmlNode) {
  return (
    node.type === NodeTypes.HtmlElement &&
    node.children.length > 0 &&
    (isTagNameIncluded(['html', 'head', 'ul', 'ol', 'select'], node.name) ||
      (node.cssDisplay.startsWith('table') && node.cssDisplay !== 'table-cell'))
  )
}

export function preferHardlineAsSurroundingSpaces(node: CanvasHtmlNode) {
  switch (node.type) {
    case NodeTypes.HtmlComment:
      return true
    case NodeTypes.HtmlElement:
      return isTagNameIncluded(['script', 'select'], node.name)
    case NodeTypes.CanvasTag:
      if ((node.prev && isTextLikeNode(node.prev)) || (node.next && isTextLikeNode(node.next))) {
        return false
      }
      return node.children && node.children.length > 0
  }

  return false
}

export function preferHardlineAsLeadingSpaces(node: CanvasHtmlNode) {
  return (
    preferHardlineAsSurroundingSpaces(node) ||
    (isCanvasNode(node) && node.prev && isCanvasNode(node.prev)) ||
    (node.prev && preferHardlineAsTrailingSpaces(node.prev)) ||
    hasSurroundingLineBreak(node)
  )
}

export function preferHardlineAsTrailingSpaces(node: CanvasHtmlNode) {
  return (
    preferHardlineAsSurroundingSpaces(node) ||
    (isCanvasNode(node) && node.next && (isCanvasNode(node.next) || isHtmlNode(node.next))) ||
    (node.type === NodeTypes.HtmlElement && isTagNameIncluded(['br'], node.name)) ||
    hasSurroundingLineBreak(node)
  )
}

export function hasMeaningfulLackOfLeadingWhitespace(node: CanvasHtmlNode): boolean {
  return node.isLeadingWhitespaceSensitive && !node.hasLeadingWhitespace
}

export function hasMeaningfulLackOfTrailingWhitespace(node: CanvasHtmlNode): boolean {
  return node.isTrailingWhitespaceSensitive && !node.hasTrailingWhitespace
}

function hasLeadingLineBreak(node: CanvasHtmlNode) {
  if (node.type === NodeTypes.Document) return false
}

function hasTrailingLineBreak(node: CanvasHtmlNode) {
  if (node.type === NodeTypes.Document) return false
}

export function getLastDescendant(node: CanvasHtmlNode): CanvasHtmlNode {
  return node.lastChild ? getLastDescendant(node.lastChild) : node
}

function isTagNameIncluded(
  collection: string[],
  name: (TextNode | CanvasVariableOutput)[]
): boolean {
  if (name.length !== 1 || name[0].type !== NodeTypes.TextNode) return false
  return collection.includes(name[0].value)
}
