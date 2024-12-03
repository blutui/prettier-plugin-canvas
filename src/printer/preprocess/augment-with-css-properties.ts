import { Augment, WithCssProperties, WithSiblings } from '@/types'

export const augmentWithCssProperties: Augment<WithSiblings> = (options, node) => {
  const augmentations: WithCssProperties = {
    cssDisplay: '',
    cssWhitespace: '',
  }

  Object.assign(node, augmentations)
}
