import { useEffect, useRef, useState } from 'react'

export function useInfiniteCollections<T>(items: T[], pageSize = 50) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    setVisibleCount(pageSize)
    setIsLoadingMore(false)
    loadingRef.current = false
  }, [items, pageSize])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || visibleCount >= items.length) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        if (loadingRef.current) return

        loadingRef.current = true
        setIsLoadingMore(true)

        setVisibleCount((current) => Math.min(current + pageSize, items.length))

        window.setTimeout(() => {
          loadingRef.current = false
          setIsLoadingMore(false)
        }, 100)
      },
      {
        root: null,
        rootMargin: '300px 0px',
        threshold: 0,
      },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [items.length, pageSize, visibleCount])

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    isLoadingMore,
    loadMoreRef,
  }
}