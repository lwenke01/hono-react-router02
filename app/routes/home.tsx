import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Collections' },
    { name: 'description', content: 'Top collections' },
  ]
}

export async function clientLoader() {
  const res = await fetch('/api/collections')
  const collections = res.ok ? await res.json() : []
  return { collections }
}

export function HydrateFallback() {
  return <div className="p-8">Loading...</div>
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [series, setSeries] = useState<string | null>(null)

  const cols = Array.isArray(collections) ? collections : []

  const normalized = useMemo(() => {
    return cols.map((c: any) => {
      const designs = Array.isArray(c.designs) ? c.designs : []

      let thumbnail: string | null = null
      if (Array.isArray(c.image_urls) && c.image_urls.length > 0) {
        thumbnail = c.image_urls[0]
      } else if (typeof c.image_urls === 'string') {
        try {
          const parsed = JSON.parse(c.image_urls)
          if (Array.isArray(parsed) && parsed.length > 0) thumbnail = parsed[0]
        } catch {}
      }

      return {
        ...c,
        _thumbnail: thumbnail,
        _designs: designs,
      }
    })
  }, [cols])

  const seasons = Array.from(new Set(normalized.map((c: any) => c.season).filter(Boolean)))
  const seriesList = Array.from(new Set(normalized.map((c: any) => c.series).filter(Boolean)))

  const filtered = normalized
    .filter((c: any) => {
      if (season && c.season !== season) return false
      if (series && c.series !== series) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a: any, b: any) => {
      const yearA = Number(a.release_year ?? 0)
      const yearB = Number(b.release_year ?? 0)
      return yearB - yearA
    })

  const groupedByYear = useMemo(() => {
    return filtered.reduce((acc: Record<string, any[]>, col: any) => {
      const year = String(col.release_year ?? 'Unknown')
      if (!acc[year]) acc[year] = []
      acc[year].push(col)
      return acc
    }, {})
  }, [filtered])

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <main className="flex min-h-screen items-start justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="col-span-1">
          <div className="sticky top-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by season</label>
              <select
                value={season ?? ''}
                onChange={(e) => setSeason(e.target.value || null)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All seasons</option>
                {seasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by series</label>
              <select
                value={series ?? ''}
                onChange={(e) => setSeries(e.target.value || null)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All series</option>
                {seriesList.map((s: any) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="col-span-3">
          <h1 className="text-3xl font-bold mb-6">Top Collections</h1>

          <div className="space-y-12">
            {years.length === 0 ? (
              <div className="text-gray-500">No collections found</div>
            ) : (
              years.map((year) => (
                <div key={year} className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">{year}</h2>

                  <div className="space-y-6">
                    {groupedByYear[year].map((col: any) => (
                      <article key={col.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <div className="p-4 border-b">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold">{col.name}</h3>
                              <p className="text-sm text-gray-600">
                                Season: {col.season || 'N/A'} | Series: {col.series || 'N/A'}
                              </p>
                            </div>

                            <Link
                              to={`/collections/${col.id}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View collection
                            </Link>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4">
                          <div className="md:col-span-2">
                            <div className="h-56 w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                              {col._thumbnail ? (
                                <img
                                  src={col._thumbnail}
                                  alt={col.name}
                                  className="object-cover h-full w-full"
                                />
                              ) : (
                                <div className="text-sm text-gray-500">No image</div>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-3">
                            <p className="text-sm text-gray-700 mb-3">
                              {col.description || 'No description'}
                            </p>

                            <h4 className="font-medium mb-2">Designs</h4>
                            {Array.isArray(col._designs) && col._designs.length > 0 ? (
                              <div className="space-y-3">
                                {col._designs.map((d: any) => {
                                  let thumb: string | null = null
                                  try {
                                    const imgs =
                                      typeof d.image_urls === 'string'
                                        ? JSON.parse(d.image_urls)
                                        : d.image_urls
                                    if (Array.isArray(imgs) && imgs.length > 0) {
                                      thumb = imgs[0]
                                    }
                                  } catch {}

                                  return (
                                    <div key={d.id} className="flex gap-3 items-start border rounded p-3">
                                      <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                                        {thumb ? (
                                          <img
                                            src={thumb}
                                            alt={d.name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs text-gray-500">No img</span>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                          <div className="font-medium">{d.name}</div>
                                          <div className="text-sm text-gray-600">
                                            {d.price ? `£${Number(d.price).toFixed(2)}` : ''}
                                          </div>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {d.description || ''}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">No designs</div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}