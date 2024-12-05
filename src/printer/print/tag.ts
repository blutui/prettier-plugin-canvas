import {
  AstPath,
  CanvasHtmlNode,
  CanvasParserOptions,
  CanvasPrinter,
  HtmlDanglingMarkerClose,
  HtmlElement,
  HtmlNode,
  HtmlSelfClosingElement,
} from '@/types'
import {
  getLastDescendant,
  hasMeaningfulLackOfLeadingWhitespace,
  hasMeaningfulLackOfTrailingWhitespace,
  hasNoChildren,
  hasNoCloseMarker,
  hasPrettierIgnore,
  isCanvasNode,
  isHtmlComment,
  isHtmlDanglingMarkerOpen,
  isHtmlNode,
  isPreLikeNode,
  isTextLikeNode,
  shouldPreserveContent,
} from '../utils'
import { NodeTypes } from '@/parser'

function shouldNotPrintClosingTag(node: CanvasHtmlNode, _options: CanvasParserOptions) {
  return (
    !hasNoCloseMarker(node) && // has close marker
    !(node as any).blockEndPosition && // does not have blockEndPosition
    (hasPrettierIgnore(node) || shouldPreserveContent(node.parentNode!))
  )
}

export function needsToBorrowPrevClosingTagEndMarker(node: CanvasHtmlNode) {
  return (
    !isCanvasNode(node) &&
    node.prev &&
    isHtmlNode(node.prev) &&
    hasMeaningfulLackOfLeadingWhitespace(node)
  )
}

export function needsToBorrowLastChildClosingTagEndMarker(node: CanvasHtmlNode) {
  return (
    isHtmlNode(node) &&
    node.lastChild &&
    hasMeaningfulLackOfTrailingWhitespace(node.lastChild) &&
    isHtmlNode(getLastDescendant(node.lastChild)) &&
    !isPreLikeNode(node)
  )
}

export function needsToBorrowParentClosingTagStartMarker(node: CanvasHtmlNode) {
  return (
    isHtmlNode(node.parentNode) &&
    !node.next &&
    hasMeaningfulLackOfTrailingWhitespace(node) &&
    !isCanvasNode(node) &&
    (isTextLikeNode(getLastDescendant(node)) || isCanvasNode(getLastDescendant(node)))
  )
}

export function needsToBorrowNextOpeningTagStartMarker(node: CanvasHtmlNode) {
  /**
   *     123<p
   *        ^^
   *     >
   */
  return (
    node.next &&
    isHtmlNode(node.next) &&
    isTextLikeNode(node) &&
    hasMeaningfulLackOfTrailingWhitespace(node)
  )
}

export function needsToBorrowParentOpeningTagEndMarker(node: CanvasHtmlNode) {
  return (
    isHtmlNode(node.parentNode) &&
    !node.prev &&
    hasMeaningfulLackOfLeadingWhitespace(node) &&
    !isCanvasNode(node)
  )
}

function printAttributes(
  path: AstPath<HtmlNode>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  attrGroupId: Symbol
) {
  const node = path.node

  if (isHtmlComment(node)) return ''
  if (node.type === NodeTypes.HtmlDanglingMarkerClose) return ''

  return []
}

export function printOpeningTag(
  path: AstPath<HtmlNode>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  attrGroupId: Symbol
) {
  const node = path.node

  return [
    printOpeningTagStart(node, options),
    printAttributes(path, options, print, attrGroupId),
    hasNoChildren(node) ? '' : printOpeningTagEnd(node),
  ]
}

export function printOpeningTagStart(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return node.prev && needsToBorrowNextOpeningTagStartMarker(node.prev)
    ? ''
    : [printOpeningTagPrefix(node, options), printOpeningTagStartMarker(node)]
}

export function printOpeningTagPrefix(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return needsToBorrowParentOpeningTagEndMarker(node)
    ? printOpeningTagEndMarker(node.parentNode) // opening tag '>' of parent
    : needsToBorrowPrevClosingTagEndMarker(node)
      ? printClosingTagEndMarker(node.prev, options) // closing '>' of previous
      : ''
}

