import type { SupportOption } from 'prettier'

interface PluginOptions {
  canvasSingleQuote: boolean
}

// https://prettier.io/docs/en/plugins.html#options
export const options: Record<keyof PluginOptions, SupportOption> = {
  canvasSingleQuote: {
    category: 'Canvas',
    type: 'boolean',
    default: true,
    description: 'Use single quotes instead of double quotes in Canvas tags.',
  },
}
