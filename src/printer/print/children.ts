import { doc } from 'prettier'

import {
  AstPath,
  CanvasAstPath,
  CanvasHtmlNode,
  CanvasParserOptions,
  CanvasPrinter,
  CanvasPrinterArgs,
} from '@/types'

import {
  FORCE_FLAT_GROUP_ID,
  forceBreakChildren,
  forceNextEmptyLine,
  hasNoChildren,
  hasNoCloseMarker,
  hasPrettierIgnore,
  isEmpty,
  isTextLikeNode,
  preferHardlineAsLeadingSpaces,
} from '../utils'
import {
  needsToBorrowNextOpeningTagStartMarker,
  needsToBorrowParentClosingTagStartMarker,
  needsToBorrowPrevClosingTagEndMarker,
} from './tag'
import { NodeTypes } from '@/parser'

const {
  builders: { group, ifBreak, line, softline, hardline },
} = doc

function printChild(
  childPath: CanvasAstPath,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
) {
  const child = childPath.node

  if (child) {
    // hasPrettierIgnore(child)
  }

  return print(childPath, args)
}

function printBetweenLine(
  prevNode: CanvasHtmlNode | undefined,
  nextNode: CanvasHtmlNode | undefined
) {
  if (!prevNode || !nextNode) return ''

  const spaceBetweenLinesIsHandledSomewhereElse =
    (needsToBorrowNextOpeningTagStartMarker(prevNode) &&
      (hasPrettierIgnore(nextNode) ||
        nextNode.firstChild ||
        hasNoChildren(nextNode) ||
        (nextNode.type === NodeTypes.HtmlElement && nextNode.attributes.length > 0))) ||
    (prevNode.type === NodeTypes.HtmlElement &&
      hasNoCloseMarker(prevNode) &&
      needsToBorrowPrevClosingTagEndMarker(nextNode))

  if (spaceBetweenLinesIsHandledSomewhereElse) {
    return ''
  }

  const shouldUseHardline =
    !nextNode.isLeadingWhitespaceSensitive ||
    preferHardlineAsLeadingSpaces(nextNode) ||
    (needsToBorrowPrevClosingTagEndMarker(nextNode) &&
      prevNode.lastChild &&
      needsToBorrowParentClosingTagStartMarker(prevNode.lastChild) &&
      prevNode.lastChild.lastChild &&
      needsToBorrowParentClosingTagStartMarker(prevNode.lastChild.lastChild))

  if (shouldUseHardline) {
    return hardline
  }

  return nextNode.hasLeadingWhitespace ? line : softline
}

export type HasChildren = Extract<CanvasHtmlNode, { children?: CanvasHtmlNode[] }>

type Whitespace = doc.builders.Line | doc.builders.Softline | doc.builders.IfBreak

interface WhitespaceBetweenNode {
  /**
   * @doc Leading, doesn't break content
   */
  leadingHardlines: (typeof hardline)[]

  /**
   * @doc Leading, breaks first if content doesn't fit.
   */
  leadingWhitespace: Whitespace[]

  /**
   * @doc Leading, breaks first and trailing whitespace if content doesn't fit.
   */
  leadingDependentWhitespace: doc.builders.Softline[]

  /**
   * @doc Trailing, breaks when content breaks.
   */
  trailingWhitespace: Whitespace[]

  /**
   * @doc Trailing, doesn't break content
   */
  trailingHardlines: (typeof hardline)[]
}

