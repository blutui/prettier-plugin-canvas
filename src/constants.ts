import htmlStyles from 'html-styles'

const getCssStyleTags = (property: string) =>
  Object.fromEntries(
    htmlStyles
      .filter((htmlStyle: any) => htmlStyle.style[property])
      .flatMap((htmlStyle: any) =>
        htmlStyle.selectorText
          .split(',')
          .map((selector: any) => selector.trim())
          .filter((selector: any) => /^[\dA-Za-z]+$/.test(selector))
          .map((tagName: any) => [tagName, htmlStyle.style[property]])
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
