/** Rounds a chart's top value up to 2 / 4 / 6 / 10 × a power of ten (min 2). */
export function niceMax(value: number) {
  if (value <= 10) return Math.max(2, Math.ceil(value / 2) * 2)
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const nice = normalized <= 2 ? 2 : normalized <= 4 ? 4 : normalized <= 6 ? 6 : 10
  return nice * magnitude
}

/** Monotone cubic curve so the line never overshoots below zero. */
export function smoothPath(points: Array<{ x: number; y: number }>) {
  const first = points[0]
  if (!first) return ''
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }
  // Pairs of neighbouring points; every index below is in range by construction.
  const segments = points.slice(1).map((p1, i) => {
    const p0 = points[i] ?? p1
    const dx = p1.x - p0.x
    return { p0, p1, dx, slope: (p1.y - p0.y) / dx }
  })
  const slopeAt = (i: number) => segments[i]?.slope ?? 0
  const tangent = points.map((_, i) => {
    if (i === 0) return slopeAt(0)
    if (i === points.length - 1) return slopeAt(i - 1)
    const before = slopeAt(i - 1)
    const after = slopeAt(i)
    return before * after <= 0 ? 0 : (before + after) / 2
  })
  const tangentAt = (i: number) => tangent[i] ?? 0
  segments.forEach(({ slope }, i) => {
    if (slope === 0) {
      tangent[i] = 0
      tangent[i + 1] = 0
      return
    }
    const a = tangentAt(i) / slope
    const b = tangentAt(i + 1) / slope
    const h = a * a + b * b
    if (h > 9) {
      const t = 3 / Math.sqrt(h)
      tangent[i] = t * a * slope
      tangent[i + 1] = t * b * slope
    }
  })
  let d = `M ${first.x} ${first.y}`
  segments.forEach(({ p0, p1, dx }, i) => {
    const third = dx / 3
    d += ` C ${p0.x + third} ${p0.y + tangentAt(i) * third}, ${p1.x - third} ${p1.y - tangentAt(i + 1) * third}, ${p1.x} ${p1.y}`
  })
  return d
}
