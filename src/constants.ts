import htmlStyles from 'html-styles'

const getCssStyleTags = (property: string) =>
  Object.fromEntries(
    htmlStyles
      .filter((htmlStyle) => htmlStyle.style[property])
      .flatMap((htmlStyle) =>
        htmlStyle.selectorText
          .split(',')
          .map((selector) => selector.trim())
          .filter((selector) => /^[\dA-Za-z]+$/.test(selector))
          .map((tagName) => [tagName, htmlStyle.style[property]])
      )
  )

export const CSS_DISPLAY_TAGS: Record<string, string> = {
  ...getCssStyleTags('display'),
}

export const CSS_DISPLAY_CANVAS_TAGS: Record<string, string> = {}

export const CSS_DISPLAY_CANVAS_DEFAULT = 'inline'

export const CSS_DISPLAY_DEFAULT = 'inline'
export const CSS_WHITE_SPACE_TAGS: Record<string, string> = getCssStyleTags('white-space')
export const CSS_WHITE_SPACE_DEFAULT = 'normal'

export const CSS_WHITE_SPACE_CANVAS_TAGS: Record<string, string> = {
  verbatim: 'pre',
}
