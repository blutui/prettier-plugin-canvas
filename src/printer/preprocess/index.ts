import { augmentWithCssProperties } from './augment-with-css-properties'
import { augmentWithParent } from './augment-with-parent'
import { augmentWithSiblings } from './augment-with-siblings'

export const AUGMENTATION_PIPELINE = [
  augmentWithParent,
  augmentWithSiblings,
  augmentWithCssProperties,
]
