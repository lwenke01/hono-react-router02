import React, { useEffect, useState } from 'react'
import { data } from 'react-router'
import type { Route } from './+types/home'

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Collections' }, { name: 'description', content: 'Top collections' }]
}

export const loader = async (_: Route.LoaderArgs) => {
  return data({})
}

export default function Home(_: Route.ComponentProps) {
  const [collections, setCollections] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch('/api/collections').then((r) => r.json()),
      fetch('/api/designs').then((r) => r.json()),
    ])
      .then(([cols, designs]) => {
        if (!mounted) return
        const designsByCollection = new Map()
        if (Array.isArray(designs)) {
          for (const d of designs) {
            if (!designsByCollection.has(d.collection_id)) designsByCollection.set(d.collection_id, [])
            designsByCollection.get(d.collection_id).push(d)
          }
        }
        if (Array.isArray(cols)) {
          // attach thumbnail and keep full set for filtering
          const enriched = cols.map((c: any) => {
            const imgs = c.image_urls ? (() => { try { return JSON.parse(c.image_urls) } catch { return null } })() : null
            let img = imgs && Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null
            if (!img) {
              const ds = designsByCollection.get(c.id)
              if (Array.isArray(ds) && ds.length > 0) {
                try {
                  const di = ds[0].image_urls ? JSON.parse(ds[0].image_urls) : null
                  if (Array.isArray(di) && di.length > 0) img = di[0]
                } catch {}
              }
            }
            return { ...c, _thumbnail: img }
          })
          setCollections(enriched)
        } else {
          setCollections([])
        }
      })
      .catch(() => {
        if (mounted) setCollections([])
      })
    return () => {
      mounted = false
    }
  }, [])

  const seasons = Array.from(new Set(collections.map((c) => c.season).filter(Boolean)))
  const filtered = collections
    .filter((c) => {
      if (season && c.season !== season) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .slice(0, 5)

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
              filtered.map((col) => (
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
