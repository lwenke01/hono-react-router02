import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/collections.$id'

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Collection ${params.id} | Vendula London Handbag Library` },
    {
      name: 'description',
      content: 'Collection details, designs, and images from the Vendula London Handbag Library',
    },
  ]
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const res = await fetch('/api/collections')
  const collections = res.ok ? await res.json() : []
  const collection =
    Array.isArray(collections) ? collections.find((item: any) => String(item.id) === String(params.id)) : null

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

export default function CollectionDetail({ loaderData }: Route.ComponentProps) {
  const { collection } = loaderData

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const normalizedCollection = useMemo(() => {
    if (!collection) return null

    const designs = Array.isArray(collection.designs) ? collection.designs : []
    const collectionImages = parseImages(collection.imageurls ?? collection.image_urls)

    return {
      ...collection,
      designs,
      collectionImages,
    }
  }, [collection])

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

          <div className="ms-auto">
            <Link to="/" className="btn btn-sm btn-outline-secondary">
              Back to library
            </Link>
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
                      Release year: {normalizedCollection.releaseyear ?? normalizedCollection.release_year ?? 'Unknown'}
                    </p>
                  </div>

                  <span className="badge bg-secondary rounded-pill">
                    {normalizedCollection.designs.length} design{normalizedCollection.designs.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {normalizedCollection.description && (
                  <p className="mb-0">{normalizedCollection.description}</p>
                )}
              </div>
            </div>

            {collectionImages.length > 0 && (
              <div className="card shadow-sm border mb-4">
                <div className="card-header bg-light">
                  <h2 className="h6 fw-semibold mb-0">Collection images</h2>
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
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h2 className="h6 fw-semibold mb-0">Designs</h2>
                <span className="small text-muted">{normalizedCollection.designs.length} total</span>
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

                                  {design.price != null && design.price !== '' && (
                                    <span className="badge bg-light text-dark border">
                                      £{Number(design.price).toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                {design.description && (
                                  <p className="mb-2">{design.description}</p>
                                )}

                                <div className="small text-muted mb-3">
                                  {design.measurements ? `Measurements: ${design.measurements}` : 'No measurements'}
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
                                        style={{ width: 64, height: 64, objectFit: 'cover', cursor: 'pointer' }}
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

                  <dt className="col-5 text-muted">Release year</dt>
                  <dd className="col-7">
                    {normalizedCollection.releaseyear ?? normalizedCollection.release_year ?? '—'}
                  </dd>

                  <dt className="col-5 text-muted">Designs</dt>
                  <dd className="col-7">{normalizedCollection.designs.length}</dd>

                  <dt className="col-5 text-muted">Images</dt>
                  <dd className="col-7">{collectionImages.length + allDesignImages.length}</dd>
                </dl>
              </div>
            </div>

            <div className="card shadow-sm border">
              <div className="card-header bg-light">
                <h2 className="h6 fw-semibold mb-0">Actions</h2>
              </div>
              <div className="card-body d-grid gap-2">
                <Link to="/" className="btn btn-outline-secondary">
                  Back to library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

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