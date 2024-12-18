declare module 'html-styles' {
  interface HtmlStyle {
    selectorText: string
    type: string
    style: Record<string, string>
  }

  const styles: HtmlStyle[]

  export default styles
}
