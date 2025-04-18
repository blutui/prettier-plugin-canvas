import {
  Augment,
  AugmentedNode,
  CanvasNode,
  HtmlElement,
  WithCssProperties,
  WithFamily,
  WithParent,
  WithSiblings,
  WithWhitespaceHelpers,
} from '@/types'
import { isAttributeNode, isPreLikeNode, isScriptLikeTag, isWhitespace } from '../utils'
import { CanvasNodeTypes, HtmlNodeTypes, isBranchedTag, NodeTypes } from '@/parser'
import {
  CSS_WHITE_SPACE_CANVAS_TAGS,
  CSS_WHITE_SPACE_DEFAULT,
  CSS_WHITE_SPACE_TAGS,
} from '@/constants'

type RequiredAugmentations = WithParent & WithSiblings & WithFamily & WithCssProperties
type AugmentedAstNode = AugmentedNode<RequiredAugmentations>

export const augmentWithWhitespaceHelpers: Augment<RequiredAugmentations> = (_options, node) => {
  if (node.cssDisplay === 'should not be relevant') {
    return
  }

  const augmentations: WithWhitespaceHelpers = {
    isDanglingWhitespaceSensitive: isDanglingWhitespaceSensitiveNode(node),
    isIndentationSensitive: isIndentationSensitiveNode(node),
    isWhitespaceSensitive: isWhitespaceSensitiveNode(node),
    // If either isn't sensitive, then this one isn't
    isLeadingWhitespaceSensitive:
      isLeadingWhitespaceSensitiveNode(node) &&
      (!node.prev || isTrailingWhitespaceSensitiveNode(node.prev)),
    // If either isn't sensitive, then this one isn't
    isTrailingWhitespaceSensitive:
      isTrailingWhitespaceSensitiveNode(node) &&
      (!node.next || isLeadingWhitespaceSensitiveNode(node.next)),
    hasLeadingWhitespace: hasLeadingWhitespace(node),
    hasTrailingWhitespace: hasTrailingWhitespace(node),
    hasDanglingWhitespace: hasDanglingWhitespace(node),
  }

  Object.assign(node, augmentations)
}

/**
 * A node is dangling whitespace sensitive when whitespace in an empty node
 * (no children) has meaning in the rendered output.
 */
function isDanglingWhitespaceSensitiveNode(node: AugmentedAstNode) {
  return (
    isDanglingSpaceSensitiveCssDisplay(node.cssDisplay) &&
    !isScriptLikeTag(node) &&
    !isTrimmingInnerLeft(node) &&
    !isTrimmingInnerRight(node)
  )
}

/**
 * A node is whitespace sensitive when its contents is sensitive to
 * whitespace. That is, whitespace between nodes must be maintained
 * otherwise the rendered output would be different.
 */
function isWhitespaceSensitiveNode(node: AugmentedAstNode) {
  return isIndentationSensitiveNode(node)
}

function isIndentationSensitiveNode(node: AugmentedAstNode) {
  return getNodeCssStyleWhiteSpace(node).startsWith('pre')
}

