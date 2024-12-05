import { doc, Doc } from 'prettier'

import { NodeTypes } from '@/parser'
import { AstPath, CanvasParserOptions, CanvasPrinter, CanvasPrinterArgs, HtmlNode } from '@/types'
import { forceBreakContent, hasNoChildren, shouldPreserveContent } from '../utils'
import { printClosingTag, printClosingTagSuffix, printOpeningTag } from './tag'
import { printChildren } from './children'

const {
  builders: { breakParent, group, indent, hardline, line, softline },
} = doc

export function printElement(
  path: AstPath<HtmlNode>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
) {
  const node = path.node
  const attrGroupId = Symbol('element-attr-group-id')
  const elementGroupId = Symbol('element-group-id')

  if (node.type === NodeTypes.HtmlRawNode) {
    console.log('raw node')
    return []
  }

  if (hasNoChildren(node)) {
    return [
      group(printOpeningTag(path, options, print, attrGroupId), {
        id: attrGroupId,
      }),
      ...printClosingTag(node, options),
      printClosingTagSuffix(node, options),
    ]
  }

  if (shouldPreserveContent(node)) {
    console.log('shouldPreserveContent')
  }

  const printTag = (doc: Doc) =>
    group(
      [
        group(printOpeningTag(path, options, print, attrGroupId), {
          id: attrGroupId,
        }),
        doc,
        printClosingTag(node, options),
      ],
      { id: elementGroupId }
    )

  const printLineBeforeChildren = () => {
    if (node.firstChild!.hasLeadingWhitespace && node.firstChild!.isLeadingWhitespaceSensitive) {
      return line
    }

    return softline
  }

  const printLineAfterChildren = () => {
    // does not have the closing tag
    if (node.blockEndPosition.start === node.blockEndPosition.end) {
      return ''
    }

    return softline
  }

  if (node.children.length === 0) {
    return printTag(
      node.hasDanglingWhitespace &&
        node.isDanglingWhitespaceSensitive &&
        node.blockEndPosition.end !== node.blockEndPosition.start
        ? line
        : ''
    )
  }

  return printTag([
    forceBreakContent(node) ? breakParent : '',
    indent([
      printLineBeforeChildren(),
      printChildren(path as AstPath<typeof node>, options, print, {
        leadingSpaceGroupId: elementGroupId,
        trailingSpaceGroupId: elementGroupId,
      }),
    ]),
    printLineAfterChildren(),
  ])
}
