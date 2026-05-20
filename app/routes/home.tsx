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
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )
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

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)))
}

type AdminTab = 'collections' | 'designs' | 'shapes'

interface CollectionPayload {
  id?: string
  name: string
  season?: string
  series?: string
  releaseyear?: string
  description?: string
}

interface DesignPayload {
  id?: string
  name: string
  description?: string
  price?: string
  shape?: string
  shapename?: string
  measurements?: string
  collectionId?: string
}

interface ShapePayload {
  id?: string
  name: string
  description?: string
}

function AdminPanel({
  collections: allCollections,
  onClose,
  onRefresh,
}: {
  collections: any[]
  onClose: () => void
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>('collections')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  const [editingCol, setEditingCol] = useState<CollectionPayload | null>(null)
  const emptyCol: CollectionPayload = {
    name: '',
    season: '',
    series: '',
    releaseyear: '',
    description: '',
  }

  const [editingDesign, setEditingDesign] = useState<DesignPayload | null>(null)
  const emptyDesign: DesignPayload = {
    name: '',
    description: '',
    price: '',
    shape: '',
    shapename: '',
    measurements: '',
    collectionId: '',
  }

  const [editingShape, setEditingShape] = useState<ShapePayload | null>(null)
  const emptyShape: ShapePayload = {
    name: '',
    description: '',
  }

  async function submit(url: string, method: string, body: object) {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text())

      setMessage({ type: 'success', text: 'Saved successfully.' })
      onRefresh()
      return true
    } catch (e: any) {
      setMessage({ type: 'danger', text: e.message || 'Save failed.' })
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleColSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCol) return

    const isUpdate = !!editingCol.id
    const ok = await submit(
      isUpdate ? `/api/admin/collections/${editingCol.id}` : '/api/admin/collections',
      isUpdate ? 'PUT' : 'POST',
      editingCol,
    )

    if (ok) setEditingCol(null)
  }

  async function handleDesignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDesign) return

    const isUpdate = !!editingDesign.id
    const ok = await submit(
      isUpdate ? `/api/admin/designs/${editingDesign.id}` : '/api/admin/designs',
      isUpdate ? 'PUT' : 'POST',
      editingDesign,
    )

    if (ok) setEditingDesign(null)
  }

  async function handleShapeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingShape) return

    const isUpdate = !!editingShape.id
    const ok = await submit(
      isUpdate ? `/api/admin/shapes/${editingShape.id}` : '/api/admin/shapes',
      isUpdate ? 'PUT' : 'POST',
      editingShape,
    )

    if (ok) setEditingShape(null)
  }

  function changeCol<K extends keyof CollectionPayload>(key: K, val: CollectionPayload[K]) {
    setEditingCol((prev) => ({ ...(prev ?? emptyCol), [key]: val }))
  }

  function changeDesign<K extends keyof DesignPayload>(key: K, val: DesignPayload[K]) {
    setEditingDesign((prev) => ({ ...(prev ?? emptyDesign), [key]: val }))
  }

  function changeShape<K extends keyof ShapePayload>(key: K, val: ShapePayload[K]) {
    setEditingShape((prev) => ({ ...(prev ?? emptyShape), [key]: val }))
  }

  const curCol = editingCol ?? emptyCol
  const curDesign = editingDesign ?? emptyDesign
  const curShape = editingShape ?? emptyShape

  const allDesigns = allCollections.flatMap((col: any) =>
    Array.isArray(col.designs) ? col.designs.map((d: any) => ({ ...d, _colName: col.name })) : [],
  )

  const shapeNames = Array.from(
    new Set(
      allCollections
        .flatMap((col: any) => (Array.isArray(col.designs) ? col.designs : []))
        .map((d: any) => String(d.shapename || d.shape || '').trim())
        .filter(Boolean),
    ),
  ).sort()

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-semibold">Admin Panel</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          {message && (
            <div className={`alert alert-${message.type} alert-dismissible m-3 mb-0`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)} />
            </div>
          )}

          <div className="modal-body">
            <ul className="nav nav-tabs mb-4">
              {(['collections', 'designs', 'shapes'] as AdminTab[]).map((tab) => (
                <li className="nav-item" key={tab}>
                  <button
                    className={`nav-link text-capitalize ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab)
                      setMessage(null)
                    }}
                    type="button"
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>

            {activeTab === 'collections' && (
              <div className="row g-4">
                <div className="col-md-5">
                  <h6 className="fw-semibold mb-3">
                    {curCol.id ? 'Edit Collection' : 'Add Collection'}
                  </h6>

                  <form onSubmit={handleColSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        value={curCol.name}
                        onChange={(e) => changeCol('name', e.target.value)}
                        required
                        placeholder="e.g. Spring Meadow"
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col">
                        <label className="form-label">Season</label>
                        <input
                          className="form-control"
                          value={curCol.season ?? ''}
                          onChange={(e) => changeCol('season', e.target.value)}
                          placeholder="e.g. SS24 (Spring/Summer 2024)"
                        />
                      </div>

                      <div className="col">
                        <label className="form-label">Series</label>
                        <input
                          className="form-control"
                          value={curCol.series ?? ''}
                          onChange={(e) => changeCol('series', e.target.value)}
                          placeholder="e.g. Main Line"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Release Year</label>
                      <input
                        className="form-control"
                        type="number"
                        value={curCol.releaseyear ?? ''}
                        onChange={(e) => changeCol('releaseyear', e.target.value)}
                        placeholder="e.g. 2024"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={curCol.description ?? ''}
                        onChange={(e) => changeCol('description', e.target.value)}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : curCol.id ? 'Update' : 'Create'}
                      </button>

                      {editingCol && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setEditingCol(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="col-md-7">
                  <h6 className="fw-semibold mb-3">All Collections ({allCollections.length})</h6>

                  <div className="list-group" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {allCollections.map((col: any) => (
                      <div
                        key={col.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-medium">{col.name}</div>
                          <small className="text-muted">
                            {col.season || '—'} · {col.series || '—'}
                          </small>
                        </div>

                        <button
                          className="btn btn-sm btn-outline-primary ms-2 flex-shrink-0"
                          onClick={() =>
                            setEditingCol({
                              id: col.id,
                              name: col.name || '',
                              season: col.season || '',
                              series: col.series || '',
                              releaseyear: col.releaseyear ? String(col.releaseyear) : '',
                              description: col.description || '',
                            })
                          }
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ))}

                    {allCollections.length === 0 && (
                      <div className="list-group-item text-muted">No collections yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'designs' && (
              <div className="row g-4">
                <div className="col-md-5">
                  <h6 className="fw-semibold mb-3">
                    {curDesign.id ? 'Edit Design' : 'Add Design'}
                  </h6>

                  <form onSubmit={handleDesignSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        value={curDesign.name}
                        onChange={(e) => changeDesign('name', e.target.value)}
                        required
                        placeholder="e.g. Blossom Tote"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Collection</label>
                      <select
                        className="form-select"
                        value={curDesign.collectionId ?? ''}
                        onChange={(e) => changeDesign('collectionId', e.target.value)}
                      >
                        <option value="">— Select collection —</option>
                        {allCollections.map((col: any) => (
                          <option key={col.id} value={col.id}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col">
                        <label className="form-label">Shape</label>
                        <input
                          className="form-control"
                          value={curDesign.shape ?? ''}
                          onChange={(e) => changeDesign('shape', e.target.value)}
                          placeholder="e.g. tote"
                        />
                      </div>

                      <div className="col">
                        <label className="form-label">Shape Name</label>
                        <input
                          className="form-control"
                          value={curDesign.shapename ?? ''}
                          onChange={(e) => changeDesign('shapename', e.target.value)}
                          placeholder="e.g. Classic Tote"
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col">
                        <label className="form-label">Price (£)</label>
                        <input
                          className="form-control"
                          type="number"
                          step="0.01"
                          value={curDesign.price ?? ''}
                          onChange={(e) => changeDesign('price', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col">
                        <label className="form-label">Measurements</label>
                        <input
                          className="form-control"
                          value={curDesign.measurements ?? ''}
                          onChange={(e) => changeDesign('measurements', e.target.value)}
                          placeholder="e.g. 30×20×12cm"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={curDesign.description ?? ''}
                        onChange={(e) => changeDesign('description', e.target.value)}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : curDesign.id ? 'Update' : 'Create'}
                      </button>

                      {editingDesign && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setEditingDesign(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="col-md-7">
                  <h6 className="fw-semibold mb-3">Recent Designs</h6>

                  <div className="list-group" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {allDesigns.slice(0, 100).map((d: any) => (
                      <div
                        key={d.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-medium">{d.name}</div>
                          <small className="text-muted">
                            {d._colName} · {d.shapename || d.shape || '—'}
                          </small>
                        </div>

                        <button
                          className="btn btn-sm btn-outline-primary ms-2 flex-shrink-0"
                          onClick={() =>
                            setEditingDesign({
                              id: d.id,
                              name: d.name || '',
                              description: d.description || '',
                              price: d.price != null ? String(d.price) : '',
                              shape: d.shape || '',
                              shapename: d.shapename || '',
                              measurements: d.measurements || '',
                              collectionId: d.collectionId || '',
                            })
                          }
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ))}

                    {allDesigns.length === 0 && (
                      <div className="list-group-item text-muted">No designs yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shapes' && (
              <div className="row g-4">
                <div className="col-md-5">
                  <h6 className="fw-semibold mb-3">
                    {curShape.id ? 'Edit Shape' : 'Add Shape'}
                  </h6>

                  <form onSubmit={handleShapeSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control"
                        value={curShape.name}
                        onChange={(e) => changeShape('name', e.target.value)}
                        required
                        placeholder="e.g. Crossbody"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={curShape.description ?? ''}
                        onChange={(e) => changeShape('description', e.target.value)}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : curShape.id ? 'Update' : 'Create'}
                      </button>

                      {editingShape && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setEditingShape(null)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="col-md-7">
                  <h6 className="fw-semibold mb-3">All Shapes</h6>

                  <div className="list-group" style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {shapeNames.map((shapeName: string) => (
                      <div
                        key={shapeName}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      >
                        <span className="fw-medium">{shapeName}</span>

                        <button
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() => setEditingShape({ name: shapeName, description: '' })}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    ))}

                    {shapeNames.length === 0 && (
                      <div className="list-group-item text-muted">No shapes yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { collections } = loaderData

  const [search, setSearch] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [series, setSeries] = useState<string | null>(null)
  const [shape, setShape] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollections = useMemo(() => {
    return (Array.isArray(collections) ? collections : []).map((col: any) => {
      const designs = Array.isArray(col.designs) ? col.designs : []
      const collectionImages = parseImages(col.imageurls ?? col.image_urls)
      const designImages = uniq(
        designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)),
      )

      return {
        ...col,
        designs,
        collectionImages,
        thumbnail: collectionImages[0] ?? designImages[0] ?? null,
      }
    })
  }, [collections, refreshTick])

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
        normalizedCollections
          .flatMap((c: any) => c.designs)
          .map((d: any) => String(d.shapename ?? d.shape ?? '').trim())
          .filter(Boolean),
      ),
    ).sort()
  }, [normalizedCollections])

  const filteredCollections = useMemo(() => {
    const term = search.trim().toLowerCase()

    return normalizedCollections
      .map((c: any) => {
        const collectionMatches =
          !term ||
          [c.name, c.description, c.season, c.series, c.releaseyear ?? c.release_year]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)

        const filteredDesigns = c.designs.filter((d: any) => {
          const designShape = String(d.shapename ?? d.shape ?? '').trim().toLowerCase()

          if (shape && designShape !== shape.toLowerCase()) return false
          if (!term) return true

          const haystack = [
            d.name,
            d.description,
            d.shapename,
            d.shape,
            ...(Array.isArray(d.categories) ? d.categories : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return haystack.includes(term)
        })

        return {
          ...c,
          filteredDesigns,
          collectionMatches,
        }
      })
      .filter((c: any) => {
        if (season && c.season !== season) return false
        if (series && c.series !== series) return false
        if (shape && c.filteredDesigns.length === 0) return false
        if (term && !c.collectionMatches && c.filteredDesigns.length === 0) return false
        return true
      })
      .sort(
        (a: any, b: any) =>
          Number(b.releaseyear ?? b.release_year ?? 0) -
          Number(a.releaseyear ?? a.release_year ?? 0),
      )
  }, [normalizedCollections, search, season, series, shape])

  const { visibleItems, hasMore, isLoadingMore, loadMoreRef } = useInfiniteCollections(
    filteredCollections,
    50,
  )

  const groupedByYear = useMemo(() => {
    return visibleItems.reduce((acc: Record<string, any[]>, col: any) => {
      const year = String(col.releaseyear ?? col.release_year ?? 'Unknown')
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

  const nextImage = () =>
    setLightboxIndex((current) =>
      lightboxImages.length ? (current + 1) % lightboxImages.length : current,
    )

  const prevImage = () =>
    setLightboxIndex((current) =>
      lightboxImages.length
        ? (current - 1 + lightboxImages.length) % lightboxImages.length
        : current,
    )

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

  const activeFilterCount = [search.trim(), season, series, shape].filter(Boolean).length

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-xl">
          <span className="navbar-brand fw-bold mb-0">Vendula Handbag Library</span>

          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="badge bg-secondary rounded-pill">
              {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            </span>

            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => setShowAdmin(true)}
              type="button"
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      <div className="container-xl py-4">
        <div className="row g-4">
          <aside className="col-lg-3">
            <div className="sticky-top" style={{ top: '72px' }}>
              <div className="card shadow-sm border">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0">Filters</h6>

                    {activeFilterCount > 0 && (
                      <button
                        className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                        onClick={() => {
                          setSearch('')
                          setSeason(null)
                          setSeries(null)
                          setShape(null)
                        }}
                        type="button"
                      >
                        Clear all ({activeFilterCount})
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="search-input" className="form-label small fw-medium text-muted">
                      Search
                    </label>
                    <input
                      id="search-input"
                      type="search"
                      className="form-control form-control-sm"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Collections, designs, shapes…"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="season-select"
                      className="form-label small fw-medium text-muted"
                    >
                      Season
                    </label>
                    <select
                      id="season-select"
                      className="form-select form-select-sm"
                      value={season ?? ''}
                      onChange={(e) => setSeason(e.target.value || null)}
                    >
                      <option value="">All seasons</option>
                      {seasons.map((s) => (
                        <option key={s as string} value={s as string}>
                          {s as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="series-select"
                      className="form-label small fw-medium text-muted"
                    >
                      Series
                    </label>
                    <select
                      id="series-select"
                      className="form-select form-select-sm"
                      value={series ?? ''}
                      onChange={(e) => setSeries(e.target.value || null)}
                    >
                      <option value="">All series</option>
                      {seriesList.map((s) => (
                        <option key={s as string} value={s as string}>
                          {s as string}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-0">
                    <label htmlFor="shape-select" className="form-label small fw-medium text-muted">
                      Shape
                    </label>
                    <select
                      id="shape-select"
                      className="form-select form-select-sm"
                      value={shape ?? ''}
                      onChange={(e) => setShape(e.target.value || null)}
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
              </div>
            </div>
          </aside>

          <main className="col-lg-9">
            <h1 className="h4 fw-bold mb-4">Vendula London Handbag Library</h1>

            {years.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div className="mb-2" style={{ fontSize: '2rem' }}>
                  🔍
                </div>
                <div className="fw-medium">No collections found</div>
                <div className="small mt-1">Try adjusting your filters or search term</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-5">
                {years.map((year) => (
                  <section key={year}>
                    <h2 className="h6 fw-semibold text-muted text-uppercase border-bottom pb-2 mb-3">
                      {year}
                    </h2>

                    <div className="d-flex flex-column gap-3">
                      {groupedByYear[year].map((col: any) => {
                        const designs: any[] = Array.isArray(col.filteredDesigns)
                          ? col.filteredDesigns
                          : []

                        const collectionImages = uniq(col.collectionImages ?? [])
                        const designImages = uniq(
                          designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)),
                        )
                        const collectionPhoto = collectionImages[0] ?? designImages[0] ?? null

                        return (
                          <article key={col.id} className="card shadow-sm border">
                            <div className="card-header bg-light d-flex align-items-start justify-content-between gap-3 py-3">
                              <div className="d-flex gap-3 align-items-start">
                                {collectionPhoto && (
                                  <img
                                    src={collectionPhoto}
                                    alt={col.name}
                                    loading="lazy"
                                    width={72}
                                    height={72}
                                    className="rounded border flex-shrink-0"
                                    style={{ width: 72, height: 72, objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => openLightbox([collectionPhoto], 0)}
                                  />
                                )}

                                <div>
                                  <p className="mb-0 small text-muted fw-medium">
                                    {col.season || 'Unknown'}
                                  </p>
                                  <h3 className="h6 fw-bold mb-1">{col.name}</h3>
                                  <p className="mb-0 small text-muted">
                                    {col.season || 'Unknown'}
                                    {col.series ? ` · ${col.series}` : ''}
                                  </p>
                                </div>
                              </div>

                              <Link
                                to={`/collection/${col.id}`}
                                className="btn btn-sm btn-outline-secondary flex-shrink-0"
                              >
                                View
                              </Link>
                            </div>

                            {col.description && (
                              <div className="px-3 pt-3 pb-1">
                                <p className="small text-muted mb-0">{col.description}</p>
                              </div>
                            )}

                            {designs.length > 0 && (
                              <div className="card-body pt-2">
                                <p className="small fw-semibold text-muted mb-2">
                                  {designs.length} design{designs.length !== 1 ? 's' : ''}
                                </p>

                                <div className="row g-3">
                                  {designs.map((d: any) => {
                                    const images = uniq(parseImages(d.imageurls ?? d.image_urls))
                                    const thumb = images[0] ?? null

                                    return (
                                      <div key={d.id} className="col-sm-6 col-xl-4">
                                        <div className="d-flex gap-3 p-2 rounded border bg-white h-100">
                                          <div
                                            className="flex-shrink-0 rounded overflow-hidden bg-light border"
                                            style={{ width: 64, height: 64 }}
                                          >
                                            {thumb ? (
                                              <img
                                                src={thumb}
                                                alt={d.name}
                                                loading="lazy"
                                                width={64}
                                                height={64}
                                                className="w-100 h-100"
                                                style={{ objectFit: 'cover', cursor: 'pointer' }}
                                                onClick={() => openLightbox(images, 0)}
                                              />
                                            ) : (
                                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                                <small>No img</small>
                                              </div>
                                            )}
                                          </div>

                                          <div className="min-w-0 flex-grow-1">
                                            <div className="fw-medium small text-truncate">
                                              {d.name}
                                            </div>

                                            {d.price != null && d.price !== '' && (
                                              <div className="small text-muted">
                                                £{Number(d.price).toFixed(2)}
                                              </div>
                                            )}

                                            {(d.shapename || d.shape) && (
                                              <div className="small text-muted text-truncate">
                                                {d.shapename || d.shape}
                                              </div>
                                            )}

                                            {d.measurements && (
                                              <div className="small text-muted">
                                                {d.measurements}
                                              </div>
                                            )}

                                            {images.length > 1 && (
                                              <div className="d-flex gap-1 mt-1 flex-wrap">
                                                {images.slice(1, 5).map((src, idx) => (
                                                  <img
                                                    key={idx}
                                                    src={src}
                                                    alt={`${d.name} ${idx + 2}`}
                                                    loading="lazy"
                                                    width={28}
                                                    height={28}
                                                    className="rounded border"
                                                    style={{
                                                      width: 28,
                                                      height: 28,
                                                      objectFit: 'cover',
                                                      cursor: 'pointer',
                                                    }}
                                                    onClick={() => openLightbox(images, idx + 1)}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} className="py-4 text-center">
              {hasMore && isLoadingMore && (
                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                  <span className="visually-hidden">Loading more…</span>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {showAdmin && (
        <AdminPanel
          collections={normalizedCollections}
          onClose={() => setShowAdmin(false)}
          onRefresh={() => setRefreshTick((v) => v + 1)}
        />
      )}

      {lightboxOpen && lightboxImages.length > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          <button
            type="button"
            aria-label="Previous image"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
          >
            ‹
          </button>

          <img
            src={lightboxImages[lightboxIndex]}
            alt="Expanded view"
            style={{ maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            aria-label="Next image"
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
          >
            ›
          </button>

          <button
            type="button"
            aria-label="Close lightbox"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 1,
            }}
            className="btn btn-dark btn-sm rounded-circle opacity-75"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
          >
            ✕
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className="badge bg-dark opacity-75"
          >
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </>
  )
}