import React from 'react'
import { useLoaderData, Link } from 'react-router'
import type { Route } from '../+types/collection'

export const loader = async ({ request, params }: { request: Request; params: any }) => {
  const origin = new URL(request.url).origin
  const collectionId = params.id
  const [collectionRes, designsRes] = await Promise.all([
    fetch(new URL(`/api/collections/${collectionId}`, origin).toString()).then((r) => r.json()),
    fetch(new URL('/api/designs', origin).toString()).then((r) => r.json()),
  ])

  const designs = Array.isArray(designsRes) ? designsRes.filter((d: any) => String(d.collection_id) === String(collectionId)) : []
  return { collection: collectionRes, designs }
}

export default function CollectionPage() {
  const { collection, designs } = useLoaderData<typeof loader>()
  const col = Array.isArray(collection) ? collection[0] : collection

  if (!col) {
    return (
      <main className="container mx-auto p-4 pt-16">
        <h1>Not found</h1>
        <p>Collection not found.</p>
        <Link to="/">Back</Link>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <div className="mb-6">
        <Link to="/" className="text-sm text-blue-600">← Back to collections</Link>
        <h1 className="text-2xl font-bold mt-2">{col.name}</h1>
        {col.description && <p className="text-gray-700 mt-2">{col.description}</p>}
        <div className="text-sm text-gray-500 mt-1">Series: {col.series || '—'} • Season: {col.season || '—'}</div>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Designs</h2>
        {(!designs || designs.length === 0) && <div className="text-gray-500">No designs found for this collection.</div>}
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {designs.map((d: any) => (
            <li key={d.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
              <div className="h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                {(() => {
                  try {
                    const imgs = typeof d.image_urls === 'string' ? JSON.parse(d.image_urls) : d.image_urls
                    if (Array.isArray(imgs) && imgs.length > 0) {
                      return <img src={imgs[0]} alt={d.name} className="object-cover h-full w-full" />
                    }
                  } catch {
                    // ignore
                  }
                  return <div className="text-sm text-gray-500">No image</div>
                })()}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{d.name}</h3>
                  <span className="text-gray-600 text-sm">{d.price ? `$${d.price}` : ''}</span>
                </div>
                {d.description && <p className="text-sm text-gray-700 mt-2">{d.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
