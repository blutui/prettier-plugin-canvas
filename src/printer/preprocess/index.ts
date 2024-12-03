import { augmentWithCssProperties } from './augment-with-css-properties'
import { augmentWithParent } from './augment-with-parent'
import { augmentWithSiblings } from './augment-with-siblings'
import { augmentWithWhitespaceHelpers } from './augment-with-whitespace-helpers'

export const AUGMENTATION_PIPELINE = [
  augmentWithParent,
  augmentWithSiblings,
  augmentWithCssProperties,
  augmentWithWhitespaceHelpers,
]
