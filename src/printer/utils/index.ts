import { Doc, doc } from 'prettier'

import { isBranchedTag } from '@/parser'
import type { CanvasBranch, CanvasHtmlNode } from '@/types'
import { isEmpty } from './array'

export * from './array'
export * from './string'
export * from './node'

const {
  builders: { ifBreak },
} = doc

export function isDeeplyNested(
  node: Extract<CanvasHtmlNode, { children?: CanvasHtmlNode[] }>
): boolean {
  if (!node.children) return false
  if (isBranchedTag(node)) {
    return !!node.children.find((child) => isDeeplyNested(child as CanvasBranch))
  }
  return !!node.children.find((child) => !isEmpty((child as any).children || []))
}

// Optionally converts a '' into '-' if any of the parent group breaks and source[loc] is non space.
export function getWhitespaceTrim(
  currWhitespaceTrim: string,
  needsWhitespaceStrippingOnBreak: boolean | undefined,
  groupIds?: symbol | symbol[]
): Doc {
  return ifBreakChain(
    needsWhitespaceStrippingOnBreak ? '-' : currWhitespaceTrim,
    currWhitespaceTrim,
    Array.isArray(groupIds) ? groupIds : [groupIds]
  )
}

// Threads ifBreak into multiple sources of breakage (paragraph or self, etc.)
export const FORCE_FLAT_GROUP_ID = Symbol('force-no-break')
export const FORCE_BREAK_GROUP_ID = Symbol('force-break')

export function ifBreakChain(
  breaksContent: Doc,
  flatContent: Doc,
  groupIds: (symbol | undefined)[]
) {
  if (groupIds.includes(FORCE_BREAK_GROUP_ID)) return breaksContent
  if (groupIds.includes(FORCE_FLAT_GROUP_ID)) return flatContent
  return groupIds.reduce(
    (currFlatContent, groupId) => ifBreak(breaksContent, currFlatContent, { groupId }),
    flatContent
  )
}
