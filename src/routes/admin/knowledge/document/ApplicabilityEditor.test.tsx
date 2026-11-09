import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ApplicabilityEditor,
  initialRegions,
  initialScope,
} from './ApplicabilityEditor'
import type { RegionRow, VersionDetail } from '@/services/ai'
import { adminApi } from '@/lib/api'
import { renderWithQuery } from '@/test/utils'

vi.mock('@/lib/api', () => ({
  adminApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  api: { get: vi.fn(), post: vi.fn() },
}))

const regions = [
  { code: 'NCR', name: 'National Capital Region' },
  { code: 'X', name: 'Northern Mindanao' },
] as never

// The Tangub City memo from the screenshot: letterhead Region X, applies to the division.
const tangubRows: Array<RegionRow> = [
  {
    relation: 'issuing_origin',
    level: 'region',
    region_code: 'X',
    detected_label: 'Region X',
  },
  {
    relation: 'issuing_origin',
    level: 'division',
    region_code: 'X',
    division_code: 'X-TANGUB-CITY',
    detected_label: 'Schools Division of Tangub City',
  },
  {
    relation: 'applies_to',
    level: 'division',
    region_code: 'X',
    division_code: 'X-TANGUB-CITY',
    detected_label: 'Schools Division of Tangub City',
  },
  { relation: 'mentioned', level: 'region', region_code: 'CAR' },
]

function version(scope: string, rows: Array<RegionRow>) {
  return {
    applicability: { scope, verified: false, rows },
  } as unknown as VersionDetail
}

describe('applicability editor', () => {
  beforeEach(() => {
    vi.mocked(adminApi.put).mockReset()
    vi.mocked(adminApi.put).mockResolvedValue({ data: { data: {} } })
  })

  it('maps stored scopes and pre-ticks the detected region', () => {
    expect(initialScope('division', true)).toBe('division')
    expect(initialScope('division', false)).toBe('regional')
    expect(initialScope('multi_regional', false)).toBe('regional')
    expect(initialRegions(tangubRows)).toEqual(['X'])
    // Nothing applies yet: fall back to the letterhead region, never to places only mentioned.
    expect(initialRegions([tangubRows[0]!, tangubRows[3]!])).toEqual(['X'])
    expect(initialRegions([tangubRows[3]!])).toEqual([])
  })

  it('opens a division document on the division, with Region X ticked when switching to Regional', async () => {
    renderWithQuery(
      <ApplicabilityEditor
        documentId="doc-1"
        version={version('division', tangubRows)}
        regions={regions}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    )

    const scope = screen.getByLabelText('Scope')
    expect(scope).toHaveValue('division')
    expect(
      screen.getByText(/Applies only to Schools Division of Tangub City/),
    ).toBeInTheDocument()

    await userEvent.selectOptions(scope, 'regional')
    expect(screen.getByLabelText('Northern Mindanao (X)')).toBeChecked()
    expect(
      screen.getByLabelText('National Capital Region (NCR)'),
    ).not.toBeChecked()
  })

  it('keeps the division rows when saved as a division', async () => {
    const onSaved = vi.fn()
    renderWithQuery(
      <ApplicabilityEditor
        documentId="doc-1"
        version={version('division', tangubRows)}
        regions={regions}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    const body = vi.mocked(adminApi.put).mock.calls[0]?.[1] as {
      scope: string
      rows: Array<RegionRow>
    }
    expect(body.scope).toBe('division')
    expect(body.rows).toEqual([
      expect.objectContaining({
        relation: 'applies_to',
        level: 'division',
        region_code: 'X',
        division_code: 'X-TANGUB-CITY',
      }),
    ])
  })
})
