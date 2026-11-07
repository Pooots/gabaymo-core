/**
 * Laravel paginator shape used by every `{data, meta}` list in gabaymo-ws
 * (and the AI lists it forwards): `?page=&per_page=&search=`.
 */
export type PageMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type Page<T> = { data: Array<T>; meta: PageMeta }

export type PageParams = { page?: number; per_page?: number; search?: string }

/** Query params without empty values (so `?search=` is never sent). */
export function pageQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    out[key] = value === true ? 1 : value
  }
  return out
}

/** A safe meta for lists that may come back without one. */
export function metaOf(meta: Partial<PageMeta> | undefined, rows: number): PageMeta {
  return {
    current_page: meta?.current_page ?? 1,
    last_page: Math.max(1, meta?.last_page ?? 1),
    per_page: meta?.per_page ?? rows,
    total: meta?.total ?? rows,
  }
}
