import React, { useEffect, useState } from 'react'
import { useSession, signOut } from '../lib/auth-client'

function useApi(path: string) {
  const base = '' // relative to current origin
  return {
    list: async () => fetch(`${base}/api/${path}`).then((r) => r.json()),
    create: async (body: any) => fetch(`${base}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    update: async (id: number, body: any) => fetch(`${base}/api/${path}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    delete: async (id: number) => fetch(`${base}/api/${path}/${id}`, { method: 'DELETE' }).then((r) => r.json()),
  }
}

export default function AdminPage() {
  const { data: session, isPending } = useSession()
  const [tab, setTab] = useState<'collections' | 'designs' | 'shapes'>('collections')

  const collectionsApi = useApi('collections')
  const designsApi = useApi('designs')
  const shapesApi = useApi('shapes')

  const [collections, setCollections] = useState<any[]>([])
  const [designs, setDesigns] = useState<any[]>([])
  const [shapes, setShapes] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // simple form state for each entity
  const [colForm, setColForm] = useState<any>({ name: '', season: '', release_year: '', description: '', image_urls: '' })
  const [designForm, setDesignForm] = useState<any>({ collection_id: '', name: '', price: '', image_urls: '' })
  const [shapeForm, setShapeForm] = useState<any>({ name: '', measurements: '', category: '' })

  useEffect(() => {
    if (!session) return
    refreshAll()
  }, [session])

  async function refreshAll() {
    setLoading(true)
    try {
      const [cols, des, shs] = await Promise.all([
        collectionsApi.list(),
        designsApi.list(),
        shapesApi.list(),
      ])
      setCollections(cols)
      setDesigns(des)
      setShapes(shs)
      setError(null)
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!colForm.name || !colForm.name.trim()) {
      setError('Collection name is required')
      return
    }

    const payload: any = {
      name: colForm.name.trim(),
      season: colForm.season || null,
      release_year: colForm.release_year ? Number(colForm.release_year) : null,
      description: colForm.description || null,
    }

    if (colForm.image_urls) {
      try { payload.image_urls = JSON.parse(colForm.image_urls) } catch { payload.image_urls = [colForm.image_urls] }
    }

    await collectionsApi.create(payload)
    setColForm({ name: '', season: '', release_year: '', description: '', image_urls: '' })
    await refreshAll()
  }

  async function createDesign(e: React.FormEvent) {
    e.preventDefault()
    if (!designForm.collection_id) {
      setError('Select a collection')
      return
    }
    if (!designForm.name || !designForm.name.trim()) {
      setError('Design name is required')
      return
    }

    const payload: any = {
      collection_id: Number(designForm.collection_id),
      name: designForm.name.trim(),
      price: designForm.price ? Number(designForm.price) : null,
    }
    if (designForm.image_urls) {
      try { payload.image_urls = JSON.parse(designForm.image_urls) } catch { payload.image_urls = [designForm.image_urls] }
    }

    await designsApi.create(payload)
    setDesignForm({ collection_id: '', name: '', price: '', image_urls: '' })
    await refreshAll()
  }

  async function createShape(e: React.FormEvent) {
    e.preventDefault()
    if (!shapeForm.name || !shapeForm.name.trim()) { setError('Shape name is required'); return }

    const payload: any = { name: shapeForm.name.trim(), measurements: shapeForm.measurements }
    if (shapeForm.category) {
      try { payload.category = JSON.parse(shapeForm.category) } catch { payload.category = [shapeForm.category] }
    }

    await shapesApi.create(payload)
    setShapeForm({ name: '', measurements: '', category: '' })
    await refreshAll()
  }

  async function handleDelete(kind: string, id: number) {
    if (!confirm('Delete record?')) return
    if (kind === 'collections') await collectionsApi.delete(id)
    if (kind === 'designs') await designsApi.delete(id)
    if (kind === 'shapes') await shapesApi.delete(id)
    await refreshAll()
  }

  if (isPending) return <div className="p-4">Loading...</div>
  if (!session) return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin — Sign in</h1>
      <a href="/sign-in" className="text-blue-600">Sign in</a>
    </div>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div>
          <span className="mr-4">{session.user.email}</span>
          <button onClick={() => signOut()} className="text-sm text-red-600">Sign out</button>
        </div>
      </div>

      <nav className="mt-4 space-x-2">
        <button onClick={() => setTab('collections')} className={`px-3 py-1 ${tab==='collections'?'bg-gray-200':''}`}>Collections</button>
        <button onClick={() => setTab('designs')} className={`px-3 py-1 ${tab==='designs'?'bg-gray-200':''}`}>Designs</button>
        <button onClick={() => setTab('shapes')} className={`px-3 py-1 ${tab==='shapes'?'bg-gray-200':''}`}>Shapes</button>
        <button onClick={refreshAll} className="px-3 py-1">Refresh</button>
      </nav>

      {error && <div className="mt-4 text-red-600">{error}</div>}
      {loading && <div className="mt-4">Loading...</div>}

      <section className="mt-6">
        {tab === 'collections' && (
          <div>
            <h2 className="font-semibold">Add collection</h2>
            <form onSubmit={createCollection} className="mt-2 space-y-2">
              <input placeholder="Name" value={colForm.name} onChange={(e) => setColForm({ ...colForm, name: e.target.value })} className="border px-2 py-1" />
              <input placeholder="Season" value={colForm.season} onChange={(e) => setColForm({ ...colForm, season: e.target.value })} className="border px-2 py-1" />
              <input placeholder="Release year" value={colForm.release_year} onChange={(e) => setColForm({ ...colForm, release_year: e.target.value })} className="border px-2 py-1" />
              <input placeholder="Description" value={colForm.description} onChange={(e) => setColForm({ ...colForm, description: e.target.value })} className="border px-2 py-1" />
              <input placeholder='Image URLs (JSON array or single URL)' value={colForm.image_urls} onChange={(e) => setColForm({ ...colForm, image_urls: e.target.value })} className="border px-2 py-1" />
              <div><button className="px-3 py-1 bg-blue-600 text-white">Create</button></div>
            </form>

            <h3 className="mt-4 font-semibold">Collections</h3>
            <ul className="mt-2 space-y-2">
              {collections.map((c) => (
                <li key={c.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{c.name} <span className="text-sm text-gray-600">{c.season}</span></div>
                    <div className="text-sm text-gray-500">Release: {c.releaseDate || c.release_year}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => { setColForm({ name: c.name, season: c.season, release_year: c.release_year }) }} className="text-sm">Edit</button>
                    <button onClick={() => handleDelete('collections', c.id)} className="text-sm text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'designs' && (
          <div>
            <h2 className="font-semibold">Add design</h2>
            <form onSubmit={createDesign} className="mt-2 space-y-2">
              <select value={designForm.collection_id} onChange={(e) => setDesignForm({ ...designForm, collection_id: e.target.value })} className="border px-2 py-1">
                <option value="">Select collection</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="Name" value={designForm.name} onChange={(e) => setDesignForm({ ...designForm, name: e.target.value })} className="border px-2 py-1" />
              <input placeholder="Price" value={designForm.price} onChange={(e) => setDesignForm({ ...designForm, price: e.target.value })} className="border px-2 py-1" />
              <input placeholder='Image URLs (JSON array or single URL)' value={designForm.image_urls} onChange={(e) => setDesignForm({ ...designForm, image_urls: e.target.value })} className="border px-2 py-1" />
              <div><button className="px-3 py-1 bg-blue-600 text-white">Create</button></div>
            </form>

            <h3 className="mt-4 font-semibold">Designs</h3>
            <ul className="mt-2 space-y-2">
              {designs.map((d) => (
                <li key={d.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-sm text-gray-500">Collection: {d.collection_id}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => { setDesignForm({ collection_id: d.collection_id, name: d.name }) }} className="text-sm">Edit</button>
                    <button onClick={() => handleDelete('designs', d.id)} className="text-sm text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'shapes' && (
          <div>
            <h2 className="font-semibold">Add shape</h2>
            <form onSubmit={createShape} className="mt-2 space-y-2">
              <input placeholder="Name" value={shapeForm.name} onChange={(e) => setShapeForm({ ...shapeForm, name: e.target.value })} className="border px-2 py-1" />
              <input placeholder="Measurements" value={shapeForm.measurements} onChange={(e) => setShapeForm({ ...shapeForm, measurements: e.target.value })} className="border px-2 py-1" />
              <input placeholder='Category (JSON array or single value)' value={shapeForm.category} onChange={(e) => setShapeForm({ ...shapeForm, category: e.target.value })} className="border px-2 py-1" />
              <div><button className="px-3 py-1 bg-blue-600 text-white">Create</button></div>
            </form>

            <h3 className="mt-4 font-semibold">Shapes</h3>
            <ul className="mt-2 space-y-2">
              {shapes.map((s) => (
                <li key={s.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-500">{s.measurements}</div>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => { setShapeForm({ name: s.name, measurements: s.measurements }) }} className="text-sm">Edit</button>
                    <button onClick={() => handleDelete('shapes', s.id)} className="text-sm text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
