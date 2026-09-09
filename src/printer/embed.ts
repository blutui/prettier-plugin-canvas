import { doc, Doc, Printer } from 'prettier'

import type { CanvasHtmlNode, CanvasParserOptions, RawMarkup } from '@/types'
import { NodeTypes, RawMarkupKinds } from '@/parser'

const {
  builders: { dedentToRoot, indent, hardline },
} = doc

export const ParserMap: { [key in RawMarkupKinds]: string | null } = {
  [RawMarkupKinds.canvas]: 'canvas',
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

  if (!parentNode || parentNode.type !== NodeTypes.CanvasRawTag) {
    return true
  }

  // A raw tag sitting at the top of the file keeps its body flush at column 0.
  // That's how Canopy block templates are written, and it avoids indenting a
  // whole section body for no reason. Once the tag is nested inside markup the
  // body has to follow it, otherwise it ends up detached from its delimiters.
  const grandParentNode = parentNode.parentNode

  return !!grandParentNode && grandParentNode.type !== NodeTypes.Document
}
