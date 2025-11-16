import { doc, Doc, Printer } from 'prettier'

import type { CanvasHtmlNode, CanvasParserOptions, RawMarkup } from '@/types'
import { NodeTypes, RawMarkupKinds } from '@/parser'

const {
  builders: { dedentToRoot, indent, hardline },
} = doc

export const ParserMap: { [key in RawMarkupKinds]: string | null } = {
  [RawMarkupKinds.css]: 'css',
  [RawMarkupKinds.html]: 'html',
  [RawMarkupKinds.javascript]: 'babel',
  [RawMarkupKinds.json]: 'json',
  [RawMarkupKinds.text]: null,
}

export const embed: Printer<CanvasHtmlNode>['embed'] = (path, options) => {
  return (textToDoc) => {
    const node = path.node as CanvasHtmlNode
    switch (node.type) {
      case NodeTypes.RawMarkup: {
        const parser = ParserMap[node.kind]
        if (parser && node.value.trim() !== '') {
          return textToDoc(node.value, {
            ...options,
            singleQuote: (options as CanvasParserOptions).embeddedSingleQuote,
            parser,
            __embeddedInHtml: true,
          }).then((document) => {
            const body = doc.utils.stripTrailingHardline(document)
            if (shouldIndentBody(node, options as any)) {
              return [indent([hardline, body]), hardline]
            } else {
              return [dedentToRoot([hardline, body]), hardline]
            }
          }) as Promise<Doc>
        }
      }
      default:
        return undefined
    }
  }
}

function shouldIndentBody(node: RawMarkup, options: {}): boolean {
  const parentNode = node.parentNode
  const shouldNotIndentBody = parentNode && parentNode.type === NodeTypes.CanvasRawTag
  return !shouldNotIndentBody
}