export function printOpeningTagEnd(node: CanvasHtmlNode) {
  return node.firstChild && needsToBorrowParentOpeningTagEndMarker(node.firstChild)
    ? ''
    : printOpeningTagEndMarker(node)
}

export function printOpeningTagStartMarker(node: CanvasHtmlNode | undefined) {
  if (!node) return ''

  switch (node.type) {
    case NodeTypes.HtmlComment:
      return '<!--'
    case NodeTypes.HtmlElement:
    case NodeTypes.HtmlSelfClosingElement:
      return `<${getCompoundName(node)}`
    case NodeTypes.HtmlDanglingMarkerClose:
      return `</${getCompoundName(node)}`
    case NodeTypes.HtmlVoidElement:
    case NodeTypes.HtmlRawNode:
      return `<${node.name}`
    default:
      return '' // TODO
  }
}

export function printClosingTag(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return [
    hasNoCloseMarker(node) ? '' : printClosingTagStart(node, options),
    printClosingTagEnd(node, options),
  ]
}

export function printClosingTagStart(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return node.lastChild && needsToBorrowParentClosingTagStartMarker(node.lastChild)
    ? ''
    : [printClosingTagPrefix(node, options), printClosingTagStartMarker(node, options)]
}

export function printClosingTagEnd(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return (
    node.next
      ? needsToBorrowPrevClosingTagEndMarker(node.next)
      : needsToBorrowLastChildClosingTagEndMarker(node.parentNode!)
  )
    ? ''
    : [printClosingTagEndMarker(node, options), printClosingTagSuffix(node, options)]
}

export function printClosingTagPrefix(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return needsToBorrowLastChildClosingTagEndMarker(node)
    ? printClosingTagEndMarker(node.lastChild, options)
    : ''
}

export function printClosingTagSuffix(node: CanvasHtmlNode, options: CanvasParserOptions) {
  return needsToBorrowParentClosingTagStartMarker(node)
    ? printClosingTagStartMarker(node.parentNode, options)
    : needsToBorrowNextOpeningTagStartMarker(node)
      ? printOpeningTagStartMarker(node.next)
      : ''
}

export function printClosingTagStartMarker(
  node: CanvasHtmlNode | undefined,
  options: CanvasParserOptions
) {
  if (!node) return ''
  if (shouldNotPrintClosingTag(node, options)) {
    return ''
  }

  switch (node.type) {
    case NodeTypes.HtmlElement:
      return `</${getCompoundName(node)}`
    case NodeTypes.HtmlRawNode:
      return `</${node.name}`
    default:
      return ''
  }
}

export function printClosingTagEndMarker(
  node: CanvasHtmlNode | undefined,
  options: CanvasParserOptions
) {
  if (!node) return ''
  if (shouldNotPrintClosingTag(node, options) || isHtmlDanglingMarkerOpen(node)) {
    return ''
  }

  switch (node.type) {
    case NodeTypes.HtmlSelfClosingElement: {
      // looks like it doesn't make sense because it should be part of
      // the printOpeningTagEndMarker but this is handled somewhere else.
      // This function is used to determine what to borrow so the "end" to
      // borrow is actually the other end.
      return '/>'
    }

    default:
      return '>'
  }
}

export function printOpeningTagEndMarker(node: CanvasHtmlNode | undefined) {
  if (!node) return ''

  switch (node.type) {
    case NodeTypes.HtmlComment:
      return '-->'
    case NodeTypes.HtmlSelfClosingElement:
    case NodeTypes.HtmlVoidElement:
      return '' // the `>` is printed by the printClosingTagEndMarker for self closing things
    case NodeTypes.HtmlElement:
    case NodeTypes.HtmlDanglingMarkerClose:
    // TODO why is this one not with the other group?
    case NodeTypes.HtmlRawNode:
      return '>'
    default:
      return '>'
  }
}

function getCompoundName(
  node: HtmlElement | HtmlSelfClosingElement | HtmlDanglingMarkerClose
): string {
  return node.name
    .map((part) => {
      if (part.type === NodeTypes.TextNode) {
        return part.value
      } else if (typeof part.markup === 'string') {
        return `{{ ${part.markup.trim()} }}`
      } else {
        return `{{ ${part.markup.rawSource} }}`
      }
    })
    .join('')
}
