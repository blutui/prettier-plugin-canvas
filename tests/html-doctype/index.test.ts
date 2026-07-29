import { describe, expect, test } from 'vitest'

import { format, heredoc } from 'tests/utils'

describe('Html Doctype', () => {
  test('it should not drop the doctype', async () => {
    const result = await format(
      heredoc`
        <!DOCTYPE html>
        <html lang="en">
          <body>hi</body>
        </html>
      `
    )

    expect(result).toBe(
      heredoc`
        <!DOCTYPE html>
        <html lang="en">
          <body>
            hi
          </body>
        </html>
      `
    )
  })

  test('it should preserve the casing written in the source', async () => {
    const result = await format(
      heredoc`
        <!doctype html>
        <html></html>
      `
    )

    expect(result).toBe(
      heredoc`
        <!doctype html>
        <html></html>
      `
    )
  })

  test('it should preserve a legacy doctype string', async () => {
    const source = heredoc`
      <!DOCTYPE html SYSTEM "about:legacy-compat">
      <html></html>
    `
    const result = await format(source)

    expect(result).toBe(source)
    expect(await format(result)).toBe(result)
  })
})
