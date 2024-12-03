import * as AST from '@/parser'
import { CanvasParserOptions, DocumentNode } from '@/types'
import { AUGMENTATION_PIPELINE } from './preprocess'

export function preprocess(ast: AST.DocumentNode, options: CanvasParserOptions): DocumentNode {
  const augmentationPipeline = AUGMENTATION_PIPELINE.map((fn) => fn.bind(null, options))

  for (const augmentation of augmentationPipeline) {
    AST.walk(ast, augmentation as any)
  }

  return ast as DocumentNode
}
