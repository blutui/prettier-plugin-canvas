import {
  Augment,
  AugmentedNode,
  WithCssProperties,
  WithFamily,
  WithParent,
  WithSiblings,
  WithWhitespaceHelpers,
} from '@/types'

type RequiredAugmentations = WithParent & WithSiblings & WithFamily & WithCssProperties
type AugmentedAstNode = AugmentedNode<RequiredAugmentations>

export const augmentWithWhitespaceHelpers: Augment<RequiredAugmentations> = (_options, node) => {
  if (node.cssDisplay === 'should not be relevant') {
    return
  }

  const augmentations: WithWhitespaceHelpers = {
    isLeadingWhitespaceSensitive:
      isLeadingWhitespaceSensitiveNode(node) &&
      (!node.prev || isTrailingWhitespaceSensitiveNode(node.prev)),
  }

  Object.assign(node, augmentations)
}

function isLeadingWhitespaceSensitiveNode(node: AugmentedAstNode | undefined): boolean {
  if (!node) {
    return false
  }

  return true
}

function isTrailingWhitespaceSensitiveNode(node: AugmentedAstNode): boolean {
  if (!node) {
    return false
  }

  return true
}
