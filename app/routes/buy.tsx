import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Route } from './+types/home'
import { useInfiniteCollections } from './useInfiniteCollections'

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Where to Buy Vendula London Bags' },
    {
      name: 'description',
      content: 'Stockists, shops and platforms that sell Vendula London handbags',
    },
  ]
}

export async function clientLoader() {
  const res = await fetch('/api/collections')
  const collections = res.ok ? await res.json() : []
  return { collections }
}

export function HydrateFallback() {
  return <div className="p-3 text-info spinner-border m-5" role="status">
  <span className="visually-hidden">Loading...</span>
  </div>

}

{/* <div class="spinner-border" role="status">
  <span class="visually-hidden">Loading...</span>
</div> */}

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

    <main className="container">
   <div >
<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSe-M8DetBad7uQMljn9U_EqBaLAc-EqjsnEOxBrWaQVw1-Wog/viewform?embedded=true" width="100%" height="1000" frameBorder="0" marginHeight="0" marginwidth="0">Loading…</iframe>

   </div>

 
    

        
     
    </main>
  )}
