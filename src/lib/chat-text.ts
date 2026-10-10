export type ChatTextPart =
  | { type: 'text' | 'strong'; text: string }
  | { type: 'link'; text: string; href: string }

// Deliberately limited to links and emphasis; React renders all other content as text.
export function chatTextParts(
  text: string,
  allowedLinks: ReadonlySet<string>,
): ChatTextPart[] {
  const result: ChatTextPart[] = []
  const pattern = /\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*/g
  let offset = 0
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset)
      result.push({ type: 'text', text: text.slice(offset, match.index) })
    if (match[1] && match[2])
      result.push(
        allowedLinks.has(match[2])
          ? { type: 'link', text: match[1], href: match[2] }
          : { type: 'text', text: match[1] },
      )
    else result.push({ type: 'strong', text: match[3]! })
    offset = match.index + match[0].length
  }
  if (offset < text.length)
    result.push({ type: 'text', text: text.slice(offset) })
  return result
}
