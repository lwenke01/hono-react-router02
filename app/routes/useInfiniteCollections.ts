import { useEffect, useRef, useState } from 'react'

export function useInfiniteCollections<T>(items: T[], pageSize = 50) {
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(pageSize)
  }, [items, pageSize])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || visibleCount >= items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        if (isLoadingMore) return

        setIsLoadingMore(true)
        setVisibleCount((current) => Math.min(current + pageSize, items.length))

        window.setTimeout(() => {
          setIsLoadingMore(false)
        }, 150)
      },
      { root: null, rootMargin: '300px 0px', threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [items.length, pageSize, visibleCount, isLoadingMore])

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: visibleCount < items.length,
    isLoadingMore,
    loadMoreRef,
  }
}