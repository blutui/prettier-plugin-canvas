import {
  CSS_DISPLAY_CANVAS_DEFAULT,
  CSS_DISPLAY_CANVAS_TAGS,
  CSS_DISPLAY_DEFAULT,
  CSS_DISPLAY_TAGS,
  CSS_WHITE_SPACE_CANVAS_TAGS,
  CSS_WHITE_SPACE_DEFAULT,
  CSS_WHITE_SPACE_TAGS,
} from '@/constants'
import { NodeTypes } from '@/parser'
import {
  Augment,
  AugmentedNode,
  CanvasParserOptions,
  WithCssProperties,
  WithSiblings,
} from '@/types'
import { assertNever } from '@/utils'

function getCssDisplayFromComment(body: string) {
  return body.match(/^\s*display:\s*([a-z]+)\s*$/)?.[1]
}

function getCssWhitespaceFromComment(body: string) {
  return body.match(/^\s*white-?space:\s*([a-z]+)\s*$/)?.[1]
}

function getCssDisplay(node: AugmentedNode<WithSiblings>, options: CanvasParserOptions): string {
  if (node.prev && node.prev.type === NodeTypes.HtmlComment) {
    // <!-- display: block -->
    const cssDisplay = getCssDisplayFromComment(node.prev.body)
    if (cssDisplay) {
      return cssDisplay
    }
  }

  switch (node.type) {
    case NodeTypes.HtmlElement:
    case NodeTypes.HtmlDanglingMarkerClose:
    case NodeTypes.HtmlSelfClosingElement: {
      switch (options.htmlWhitespaceSensitivity) {
        case 'strict':
          return 'inline'
        case 'ignore':
          return 'block'
        default: {
          return (
            (node.name.length === 1 &&
              node.name[0].type === NodeTypes.TextNode &&
              CSS_DISPLAY_TAGS[node.name[0].value]) ||
            CSS_DISPLAY_DEFAULT
          )
        }
      }
    }

    case NodeTypes.HtmlVoidElement:
    case NodeTypes.HtmlRawNode: {
      switch (options.htmlWhitespaceSensitivity) {
        case 'strict':
          return 'inline'
        case 'ignore':
          return 'block'
        default: {
          return CSS_DISPLAY_TAGS[node.name] || CSS_DISPLAY_DEFAULT
        }
      }
    }

    case NodeTypes.RawMarkup:
    case NodeTypes.TextNode:
      return 'inline'

    case NodeTypes.CanvasTag:
    case NodeTypes.CanvasRawTag:
      switch (options.htmlWhitespaceSensitivity) {
        default: {
          return CSS_DISPLAY_CANVAS_TAGS[node.name] || CSS_DISPLAY_CANVAS_DEFAULT
        }
      }

    case NodeTypes.CanvasBranch:
    case NodeTypes.CanvasVariableOutput:
      return 'inline'

    case NodeTypes.AttrDoubleQuoted:
    case NodeTypes.AttrSingleQuoted:
    case NodeTypes.AttrUnquoted:
    case NodeTypes.AttrEmpty:
      return 'inline'

    case NodeTypes.HtmlDoctype:
    case NodeTypes.HtmlComment:
      return 'block'

    case NodeTypes.Document:
      return 'block'

    case NodeTypes.CanvasVariable:
    case NodeTypes.CanvasFilter:
    case NodeTypes.NamedArgument:
    case NodeTypes.CanvasLiteral:
    case NodeTypes.Concatenation:
    case NodeTypes.String:
    case NodeTypes.Number:
    case NodeTypes.Range:
    case NodeTypes.Sequence:
    case NodeTypes.Mapping:
    case NodeTypes.Function:
    case NodeTypes.ArrowFunction:
    case NodeTypes.VariableLookup:
    case NodeTypes.SetMarkup:
    case NodeTypes.LogicalExpression:
    case NodeTypes.Comparison:
      return 'should not be relevant'

    default:
      return assertNever(node)
  }
}

function getNodeCssStyleWhiteSpace(
  node: AugmentedNode<WithSiblings>,
  options: CanvasParserOptions
): string {
  if (node.prev && node.prev.type === NodeTypes.HtmlComment) {
    // <!-- white-space: normal -->
    const whitespace = getCssWhitespaceFromComment(node.prev.body)
    if (whitespace) {
      return whitespace
    }
  }

  switch (node.type) {
    case NodeTypes.HtmlElement:
    case NodeTypes.HtmlDanglingMarkerClose:
    case NodeTypes.HtmlSelfClosingElement: {
      return (
        (node.name.length === 1 &&
          node.name[0].type === NodeTypes.TextNode &&
          CSS_WHITE_SPACE_TAGS[node.name[0].value]) ||
        CSS_WHITE_SPACE_DEFAULT
      )
    }

    case NodeTypes.HtmlVoidElement:
    case NodeTypes.HtmlRawNode: {
      return CSS_WHITE_SPACE_TAGS[node.name] || CSS_WHITE_SPACE_DEFAULT
    }

    case NodeTypes.TextNode:
      return CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.RawMarkup:
    case NodeTypes.CanvasRawTag:
      return 'pre'

    case NodeTypes.CanvasTag:
      return CSS_WHITE_SPACE_CANVAS_TAGS[node.name] || CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.CanvasBranch:
    case NodeTypes.CanvasVariableOutput:
      return CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.AttrDoubleQuoted:
    case NodeTypes.AttrSingleQuoted:
    case NodeTypes.AttrUnquoted:
    case NodeTypes.AttrEmpty:
      return CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.HtmlDoctype:
    case NodeTypes.HtmlComment:
      return CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.Document:
      return CSS_WHITE_SPACE_DEFAULT

    case NodeTypes.CanvasVariable:
    case NodeTypes.CanvasFilter:
    case NodeTypes.NamedArgument:
    case NodeTypes.CanvasLiteral:
    case NodeTypes.Concatenation:
    case NodeTypes.String:
    case NodeTypes.Number:
    case NodeTypes.Range:
    case NodeTypes.Sequence:
    case NodeTypes.Mapping:
    case NodeTypes.Function:
    case NodeTypes.ArrowFunction:
    case NodeTypes.VariableLookup:
    case NodeTypes.SetMarkup:
    case NodeTypes.LogicalExpression:
    case NodeTypes.Comparison:
      return 'should not be relevant'

    default:
      return assertNever(node)
  }
}

export const augmentWithCssProperties: Augment<WithSiblings> = (options, node) => {
  const augmentations: WithCssProperties = {
    cssDisplay: getCssDisplay(node, options),
    cssWhitespace: getNodeCssStyleWhiteSpace(node, options),
  }

  Object.assign(node, augmentations)
}
