import { describe, expect, it } from 'vitest'

import { niceMax, smoothPath } from './chartMath'

describe('niceMax', () => {
  it('rounds small values up to an even number, at least 2', () => {
    expect(niceMax(0)).toBe(2)
    expect(niceMax(3)).toBe(4)
    expect(niceMax(10)).toBe(10)
  })

  it('rounds larger values to 2/4/6/10 × a power of ten', () => {
    expect(niceMax(11)).toBe(20)
    expect(niceMax(35)).toBe(40)
    expect(niceMax(512)).toBe(600)
    expect(niceMax(7_000)).toBe(10_000)
  })
})

describe('smoothPath', () => {
  it('handles empty and short inputs with straight segments', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([{ x: 0, y: 5 }])).toBe('M 0 5')
    expect(smoothPath([{ x: 0, y: 5 }, { x: 10, y: 0 }])).toBe('M 0 5 L 10 0')
  })

  it('draws one cubic segment per gap and keeps flat runs flat', () => {
    const d = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ])
    expect(d.startsWith('M 0 10')).toBe(true)
    expect(d.match(/ C /g)).toHaveLength(2)
    // The flat first segment keeps both control points on y = 10.
    const firstCurve = d.split(' C ')[1] ?? ''
    const ys = firstCurve.split(', ').map((pair) => Number(pair.split(' ')[1]))
    expect(ys).toEqual([10, 10, 10])
  })
})
