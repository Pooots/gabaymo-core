import { Fragment } from 'react'

/**
 * Renders model-written answer text safely (no HTML): **bold** becomes bold,
 * other Markdown symbols (headings, stray asterisks, "* " bullets) are
 * removed, and line breaks are kept. With markers="numbers", citation markers
 * such as [S2] or [S2, pages 10-11] are shown as [2] to match the source chips.
 */
export function RichText({ text, markers = 'keep', className = '' }: { text: string; markers?: 'keep' | 'numbers'; className?: string }) {
  const lines = clean(text, markers).split('\n')
  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {bold(line)}
          {i < lines.length - 1 ? '\n' : null}
        </Fragment>
      ))}
    </p>
  )
}

function clean(text: string, markers: 'keep' | 'numbers') {
  let out = text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^\s*[*-]\s+/gm, '• ') // "* item" / "- item" bullets
    .replace(/__([^_\n]+)__/g, '**$1**') // __bold__ -> **bold**
  if (markers === 'numbers') {
    out = out.replace(/\[S(\d+)[^\]]*\]/g, '[$1]')
  }
  return out
}

function bold(line: string) {
  const parts = line.split(/(\*\*[^*\n]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      // Any leftover single asterisks are formatting noise.
      <Fragment key={i}>{part.replace(/\*+/g, '')}</Fragment>
    ),
  )
}
