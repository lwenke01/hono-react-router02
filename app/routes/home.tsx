import React, { useState, useMemo } from 'react'
import { useLoaderData } from 'react-router'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Collections' }, { name: 'description', content: 'Top collections' }]
}

export const loader = async ({ request }: { request: Request }) => {
  const origin = new URL(request.url).origin
  const [collections, designs] = await Promise.all([
    fetch(new URL('/api/collections', origin).toString()).then((r) => r.json()),
    fetch(new URL('/api/designs', origin).toString()).then((r) => r.json()),
  ])

  return { collections, designs }
}

export default function Home() {
  const { collections, designs } = useLoaderData<typeof loader>()

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)

  // Ensure we always have arrays
  const cols = Array.isArray(collections) ? collections : []
  const des = Array.isArray(designs) ? designs : []

  // Group designs by collection_id
  const designsByCollection = useMemo(() => {
    const map = new Map<number | string, typeof des>()
    for (const d of des) {
      const key = d.collection_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return map
  }, [des])

  // Enrich collections with thumbnails
  const enriched = useMemo(() => {
    return cols.map((c: any) => {
      let img: string | null = null

      // Try collection.image_urls first
      if (c.image_urls) {
        try {
          const imgs = typeof c.image_urls === 'string'
            ? JSON.parse(c.image_urls)
            : c.image_urls

          if (Array.isArray(imgs) && imgs.length > 0) {
            img = imgs[0]
          }
        } catch {
          // ignore
        }
      }

      // If no image, try first design of this collection
      if (!img) {
        const ds = designsByCollection.get(c.id)
        if (Array.isArray(ds) && ds.length > 0) {
          try {
            const di: any =
              typeof ds[0].image_urls === 'string'
                ? JSON.parse(ds[0].image_urls)
                : ds[0].image_urls

            if (Array.isArray(di) && di.length > 0) {
              img = di[0]
            }
          } catch {
            // ignore
          }
        }
      }

      return { ...c, _thumbnail: img }
    })
  }, [cols, designsByCollection])

  const seasons = Array.from(new Set(enriched.map((c: any) => c.season).filter(Boolean)))

  const filtered = enriched
    .filter((c: any) => {
      if (season && c.season !== season) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .slice(0, 20)

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
          </div>
        </aside>

        <section className="col-span-3">
          <h1 className="text-3xl font-bold mb-6">Top Collections</h1>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length === 0 ? (
              <li className="text-gray-500">No collections found</li>
            ) : (
              filtered.map((col: any) => (
                <li key={col.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="h-48 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {col._thumbnail ? (
                      <img src={col._thumbnail} alt={col.name} className="object-cover h-full w-full" />
                    ) : (
                      <div className="text-sm text-gray-500">No image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{col.name}</h2>
                      <span className="text-sm text-gray-600">{col.season}</span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}