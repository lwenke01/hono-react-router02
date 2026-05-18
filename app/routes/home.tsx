import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/home'
import { useInfiniteCollections } from './useInfiniteCollections'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Vendula London Handbag Library' },
    {
      name: 'description',
      content: 'An archives library of all seasons, designs, collections of Vendula London bags',
    },
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
  if (Array.isArray(value)) return Array.from(new Set(value.filter(Boolean)))
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return Array.from(new Set(parsed.filter(Boolean)))
    } catch {}
  }
  return []
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)))
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [series, setSeries] = useState<string | null>(null)
  const [shape, setShape] = useState<string | null>(null)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollections = useMemo(() => {
    return (Array.isArray(collections) ? collections : []).map((col: any) => {
      const designs = Array.isArray(col.designs) ? col.designs : []
      const collectionImages = parseImages(col.image_urls)
      const designImages = uniq(designs.flatMap((d: any) => parseImages(d.image_urls)))

      return {
        ...col,
        _designs: designs,
        _collectionImages: collectionImages,
        _thumbnail: collectionImages[0] || designImages[0] || null,
      }
    })
  }, [collections])

  const seasons = useMemo(
    () => Array.from(new Set(normalizedCollections.map((c: any) => c.season).filter(Boolean))),
    [normalizedCollections],
  )

  const seriesList = useMemo(
    () => Array.from(new Set(normalizedCollections.map((c: any) => c.series).filter(Boolean))),
    [normalizedCollections],
  )

  const shapeList = useMemo(() => {
    return Array.from(
      new Set(
        normalizedCollections.flatMap((c: any) =>
          (c._designs || [])
            .map((d: any) => String(d.shape_name || d.shape || '').trim())
            .filter(Boolean),
        ),
      ),
    ).sort()
  }, [normalizedCollections])

  const filteredCollections = useMemo(() => {
    const term = search.trim().toLowerCase()

    return normalizedCollections
      .map((c: any) => {
        const collectionMatches =
          !term ||
          [c.name, c.description, c.season, c.series, c.release_year]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)

        const designs = (c._designs || []).filter((d: any) => {
          const designShape = String(d.shape_name || d.shape || '').trim().toLowerCase()
          if (shape && designShape !== shape.toLowerCase()) return false
          if (!term) return true

          const haystack = [
            d.name,
            d.description,
            d.shape_name,
            d.shape,
            ...(Array.isArray(d.categories) ? d.categories : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return haystack.includes(term)
        })

        return { ...c, _filteredDesigns: designs, _collectionMatches: collectionMatches }
      })
      .filter((c: any) => {
        if (season && c.season !== season) return false
        if (series && c.series !== series) return false
        if (shape && c._filteredDesigns.length === 0) return false
        if (search && !c._collectionMatches && c._filteredDesigns.length === 0) return false
        return true
      })
      .sort((a: any, b: any) => Number(b.release_year ?? 0) - Number(a.release_year ?? 0))
  }, [normalizedCollections, search, season, series, shape])

  const { visibleItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteCollections(filteredCollections, 50)

  const groupedByYear = useMemo(() => {
    return visibleItems.reduce((acc: Record<string, any[]>, col: any) => {
      const year = String(col.release_year ?? 'Unknown')
      if (!acc[year]) acc[year] = []
      acc[year].push(col)
      return acc
    }, {})
  }, [visibleItems])

  const years = useMemo(
    () => Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a)),
    [groupedByYear],
  )

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
                placeholder="Search collections, designs, shapes"
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
                {seriesList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by shape</label>
              <select
                value={shape ?? ''}
                onChange={(e) => setShape(e.target.value || null)}
                className="w-full rounded border px-3 py-2"
              >
                <option value="">All shapes</option>
                {shapeList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <section className="col-span-3">
          <h1 className="text-3xl font-bold mb-6 text-danger">Top Collections</h1>

          <div className="space-y-12">
            {years.length === 0 ? (
              <div className="text-gray-500">No collections found</div>
            ) : (
              years.map((year) => (
                <div key={year} className="space-y-4">
                  <h2 className="text-2xl font-semibold border-b pb-2">{year}</h2>

                  <div className="space-y-6">
                    {groupedByYear[year].map((col: any) => {
                      const designs = Array.isArray(col._filteredDesigns) ? col._filteredDesigns : []
                      const collectionImages = uniq(col._collectionImages || [])
                      const designImages = uniq(designs.flatMap((d: any) => parseImages(d.image_urls)))
                      const collectionPhoto = collectionImages[0] || designImages[0] || null
                      const showCollectionImage = !!collectionPhoto

                      return (
                        <article
                          key={col.id}
                          className="border rounded-lg bg-white shadow-sm overflow-hidden"
                        >
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

                          <div className="grid grid-cols-1 md:grid-cols-6 gap-5 p-5">
                            {showCollectionImage && (
                              <div className="md:col-span-2">
                                <div className="h-64 w-full bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                                  <img
                                    src={collectionPhoto}
                                    alt={col.name}
                                    loading="lazy"
                                    className="object-cover h-full w-full cursor-pointer"
                                    onClick={() => openLightbox([collectionPhoto], 0)}
                                  />
                                </div>
                              </div>
                            )}

                            <div className={showCollectionImage ? 'md:col-span-4' : 'md:col-span-6'}>
                              <p className="text-sm text-gray-700 mb-4">
                                {col.description || 'No description'}
                              </p>

                              <h4 className="font-medium mb-3 text-lg">Designs</h4>

                              {designs.length > 0 ? (
                                <div className="space-y-4">
                                  {designs.map((d: any) => {
                                    const images = uniq(parseImages(d.image_urls))
                                    const thumb = images[0] || null

                                    return (
                                      <div
                                        key={d.id}
                                        className="flex gap-4 items-start border rounded-lg p-4"
                                      >
                                        <div className="h-28 w-28 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                                          {thumb ? (
                                            <img
                                              src={thumb}
                                              alt={d.name}
                                              loading="lazy"
                                              className="h-full w-full object-cover cursor-pointer"
                                              onClick={() => openLightbox(images, 0)}
                                            />
                                          ) : (
                                            <span className="text-xs text-gray-500">No img</span>
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between gap-3">
                                            <div className="text-lg font-medium">{d.name}</div>
                                            <div className="text-sm text-gray-600">
                                              {d.price ? `£${Number(d.price).toFixed(2)}` : ''}
                                            </div>
                                          </div>

                                          {images.length > 0 && (
                                            <div className="mt-3 flex gap-2 flex-wrap">
                                              {images.slice(0, 6).map((src, idx) => (
                                                <img
                                                  key={idx}
                                                  src={src}
                                                  alt={`${d.name} ${idx + 1}`}
                                                  loading="lazy"
                                                  className="h-16 w-16 object-cover rounded cursor-pointer border"
                                                  onClick={() => openLightbox(images, idx)}
                                                />
                                              ))}
                                            </div>
                                          )}

                                          <div className="text-sm text-gray-600 mt-3">
                                            {d.description || ''}
                                          </div>

                                          <div className="text-xs text-gray-500 mt-2">
                                            Shape: {d.shape_name || d.shape || 'N/A'}
                                            {d.measurements ? ` | Measurements: ${d.measurements}` : ''}
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
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div ref={loadMoreRef} className="h-12 w-full" />
          {hasMore && isLoadingMore && (
            <div className="text-center text-sm text-gray-500 py-4">Loading more...</div>
          )}
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