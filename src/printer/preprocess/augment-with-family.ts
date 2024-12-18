import { Augment, CanvasHtmlNode, WithFamily } from '@/types'

export const augmentWithFamily: Augment<{}> = (_options, node) => {
  const children: CanvasHtmlNode[] = (node as any).children || []
  const augmentations: WithFamily = {
    firstChild: children[0],
    lastChild: children[children.length - 1],
  }

  Object.assign(node, augmentations)
}