export function printChildren(
  path: AstPath<HasChildren>,
  options: CanvasParserOptions,
  print: CanvasPrinter,
  args: CanvasPrinterArgs
) {
  const node = path.node

  if (!node.children) {
    throw new Error('attempting to use printChildren on something without children')
  }

  if (forceBreakChildren(node)) {
    console.log('force break children')
  }

  const leadingSpaceGroupIds = node.children.map((_, i) => Symbol(`leading-${i}`))
  const trailingSpaceGroupIds = node.children.map((_, i) => Symbol(`trailing-${i}`))

  const whitespaceBetweenNode = path.map(
    (childPath: AstPath<CanvasHtmlNode>, childIndex: number): WhitespaceBetweenNode => {
      const childNode = childPath.node

      const leadingHardlines: (typeof hardline)[] = []
      const leadingWhitespace: Whitespace[] = []
      const leadingDependentWhitespace: doc.builders.Softline[] = []
      const trailingWhitespace: Whitespace[] = []
      const trailingHardlines: (typeof hardline)[] = []

      const prevBetweenLine = printBetweenLine(childNode.prev, childNode)
      const nextBetweenLine = printBetweenLine(childNode, childNode.next)

      if (isTextLikeNode(childNode)) {
        return {
          leadingHardlines,
          leadingWhitespace,
          leadingDependentWhitespace,
          trailingWhitespace,
          trailingHardlines,
        }
      }

      if (prevBetweenLine) {
        if (forceNextEmptyLine(childNode.prev)) {
          leadingHardlines.push(hardline, hardline)
        } else if (prevBetweenLine === hardline) {
          leadingHardlines.push(hardline)
        } else {
          if (isTextLikeNode(childNode.prev)) {
            console.log('text line node')
          } else {
            leadingWhitespace.push(
              ifBreak('', softline, {
                groupId: trailingSpaceGroupIds[childIndex - 1],
              })
            )
          }
        }
      }

      if (nextBetweenLine) {
        if (forceNextEmptyLine(childNode)) {
          if (isTextLikeNode(childNode.next)) {
            trailingHardlines.push(hardline, hardline)
          }
        } else if (nextBetweenLine === hardline) {
          if (isTextLikeNode(childNode.next)) {
            trailingHardlines.push(hardline)
          }
          // there's a hole here, it's intentional.
        } else {
          // We know it's not a typeof hardline here because we do the
          // check on the previous condition.
          trailingWhitespace.push(nextBetweenLine as doc.builders.Line)
        }
      }

      return {
        leadingHardlines,
        leadingWhitespace,
        leadingDependentWhitespace,
        trailingWhitespace,
        trailingHardlines,
      } as WhitespaceBetweenNode
    },
    'children'
  )

  return path.map((childPath, childIndex) => {
    const {
      leadingHardlines,
      leadingWhitespace,
      leadingDependentWhitespace,
      trailingWhitespace,
      trailingHardlines,
    } = whitespaceBetweenNode[childIndex]

    return [
      ...leadingHardlines, // independent
      group(
        [
          ...leadingWhitespace, // breaks first
          group(
            [
              ...leadingDependentWhitespace, // breaks with trailing
              printChild(childPath, options, print, {
                ...args,
                leadingSpaceGroupId: leadingSpaceGroupId(whitespaceBetweenNode, childIndex),
                trailingSpaceGroupId: trailingSpaceGroupId(whitespaceBetweenNode, childIndex),
              }),
              ...trailingWhitespace, // breaks second, if content breaks
            ],
            { id: trailingSpaceGroupIds[childIndex] }
          ),
        ],
        {
          id: trailingSpaceGroupIds[childIndex],
        }
      ),
      ...trailingHardlines, // independent
    ]
  }, 'children')

  function leadingSpaceGroupId(
    whitespaceBetweenNode: WhitespaceBetweenNode[],
    index: number
  ): Symbol[] | Symbol | undefined {
    if (index === 0) {
      return args.leadingSpaceGroupId
    }

    const prev = whitespaceBetweenNode[index - 1]
    const curr = whitespaceBetweenNode[index]
    const groupIds = []

    return groupIds
  }

  function trailingSpaceGroupId(whitespaceBetweenNode: WhitespaceBetweenNode[], index: number) {
    if (index === whitespaceBetweenNode.length - 1) {
      return args.trailingSpaceGroupId
    }

    const groupIds = []

    if (isEmpty(groupIds)) {
      groupIds.push(FORCE_FLAT_GROUP_ID)
    }

    return groupIds
  }
}
