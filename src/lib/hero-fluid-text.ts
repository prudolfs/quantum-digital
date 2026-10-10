// The DOM remains the readable source. This texture is a visual copy of its
// current layout, refreshed when the fonts or text bounds change.
export function paintHeroText(
  textureCanvas: HTMLCanvasElement,
  container: HTMLElement,
  elements: HTMLElement[],
  pixelRatio: number,
  width: number,
  height: number,
) {
  textureCanvas.width = Math.ceil(width * pixelRatio)
  textureCanvas.height = Math.ceil(height * pixelRatio)
  const context = textureCanvas.getContext('2d')
  if (!context) return
  context.scale(pixelRatio, pixelRatio)
  context.clearRect(0, 0, width, height)
  context.textBaseline = 'top'
  context.fontKerning = 'normal'
  const origin = container.getBoundingClientRect()
  const range = document.createRange()

  for (const element of elements) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      const content = node.textContent ?? ''
      const parent = node.parentElement
      if (!parent || parent.closest('.sr-only')) continue
      const style = getComputedStyle(parent)
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      context.fillStyle = style.color
      for (let index = 0; index < content.length; index++) {
        if (/\s/.test(content[index] ?? '')) continue
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        const rect = range.getBoundingClientRect()
        if (rect.width > 0) {
          context.fillText(
            content[index] ?? '',
            rect.left - origin.left,
            rect.top - origin.top + parseFloat(style.fontSize) * 0.14,
          )
        }
      }
    }
  }
}
