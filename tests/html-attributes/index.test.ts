import { describe, expect, test } from 'vitest'
import { format, heredoc } from '../utils'

describe('HTML Attributes', () => {
  test('it should use double quotes for all attributes, unless boolean attribute', async () => {
    const result = await format(
      heredoc`
        <div id=123 class='long string of classes' style="color: blue;" content="" disabled></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div
          id="123"
          class="long string of classes"
          style="color: blue;"
          content=""
          disabled
        ></div>
      `
    )
  })

  test('it should use single quotes for all attributes, unless boolean attribute when singleQuote is true', async () => {
    const result = await format(
      heredoc`
        <div id=123 class='long string of classes' style="color: blue;" content="" disabled></div>
      `,
      { singleQuote: true }
    )

    expect(result).toBe(
      heredoc`
        <div
          id='123'
          class='long string of classes'
          style='color: blue;'
          content=''
          disabled
        ></div>
      `
    )
  })

  test('it should break CanvasTags attribute nodes and consider the insides not whitespace sensitive', async () => {
    const result = await format(
      heredoc`
        <div src="https://content.instructables.com/ORIG/F23/YMO0/FPIUQOJF/F23YMO0FPIUQOJF.jpg"
          width="320" height="240" loading="lazy" {{ block.attributes }} {% if A %}disabled{% else %}checked{% endif %}></div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div
          src="https://content.instructables.com/ORIG/F23/YMO0/FPIUQOJF/F23YMO0FPIUQOJF.jpg"
          width="320"
          height="240"
          loading="lazy"
          {{ block.attributes }}
          {% if A %}
            disabled
          {% else %}
            checked
          {% endif %}
        ></div>
      `
    )
  })

  test('it should not try to format HTML attributes', async () => {
    const result = await format(
      heredoc`
        <img class="image {% if sticky %}image--sticky{% endif %} {% if wrapped %}image--wrapped{% endif %}" id="img--{{ entry.id }}" src="{{ entry.image }}" width="{{ entry.image_width }}" height="{{ entry.image_height }}" loading="lazy">
      `
    )

    expect(result).toBe(
      heredoc`
        <img
          class="image {% if sticky %}image--sticky{% endif %} {% if wrapped %}image--wrapped{% endif %}"
          id="img--{{ entry.id }}"
          src="{{ entry.image }}"
          width="{{ entry.image_width }}"
          height="{{ entry.image_height }}"
          loading="lazy"
        >
      `
    )
  })

  test('if there is only one attribute and self-closing, do not break when the line is long', async () => {
    const result = await format(
      heredoc`
        <img class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
      `
    )

    expect(result).toBe(
      heredoc`
        <img class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
      `
    )
  })

  test('if there is only one attribute, not self-closing and no children, break the attribute and close the tag on a different line', async () => {
    const result = await format(
      heredoc`
        <div class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div
          class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet"
        ></div>
      `
    )
  })

  test('if there is only one attribute and not self-closing, but with children, do not break the attribute and close the tag on a different line', async () => {
    const result = await format(
      heredoc`
        <div class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
        Hello
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
          Hello
        </div>
      `
    )
  })

  test('if there is only one attribute and not self-closing, but with children, do not break the attribute and close the tag on a different line', async () => {
    const result = await format(
      heredoc`
        <div class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
        Hello
        </div>
      `
    )

    expect(result).toBe(
      heredoc`
        <div class="Lorem ipsum dolor sit amet consectetur adipiscing elit Sed feugiat semper sem eu ultrices nisl interdum sit amet">
          Hello
        </div>
      `
    )
  })

  test('if there is only one attribute, not self-closing and with children, do not break the CanvasTag attribute and close the tag on a different line', async () => {
    const result = await format(
      heredoc`
        <div {% do 1 %}>
        Hello
        </div>
      `,
      { printWidth: 20 }
    )

    expect(result).toBe(
      heredoc`
        <div {% do 1 %}>
          Hello
        </div>
      `
    )
  })

  test('if there is only one attribute, not self-closing and with children, do not break the CanvasNode attribute and close the tag on a different line', async () => {
    const result = await format(
      heredoc`
        <div {{ attributes }}>
        Hello
        </div>
      `,
      { printWidth: 30 }
    )

    expect(result).toBe(
      heredoc`
        <div {{ attributes }}>
          Hello
        </div>
      `
    )
  })
})
