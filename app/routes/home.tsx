import React, { useEffect, useMemo, useState } from 'react'
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

function parseImages(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
  }
  return []
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [series, setSeries] = useState<string | null>(null)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const cols = Array.isArray(collections) ? collections : []

  const normalized = useMemo(() => {
    return cols.map((c: any) => {
      const designs = Array.isArray(c.designs) ? c.designs : []
      const images = parseImages(c.image_urls)
      return {
        ...c,
        _thumbnail: images[0] || null,
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
    .sort((a: any, b: any) => Number(b.release_year ?? 0) - Number(a.release_year ?? 0))

  const groupedByYear = useMemo(() => {
    return filtered.reduce((acc: Record<string, any[]>, col: any) => {
      const year = String(col.release_year ?? 'Unknown')
      if (!acc[year]) acc[year] = []
      acc[year].push(col)
      return acc
    }, {})
  }, [filtered])

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a))

  const openLightbox = (images: string[], index = 0) => {
    if (!images.length) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const nextImage = () => {
    setLightboxIndex((current) =>
      lightboxImages.length ? (current + 1) % lightboxImages.length : current,
    )
  }

  const prevImage = () => {
    setLightboxIndex((current) =>
      lightboxImages.length
        ? (current - 1 + lightboxImages.length) % lightboxImages.length
        : current,
    )
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, lightboxImages.length])

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
                  <option key={s} value={s}>
                    {s}
                  </option>
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
                  <option key={s} value={s}>
                    {s}
                  </option>
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
                                  className="object-cover h-full w-full cursor-pointer"
                                  onClick={() => openLightbox([col._thumbnail], 0)}
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
                                  const images = parseImages(d.image_urls)
                                  const thumb = images[0] || null

                                  return (
                                    <div key={d.id} className="flex gap-3 items-start border rounded p-3">
                                      <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                                        {thumb ? (
                                          <img
                                            src={thumb}
                                            alt={d.name}
                                            className="h-full w-full object-cover cursor-pointer"
                                            onClick={() => openLightbox(images, 0)}
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

                                        {images.length > 0 && (
                                          <div className="mt-2 flex gap-2 flex-wrap">
                                            {images.slice(0, 4).map((src, idx) => (
                                              <img
                                                key={idx}
                                                src={src}
                                                alt={`${d.name} ${idx + 1}`}
                                                className="h-14 w-14 object-cover rounded cursor-pointer border"
                                                onClick={() => openLightbox(images, idx)}
                                              />
                                            ))}
                                          </div>
                                        )}

                                        <div className="text-sm text-gray-600 mt-2">
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

      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="absolute left-4 md:left-8 text-white text-4xl bg-black/40 rounded-full w-12 h-12"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
            aria-label="Previous image"
          >
            ‹
          </button>

          <img
            src={lightboxImages[lightboxIndex]}
            alt="Expanded design"
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            className="absolute right-4 md:right-8 text-white text-4xl bg-black/40 rounded-full w-12 h-12"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
            aria-label="Next image"
          >
            ›
          </button>

          <button
            type="button"
            className="absolute top-4 right-4 text-white text-2xl bg-black/40 rounded-full w-10 h-10"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
            aria-label="Close lightbox"
          >
            ×
          </button>
        </div>
      )}
    </main>
  )
}