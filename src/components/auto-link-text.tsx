const URL_RE = /https?:\/\/[^\s<>"')\]]+/g

export function AutoLinkText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(URL_RE)) {
    const i = match.index
    if (i > last) parts.push(text.slice(last, i))
    parts.push(
      <a
        key={i}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-accent hover:underline"
      >
        {match[0]}
      </a>
    )
    last = i + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}
