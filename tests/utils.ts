import * as prettier from 'prettier'

import plugin from '@/plugin'

export async function format(str: string, options: prettier.Options = {}) {
  let result = await prettier.format(str, {
    semi: false,
    singleQuote: true,
    ...options,
    parser: 'canvas',
    plugins: [...(options.plugins ?? []), plugin],
  })

  return result.trim()
}
