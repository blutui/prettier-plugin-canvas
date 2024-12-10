import {
  CSS_DISPLAY_CANVAS_DEFAULT,
  CSS_DISPLAY_CANVAS_TAGS,
  CSS_DISPLAY_DEFAULT,
  CSS_DISPLAY_TAGS,
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
    case NodeTypes.String:
    case NodeTypes.Number:
    case NodeTypes.VariableLookup:
    case NodeTypes.LogicalExpression:
      return 'should not be relevant'

    default:
      return assertNever(node)
  }
}

export const augmentWithCssProperties: Augment<WithSiblings> = (options, node) => {
  const augmentations: WithCssProperties = {
    cssDisplay: getCssDisplay(node, options),
    cssWhitespace: '',
  }

  Object.assign(node, augmentations)
}