function isLeadingWhitespaceSensitiveNode(node: AugmentedAstNode | undefined): boolean {
  if (!node) {
    return false
  }

  if (node.type === NodeTypes.CanvasBranch) {
    const isDefaultBranch = node.name === null
    const hasNoChildren = !!node.firstChild
    const isParentInnerRightSensitive = isInnerLeftSpaceSensitiveCssDisplay(
      node.parentNode!.cssDisplay
    )
    const isFirstChildLeadingSensitive = isLeadingWhitespaceSensitiveNode(node.firstChild)

    // {% if %}<emptythis>{% endif %}
    // {% if %}this{% endif %}
    if (isDefaultBranch) {
      return isParentInnerRightSensitive && (!hasNoChildren || isFirstChildLeadingSensitive)
    }

    // {% if %}{% <elseasthis> %}anything{% endif %}
    return isParentInnerRightSensitive
  }

  // <a data-{{ this }}="hi">
  if (
    node.parentNode &&
    isAttributeNode(node.parentNode) &&
    node.type === NodeTypes.CanvasVariableOutput
  ) {
    return true
  }

  // {{- this }}
  if (isTrimmingOuterLeft(node)) {
    return false
  }

  // {{ output -}} this
  if (node.prev && isTrimmingOuterRight(node.prev)) {
    return false
  }

  // Invisible nodes aren't whitespace sensitive
  if (!node.parentNode || node.parentNode.cssDisplay === 'none') {
    return false
  }

  // <pre> tags are whitespace sensitive, so nodes in 'em are all leading
  // whitespace sensitive.
  if (isPreLikeNode(node.parentNode)) {
    return true
  }

  if (isScriptLikeTag(node)) {
    return false
  }

  if (
    !node.prev &&
    (node.parentNode.type === NodeTypes.Document ||
      isPreLikeNode(node) ||
      isScriptLikeTag(node.parentNode) ||
      !isInnerLeftSpaceSensitiveCssDisplay(node.parentNode.cssDisplay) ||
      isTrimmingInnerLeft(node.parentNode))
  ) {
    return false
  }

  if (node.prev && !isOuterRightWhitespaceSensitiveCssDisplay(node.prev.cssDisplay)) {
    return false
  }

  if (!isOuterLeftWhitespaceSensitiveCssDisplay(node.cssDisplay)) {
    return false
  }

  return true
}

function isTrailingWhitespaceSensitiveNode(node: AugmentedAstNode): boolean {
  if (!node) {
    return false
  }

  if (node.type === NodeTypes.CanvasBranch) {
    const isLastBranch = node.parentNode && node.parentNode.lastChild === node
    const hasNoLastChild = !node.lastChild
    const lastChild = node.lastChild
    const isLastChildTrailingSensitive = !!lastChild && isTrailingWhitespaceSensitiveNode(lastChild)

    // {% if %}{% elseif cond %}<emptythis>{% endif %}
    // {% if %}{% elseif cond %}this{% endif %}
    // {% if %}{% else %}<emptythis>{% endif %}
    // {% if %}{% else %}this{% endif %}
    if (isLastBranch) {
      const isParentInnerRightSensitive = isInnerRightWhitespaceSensitiveCssDisplay(
        node.parentNode!.cssDisplay
      )
      return isParentInnerRightSensitive && (hasNoLastChild || isLastChildTrailingSensitive)
    }

    // {% if %}<emptythis>{% endif %}
    // {% if %}<emptythis>{% else %}{% endif %}
    // {% if %}{% elseif cond %}<emptythis>{% else %}{% endif %}
    // {% if %}this{% endif %}
    // {% if %}this{% else %}{% endif %}
    // {% if %}{% elseif cond %}this{% else %}{% endif %}
    return hasNoLastChild || isLastChildTrailingSensitive
  }

  // {% if cond %}<this>{% endif %}
  // {% if cond %}<this><a>{% endif %}
  // {% if cond %}<this><div>{% endif %}
  // {% if cond %}<this><div></div>{% endif %}
  // {% if cond %}<this>{% render 'icon' %}{% endif %}
  if (isHtmlElementWithoutCloseTag(node)) {
    if (!node.lastChild) {
      return isInnerLeftSpaceSensitiveCssDisplay(node.cssDisplay)
    }

    return (
      createsInlineFormattingContext(node.cssDisplay) &&
      isTrailingWhitespaceSensitiveNode(node.lastChild)
    )
  }

  // '{{ output -}} text'
  if (isTrimmingOuterRight(node)) {
    return false
  }

  // <a data-{{ this }}="hi">
  if (
    node.parentNode &&
    isAttributeNode(node.parentNode) &&
    node.type === NodeTypes.CanvasVariableOutput
  ) {
    return true
  }

  // 'text {{- output }}'
  if (node.next && isTrimmingOuterLeft(node.next)) {
    return false
  }

  // the root node and invisible nodes are not trailing whitespace
  // sensitive
  if (!node.parentNode || node.parentNode.cssDisplay === 'none') {
    return false
  }

  // pre-like nodes are whitespace sensitive (globally), therefore if this
  // node's parent is pre-like, this node is whitespace sensitive to the right.
  if (isPreLikeNode(node.parentNode)) {
    return true
  }

  // We do it slightly differently than prettier/prettier.
  if (isScriptLikeTag(node)) {
    return false
  }

  // BRs are not trailing whitespace sensitive, it's an exception as per prettier/language-html
  // https://github.com/prettier/prettier/blob/c36d89712a24fdef753c056f4c82bc87ebe07865/src/language-html/utils/index.js#L290-L296
  if (isHtmlNode(node) && typeof node.name === 'string' && node.name === 'br') {
    return false
  }

  if (
    !node.next &&
    (node.parentNode.type === NodeTypes.Document ||
      isPreLikeNode(node) ||
      isScriptLikeTag(node.parentNode) ||
      (!isHtmlElementWithoutCloseTag(node.parentNode) &&
        !isInnerRightWhitespaceSensitiveCssDisplay(node.parentNode.cssDisplay)) ||
      isTrimmingInnerRight(node.parentNode) ||
      isAttributeNode(node as any))
  ) {
    return false
  }

  if (node.next && !isOuterLeftWhitespaceSensitiveCssDisplay(node.next.cssDisplay)) {
    return false
  }

  if (!isOuterRightWhitespaceSensitiveCssDisplay(node.cssDisplay)) {
    return false
  }

  return true
}

