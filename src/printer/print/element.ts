import { doc, Doc } from 'prettier'

import { NodeTypes } from '@/parser'
import {
  AstPath,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
  HtmlNode,
  HtmlRawNode,
} from '@/types'
import { forceBreakContent, hasNoChildren, shouldPreserveContent } from '../utils'
import {
  needsToBorrowLastChildClosingTagEndMarker,
  needsToBorrowPrevClosingTagEndMarker,
  printClosingTag,
  printClosingTagSuffix,
  printOpeningTag,
} from './tag'
import { printChildren } from './children'

const {
  builders: { breakParent, dedentToRoot, group, indent, hardline, line, softline },
} = doc

export function printRawElement(
  path: AstPath<HtmlRawNode>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  _args: CanvasPrinterArgs
) {
  console.log('print raw element')
  return group([])
}

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
    return printRawElement(path as AstPath<HtmlRawNode>, options, print, args)
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

    if (
      node.firstChild!.type === NodeTypes.TextNode &&
      node.isWhitespaceSensitive &&
      node.isIndentationSensitive
    ) {
      return dedentToRoot(softline)
    }

    return softline
  }

  const printLineAfterChildren = () => {
    // does not have the closing tag
    if (node.blockEndPosition.start === node.blockEndPosition.end) {
      return ''
    }

    const needsToBorrow = node.next
      ? needsToBorrowPrevClosingTagEndMarker(node.next)
      : needsToBorrowLastChildClosingTagEndMarker(node.parentNode!)
    if (needsToBorrow) {
      if (node.lastChild!.hasTrailingWhitespace && node.lastChild!.isTrailingWhitespaceSensitive) {
        return ' '
      }
      return ''
    }

    if (node.lastChild!.hasTrailingWhitespace && node.lastChild!.isTrailingWhitespaceSensitive) {
      return line
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
