import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/collections.$id'

export function meta({ data }: Route.MetaArgs) {
  const name = data?.collection?.name || 'Collection'
  return [
    { title: `${name} | Vendula London Handbag Library` },
    {
      name: 'description',
      content: `Collection details, designs, and admin tools for ${name}`,
    },
  ]
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await fetch(`/api/collections/${params.id}`)
  const collection = res.ok ? await res.json() : null
  return { collection }
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

function toTextValue(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join(', ')
    return joined || null
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value).trim() || null
}

function toFormString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

type AdminTab = 'collection' | 'designs' | 'shapes'

interface CollectionPayload {
  id?: string
  name: string
  description?: string
  season?: string
  series?: string
  edition?: string
  release_year?: string
  themes?: string
  colours?: string
  name_friendly?: string
  type?: string
  image_urls?: string
  releaseDate?: string
  exclusive?: string
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

export default function CollectionDetail({ loaderData }: Route.ComponentProps) {
  const initialCollection = loaderData.collection

  const [collection, setCollection] = useState(initialCollection)
  const [showAdmin, setShowAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('collection')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollection = useMemo(() => {
    if (!collection) return null
    const designs = Array.isArray(collection.designs) ? collection.designs : []
    const collectionImages = parseImages(collection.image_urls ?? collection.imageurls)

    return {
      ...collection,
      designs,
      collectionImages,
    }
  }, [collection])

  const [collectionForm, setCollectionForm] = useState<CollectionPayload>({
    id: initialCollection?.id,
    name: toFormString(initialCollection?.name),
    description: toFormString(initialCollection?.description),
    season: toFormString(initialCollection?.season),
    series: toFormString(initialCollection?.series),
    edition: toFormString(initialCollection?.edition),
    release_year: initialCollection?.release_year != null ? String(initialCollection.release_year) : '',
    themes: toFormString(initialCollection?.themes),
    colours: toFormString(initialCollection?.colours),
    name_friendly: toFormString(initialCollection?.name_friendly),
    type: toFormString(initialCollection?.type),
    image_urls: toFormString(initialCollection?.image_urls),
    releaseDate: toFormString(initialCollection?.releaseDate),
    exclusive: toFormString(initialCollection?.exclusive),
  })

  const emptyDesign: DesignPayload = {
    id: '',
    name: '',
    description: '',
    price: '',
    shape: '',
    shapename: '',
    measurements: '',
    collectionId: initialCollection?.id || '',
  }

  const [designForm, setDesignForm] = useState<DesignPayload>(emptyDesign)

  const emptyShape: ShapePayload = {
    id: '',
    name: '',
    description: '',
  }

  const [shapeForm, setShapeForm] = useState<ShapePayload>(emptyShape)

  const shapeNames = useMemo(() => {
    if (!normalizedCollection) return []
    return Array.from(
      new Set(
        normalizedCollection.designs
          .map((d: any) => String(d.shapename || d.shape || d.shape_name || '').trim())
          .filter(Boolean),
      ),
    ).sort()
  }, [normalizedCollection])

  async function refreshCollection() {
    if (!normalizedCollection?.id) return

    const res = await fetch(`/api/collections/${normalizedCollection.id}`)
    const updated = res.ok ? await res.json() : null
    setCollection(updated)

    setCollectionForm({
      id: updated?.id,
      name: toFormString(updated?.name),
      description: toFormString(updated?.description),
      season: toFormString(updated?.season),
      series: toFormString(updated?.series),
      edition: toFormString(updated?.edition),
      release_year: updated?.release_year != null ? String(updated.release_year) : '',
      themes: toFormString(updated?.themes),
      colours: toFormString(updated?.colours),
      name_friendly: toFormString(updated?.name_friendly),
      type: toFormString(updated?.type),
      image_urls: toFormString(updated?.image_urls),
      releaseDate: toFormString(updated?.releaseDate),
      exclusive: toFormString(updated?.exclusive),
    })
  }

  async function handleUpdateCollection(e: React.FormEvent) {
    e.preventDefault()
    if (!normalizedCollection?.id) return

    setSaving(true)
    setMessage(null)

    const payload = {
      name: toTextValue(collectionForm.name) || '',
      description: toTextValue(collectionForm.description),
      season: toTextValue(collectionForm.season),
      series: toTextValue(collectionForm.series),
      edition: toTextValue(collectionForm.edition),
      release_year: collectionForm.release_year ? Number(collectionForm.release_year) : null,
      themes: toTextValue(collectionForm.themes),
      colours: toTextValue(collectionForm.colours),
      name_friendly: toTextValue(collectionForm.name_friendly),
      type: toTextValue(collectionForm.type),
      image_urls: toTextValue(collectionForm.image_urls),
      releaseDate: toTextValue(collectionForm.releaseDate),
      exclusive: toTextValue(collectionForm.exclusive),
    }

    try {
      const res = await fetch(`/api/admin/collections/${normalizedCollection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()

      if (!res.ok) {
        throw new Error(text || `Update failed with status ${res.status}`)
      }

      await refreshCollection()
      setMessage({ type: 'success', text: 'Collection updated successfully.' })
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.message || 'Failed to update collection.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveDesign(e: React.FormEvent) {
    e.preventDefault()
    if (!normalizedCollection?.id) return

    setSaving(true)
    setMessage(null)

    const isUpdate = Boolean(designForm.id)

    try {
      const res = await fetch(
        isUpdate ? `/api/admin/designs/${designForm.id}` : '/api/admin/designs',
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...designForm,
            collectionId: normalizedCollection.id,
          }),
        },
      )

      const text = await res.text()

      if (!res.ok) {
        throw new Error(text || `Design save failed with status ${res.status}`)
      }

      await refreshCollection()
      setMessage({
        type: 'success',
        text: isUpdate ? 'Design updated successfully.' : 'Design created successfully.',
      })

      setDesignForm({
        ...emptyDesign,
        collectionId: normalizedCollection.id,
      })
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Failed to save design.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveShape(e: React.FormEvent) {
    e.preventDefault()

    setSaving(true)
    setMessage(null)

    const isUpdate = Boolean(shapeForm.id)

    try {
      const res = await fetch(isUpdate ? `/api/admin/shapes/${shapeForm.id}` : '/api/admin/shapes', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shapeForm),
      })

      const text = await res.text()

      if (!res.ok) {
        throw new Error(text || `Shape save failed with status ${res.status}`)
      }

      setMessage({
        type: 'success',
        text: isUpdate ? 'Shape updated successfully.' : 'Shape created successfully.',
      })

      setShapeForm(emptyShape)
      await refreshCollection()
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Failed to save shape.' })
    } finally {
      setSaving(false)
    }
  }

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

  if (!normalizedCollection) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning mb-4">Collection not found.</div>
        <Link to="/" className="btn btn-outline-secondary">
          Back to library
        </Link>
      </div>
    )
  }

  const collectionImages = uniq(normalizedCollection.collectionImages)
  const allDesignImages = uniq(
    normalizedCollection.designs.flatMap((d: any) => parseImages(d.imageurls ?? d.image_urls)),
  )

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-xl">
          <Link to="/" className="navbar-brand fw-bold text-decoration-none">
            Vendula Handbag Library
          </Link>

          <div className="ms-auto d-flex gap-2">
            <Link to="/" className="btn btn-sm btn-outline-secondary">
              Back to library
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-dark"
              onClick={() => setShowAdmin(true)}
            >
              Admin
            </button>
          </div>
        </div>
      </nav>

      <div className="container-xl py-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card shadow-sm border mb-4">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <p className="text-muted small mb-1">
                      {normalizedCollection.season || 'Unknown'}
                      {normalizedCollection.series ? ` · ${normalizedCollection.series}` : ''}
                    </p>
                    <h1 className="h3 fw-bold mb-1">{normalizedCollection.name}</h1>
                    <p className="text-muted mb-0">
                      Release year: {normalizedCollection.release_year ?? 'Unknown'}
                    </p>
                  </div>

                  <span className="badge bg-secondary rounded-pill">
                    {normalizedCollection.designs.length} design
                    {normalizedCollection.designs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {normalizedCollection.description && (
                  <p className="mb-0">{normalizedCollection.description}</p>
                )}
              </div>
            </div>

            {collectionImages.length > 0 && (
              <div className="card shadow-sm border mb-4">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h2 className="h6 fw-semibold mb-0">Collection images</h2>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => {
                      setActiveTab('collection')
                      setShowAdmin(true)
                    }}
                  >
                    Edit collection
                  </button>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {collectionImages.map((src, idx) => (
                      <div key={idx} className="col-6 col-md-4">
                        <img
                          src={src}
                          alt={`${normalizedCollection.name} ${idx + 1}`}
                          loading="lazy"
                          width={300}
                          height={300}
                          className="img-fluid rounded border w-100"
                          style={{ aspectRatio: '1 / 1', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => openLightbox(collectionImages, idx)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card shadow-sm border">
              <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h2 className="h6 fw-semibold mb-0">Designs</h2>
                  <span className="small text-muted">
                    {normalizedCollection.designs.length} total
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-dark"
                  onClick={() => {
                    setDesignForm({
                      id: '',
                      name: '',
                      description: '',
                      price: '',
                      shape: '',
                      shapename: '',
                      measurements: '',
                      collectionId: normalizedCollection.id,
                    })
                    setActiveTab('designs')
                    setShowAdmin(true)
                  }}
                >
                  Add design
                </button>
              </div>

              <div className="card-body">
                {normalizedCollection.designs.length === 0 ? (
                  <div className="text-muted">No designs found for this collection.</div>
                ) : (
                  <div className="row g-3">
                    {normalizedCollection.designs.map((design: any) => {
                      const images = uniq(parseImages(design.imageurls ?? design.image_urls))
                      const thumb = images[0] ?? null

                      return (
                        <div key={design.id} className="col-12">
                          <div className="border rounded p-3 h-100">
                            <div className="row g-3">
                              <div className="col-md-3">
                                <div
                                  className="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden"
                                  style={{ minHeight: '180px' }}
                                >
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt={design.name}
                                      loading="lazy"
                                      width={320}
                                      height={320}
                                      className="img-fluid w-100 h-100"
                                      style={{ objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => openLightbox(images, 0)}
                                    />
                                  ) : (
                                    <span className="text-muted small">No image</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-md-9">
                                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                                  <div>
                                    <h3 className="h5 mb-1">{design.name}</h3>
                                    <div className="text-muted small">
                                      {design.shapename || design.shape_name || design.shape || 'No shape'}
                                    </div>
                                  </div>

                                  <div className="d-flex gap-2">
                                    {design.price != null && design.price !== '' && (
                                      <span className="badge bg-light text-dark border">
                                        £{Number(design.price).toFixed(2)}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => {
                                        setDesignForm({
                                          id: design.id || '',
                                          name: design.name || '',
                                          description: design.description || '',
                                          price: design.price != null ? String(design.price) : '',
                                          shape: design.shape || '',
                                          shapename: design.shapename || design.shape_name || '',
                                          measurements: design.measurements || '',
                                          collectionId: normalizedCollection.id,
                                        })
                                        setActiveTab('designs')
                                        setShowAdmin(true)
                                      }}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>

                                {design.description && <p className="mb-2">{design.description}</p>}

                                <div className="small text-muted mb-3">
                                  {design.measurements
                                    ? `Measurements: ${design.measurements}`
                                    : 'No measurements'}
                                </div>

                                {images.length > 1 && (
                                  <div className="d-flex gap-2 flex-wrap">
                                    {images.map((src, idx) => (
                                      <img
                                        key={idx}
                                        src={src}
                                        alt={`${design.name} ${idx + 1}`}
                                        loading="lazy"
                                        width={64}
                                        height={64}
                                        className="rounded border"
                                        style={{
                                          width: 64,
                                          height: 64,
                                          objectFit: 'cover',
                                          cursor: 'pointer',
                                        }}
                                        onClick={() => openLightbox(images, idx)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Collection details</h2>
              </div>
              <div className="card-body">
                <dl className="row mb-0">
                  <dt className="col-5 text-muted">Name</dt>
                  <dd className="col-7">{normalizedCollection.name || '—'}</dd>

                  <dt className="col-5 text-muted">Season</dt>
                  <dd className="col-7">{normalizedCollection.season || '—'}</dd>

                  <dt className="col-5 text-muted">Series</dt>
                  <dd className="col-7">{normalizedCollection.series || '—'}</dd>

                  <dt className="col-5 text-muted">Edition</dt>
                  <dd className="col-7">{normalizedCollection.edition || '—'}</dd>

                  <dt className="col-5 text-muted">Release year</dt>
                  <dd className="col-7">{normalizedCollection.release_year ?? '—'}</dd>

                  <dt className="col-5 text-muted">Friendly name</dt>
                  <dd className="col-7">{normalizedCollection.name_friendly || '—'}</dd>

                  <dt className="col-5 text-muted">Type</dt>
                  <dd className="col-7">{normalizedCollection.type || '—'}</dd>

                  <dt className="col-5 text-muted">Exclusive</dt>
                  <dd className="col-7">{normalizedCollection.exclusive || '—'}</dd>

                  <dt className="col-5 text-muted">Designs</dt>
                  <dd className="col-7">{normalizedCollection.designs.length}</dd>

                  <dt className="col-5 text-muted">Images</dt>
                  <dd className="col-7">{collectionImages.length + allDesignImages.length}</dd>
                </dl>
              </div>
            </div>

            <div className="card shadow-sm border mb-4">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Themes and colours</h2>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <span className="fw-semibold">Themes:</span> {toFormString(normalizedCollection.themes) || '—'}
                </p>
                <p className="mb-0">
                  <span className="fw-semibold">Colours:</span> {toFormString(normalizedCollection.colours) || '—'}
                </p>
              </div>
            </div>

            <div className="card shadow-sm border">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Admin shortcuts</h2>
              </div>
              <div className="card-body d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => {
                    setActiveTab('collection')
                    setShowAdmin(true)
                  }}
                >
                  Edit collection
                </button>

                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => {
                    setDesignForm({
                      id: '',
                      name: '',
                      description: '',
                      price: '',
                      shape: '',
                      shapename: '',
                      measurements: '',
                      collectionId: normalizedCollection.id,
                    })
                    setActiveTab('designs')
                    setShowAdmin(true)
                  }}
                >
                  Create design
                </button>

                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => {
                    setShapeForm({
                      id: '',
                      name: '',
                      description: '',
                    })
                    setActiveTab('shapes')
                    setShowAdmin(true)
                  }}
                >
                  Create shape
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAdmin && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdmin(false)
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-semibold">Admin</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowAdmin(false)}
                />
              </div>

              {message && (
                <div className={`alert alert-${message.type} alert-dismissible m-3 mb-0`} role="alert">
                  {message.text}
                  <button type="button" className="btn-close" onClick={() => setMessage(null)} />
                </div>
              )}

              <div className="modal-body">
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`}
                      onClick={() => setActiveTab('collection')}
                    >
                      Edit Collection
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === 'designs' ? 'active' : ''}`}
                      onClick={() => setActiveTab('designs')}
                    >
                      {designForm.id ? 'Edit Design' : 'Add Design'}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link ${activeTab === 'shapes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('shapes')}
                    >
                      Shapes
                    </button>
                  </li>
                </ul>

                {activeTab === 'collection' && (
                  <form onSubmit={handleUpdateCollection}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={collectionForm.name}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Season</label>
                        <input
                          className="form-control"
                          value={collectionForm.season ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, season: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Series</label>
                        <input
                          className="form-control"
                          value={collectionForm.series ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, series: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Release Year</label>
                        <input
                          type="number"
                          className="form-control"
                          value={collectionForm.release_year ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, release_year: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Edition</label>
                        <input
                          className="form-control"
                          value={collectionForm.edition ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, edition: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Type</label>
                        <input
                          className="form-control"
                          value={collectionForm.type ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, type: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Exclusive</label>
                        <input
                          className="form-control"
                          value={collectionForm.exclusive ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, exclusive: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Friendly Name</label>
                        <input
                          className="form-control"
                          value={collectionForm.name_friendly ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, name_friendly: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Themes</label>
                        <input
                          className="form-control"
                          value={collectionForm.themes ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, themes: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Colours</label>
                        <input
                          className="form-control"
                          value={collectionForm.colours ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, colours: e.target.value }))}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Release Date</label>
                        <input
                          className="form-control"
                          value={collectionForm.releaseDate ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, releaseDate: e.target.value }))}
                          placeholder="e.g. 2024-03-01"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Image URLs</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={collectionForm.image_urls ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, image_urls: e.target.value }))}
                          placeholder='JSON array or text stored in image_urls'
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={collectionForm.description ?? ''}
                          onChange={(e) => setCollectionForm((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>

                      <div className="col-12">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? 'Saving…' : 'Update collection'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {activeTab === 'designs' && (
                  <div className="row g-4">
                    <div className="col-md-5">
                      <form onSubmit={handleSaveDesign}>
                        <div className="mb-3">
                          <label className="form-label">Name</label>
                          <input
                            className="form-control"
                            value={designForm.name}
                            onChange={(e) => setDesignForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col">
                            <label className="form-label">Shape</label>
                            <input
                              className="form-control"
                              value={designForm.shape ?? ''}
                              onChange={(e) => setDesignForm((prev) => ({ ...prev, shape: e.target.value }))}
                            />
                          </div>

                          <div className="col">
                            <label className="form-label">Shape Name</label>
                            <input
                              className="form-control"
                              value={designForm.shapename ?? ''}
                              onChange={(e) => setDesignForm((prev) => ({ ...prev, shapename: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col">
                            <label className="form-label">Price (£)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="form-control"
                              value={designForm.price ?? ''}
                              onChange={(e) => setDesignForm((prev) => ({ ...prev, price: e.target.value }))}
                            />
                          </div>

                          <div className="col">
                            <label className="form-label">Measurements</label>
                            <input
                              className="form-control"
                              value={designForm.measurements ?? ''}
                              onChange={(e) => setDesignForm((prev) => ({ ...prev, measurements: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={designForm.description ?? ''}
                            onChange={(e) => setDesignForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : designForm.id ? 'Update design' : 'Create design'}
                          </button>

                          {designForm.id && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setDesignForm({
                                  ...emptyDesign,
                                  collectionId: normalizedCollection.id,
                                })
                              }
                            >
                              Cancel edit
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    <div className="col-md-7">
                      <h6 className="fw-semibold mb-3">Designs in this collection</h6>

                      <div className="list-group" style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {normalizedCollection.designs.map((d: any) => (
                          <div
                            key={d.id}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <div className="fw-medium">{d.name}</div>
                              <small className="text-muted">
                                {d.shapename || d.shape_name || d.shape || '—'}
                              </small>
                            </div>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setDesignForm({
                                  id: d.id || '',
                                  name: d.name || '',
                                  description: d.description || '',
                                  price: d.price != null ? String(d.price) : '',
                                  shape: d.shape || '',
                                  shapename: d.shapename || d.shape_name || '',
                                  measurements: d.measurements || '',
                                  collectionId: normalizedCollection.id,
                                })
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        {normalizedCollection.designs.length === 0 && (
                          <div className="list-group-item text-muted">No designs yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'shapes' && (
                  <div className="row g-4">
                    <div className="col-md-5">
                      <form onSubmit={handleSaveShape}>
                        <div className="mb-3">
                          <label className="form-label">Shape name</label>
                          <input
                            className="form-control"
                            value={shapeForm.name}
                            onChange={(e) => setShapeForm((prev) => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            value={shapeForm.description ?? ''}
                            onChange={(e) => setShapeForm((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </div>

                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : shapeForm.id ? 'Update shape' : 'Create shape'}
                          </button>

                          {shapeForm.id && (
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => setShapeForm(emptyShape)}
                            >
                              Cancel edit
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    <div className="col-md-7">
                      <h6 className="fw-semibold mb-3">Shapes used in this collection</h6>

                      <div className="list-group" style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {shapeNames.map((shapeName) => (
                          <div
                            key={shapeName}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          >
                            <span className="fw-medium">{shapeName}</span>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                setShapeForm({
                                  id: '',
                                  name: shapeName,
                                  description: '',
                                })
                              }
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        {shapeNames.length === 0 && (
                          <div className="list-group-item text-muted">No shapes found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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