/**
 * Dangling whitespace is whitespace in an empty parent.
 */
function hasDanglingWhitespace(node: AugmentedAstNode): boolean {
  if (!isParentNode(node)) {
    return false
  } else if (node.type === NodeTypes.Document) {
    return node.children.length === 0 && node.source.length > 0
  } else if (!node.children) {
    return false
  } else if (
    node.type === NodeTypes.CanvasTag &&
    isBranchedTag(node) &&
    node.children.length === 1
  ) {
    return hasDanglingWhitespace(node.firstChild!)
  } else if (node.children.length > 0) {
    return false
  }

  return isWhitespace(node.source, node.blockStartPosition.end)
}

function hasLeadingWhitespace(node: AugmentedAstNode): boolean {
  if (node.type === NodeTypes.CanvasBranch && !node.prev) {
    return node.firstChild ? hasLeadingWhitespace(node.firstChild) : hasDanglingWhitespace(node)
  }
  return isWhitespace(node.source, node.position.start - 1)
}

function hasTrailingWhitespace(node: AugmentedAstNode): boolean {
  if (node.type === NodeTypes.CanvasBranch || isHtmlElementWithoutCloseTag(node)) {
    return node.lastChild ? hasTrailingWhitespace(node.lastChild) : hasDanglingWhitespace(node)
  }
  return isWhitespace(node.source, node.position.end)
}

type ParentNode = Extract<AugmentedAstNode, { children?: AugmentedAstNode[] }>

type HtmlNode = Extract<AugmentedAstNode, { type: (typeof HtmlNodeTypes)[number] }>

export function isHtmlNode(node: AugmentedAstNode): node is HtmlNode {
  return HtmlNodeTypes.includes(node.type as any)
}

export function isCanvasNode(node: AugmentedAstNode | undefined): node is CanvasNode {
  return !!node && CanvasNodeTypes.includes(node.type as any)
}

export function isParentNode(node: AugmentedAstNode): node is ParentNode {
  return 'children' in node
}

export function isTrimmingOuterRight(node: AugmentedAstNode | undefined): boolean {
  if (!node) return false
  switch (node.type) {
    case NodeTypes.CanvasRawTag:
    case NodeTypes.CanvasTag: // {% if a %}{% endif -%}, {% set x -%}
      return (node.delimiterWhitespaceEnd ?? node.whitespaceEnd) === '-'
    case NodeTypes.CanvasBranch:
      return false
    case NodeTypes.CanvasVariableOutput: // {{ foo -}}
      return node.whitespaceEnd === '-'
    default:
      return false
  }
}

