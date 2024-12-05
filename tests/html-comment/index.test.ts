import { describe, expect, test } from 'vitest'
import { format, heredoc } from '../utils'

describe('comments', () => {
  test('it should handle the css display of the next node', async () => {
    const result = await format(
      heredoc`
        <!-- display: block -->
        <span>{{ hi }}</span>
      `,
      { printWidth: 1 }
    )

    expect(result).toBe(
      heredoc`
        <!-- display: block -->
        <span>
          {{ hi }}
        </span>
      `
    )
  })

  test('it should preserve MSO conditional comments', async () => {
    const result = await format(
      heredoc`
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="570" align="center">
        <![endif]-->
      `
    )

    expect(result).toBe(
      heredoc`
        <!--[if mso]>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="570" align="center">
        <![endif]-->
      `
    )
  })
})