export function isTrimmingOuterLeft(node: AugmentedAstNode | undefined): boolean {
  if (!node) return false
  switch (node.type) {
    case NodeTypes.CanvasRawTag:
    case NodeTypes.CanvasTag: // {%- if a %}{% endif %}, {%- set x = 1 %}
    case NodeTypes.CanvasBranch: // {%- else %}
    case NodeTypes.CanvasVariableOutput: // {{- 'val' }}
      return node.whitespaceStart === '-'
    default:
      return false
  }
}

export function isTrimmingInnerLeft(node: AugmentedAstNode | undefined): boolean {
  if (!node) return false
  switch (node.type) {
    case NodeTypes.CanvasRawTag:
    case NodeTypes.CanvasTag: // {% form a -%}{% endform %}
      if (node.delimiterWhitespaceEnd === undefined) return false
      return node.whitespaceEnd === '-'
    case NodeTypes.CanvasBranch: // {% if a -%}{% else -%}{% endif %}
      // This branch should never happen.
      if (!node.parentNode || node.parentNode.type !== NodeTypes.CanvasTag) {
        return false
      }

      // First branch gets this from the parent
      if (!node.prev) {
        return isTrimmingInnerLeft(node.parentNode)
      }

      // Otherwise gets it from the delimiter. e.g. {% else -%}
      return node.whitespaceEnd === '-'
    case NodeTypes.CanvasVariableOutput:
    default:
      return false
  }
}

export function isTrimmingInnerRight(node: AugmentedAstNode | undefined): boolean {
  if (!node) return false
  switch (node.type) {
    case NodeTypes.CanvasRawTag:
    case NodeTypes.CanvasTag: // {% if a %}{%- endif %}
      if (node.delimiterWhitespaceStart === undefined) return false
      return node.delimiterWhitespaceStart === '-'
    case NodeTypes.CanvasBranch:
      // This branch should never happen.
      if (!node.parentNode || node.parentNode.type !== NodeTypes.CanvasTag) {
        return false
      }

      // Last branch gets this from the parent
      if (!node.next) {
        return isTrimmingInnerRight(node.parentNode)
      }

      // Otherwise gets it from the next branch
      return isTrimmingOuterLeft(node.next)
    case NodeTypes.CanvasVariableOutput:
    default:
      return false
  }
}

function createsInlineFormattingContext(cssDisplay: string) {
  return (
    isBlockLikeCssDisplay(cssDisplay) || cssDisplay === 'inline' || cssDisplay === 'inline-block'
  )
}

function isBlockLikeCssDisplay(cssDisplay: string) {
  return cssDisplay === 'block' || cssDisplay === 'list-item' || cssDisplay.startsWith('table')
}

function isInnerLeftSpaceSensitiveCssDisplay(cssDisplay: string) {
  return !isBlockLikeCssDisplay(cssDisplay) && cssDisplay !== 'inline-block'
}

function isInnerRightWhitespaceSensitiveCssDisplay(cssDisplay: string) {
  return !isBlockLikeCssDisplay(cssDisplay) && cssDisplay !== 'inline-block'
}

function isOuterLeftWhitespaceSensitiveCssDisplay(cssDisplay: string) {
  return !isBlockLikeCssDisplay(cssDisplay)
}

function isOuterRightWhitespaceSensitiveCssDisplay(cssDisplay: string) {
  return !isBlockLikeCssDisplay(cssDisplay)
}

function isDanglingSpaceSensitiveCssDisplay(cssDisplay: string) {
  return !isBlockLikeCssDisplay(cssDisplay) && cssDisplay !== 'inline-block'
}

function getNodeCssStyleWhiteSpace(node: AugmentedAstNode) {
  return (
    (isHtmlNode(node) && typeof node.name === 'string' && CSS_WHITE_SPACE_TAGS[node.name]) ||
    (isCanvasNode(node) &&
      'name' in node &&
      typeof node.name === 'string' &&
      CSS_WHITE_SPACE_CANVAS_TAGS[node.name]) ||
    CSS_WHITE_SPACE_DEFAULT
  )
}

function isHtmlElementWithoutCloseTag(node: AugmentedAstNode | undefined): node is HtmlElement {
  return (
    !!node &&
    node.type === NodeTypes.HtmlElement &&
    node.blockEndPosition.start === node.blockEndPosition.end
  )
}
