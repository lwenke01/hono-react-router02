export async function migrateDesignImages(env: Env) {
  const rows = await env.DB.prepare(
    'SELECT id, image_urls FROM designs WHERE image_urls IS NOT NULL AND image_urls != ?'
  )
    .bind('[]')
    .all()

  const results: Array<
    | { id: number; ok: true; url: string; key: string }
    | { id: number; ok: false; url?: string; error: string }
  > = []

  for (const row of rows.results ?? []) {
    let urls: string[] = []

    try {
      urls = JSON.parse(row.image_urls || '[]')
    } catch {
      results.push({ id: row.id as number, ok: false, error: 'invalid_json' })
      continue
    }

    const keys: string[] = []

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      if (!url) continue

      try {
        const res = await fetch(url)
        if (!res.ok) {
          results.push({
            id: row.id as number,
            ok: false,
            url,
            error: `fetch_${res.status}`,
          })
          continue
        }

        const contentType = res.headers.get('content-type') || 'application/octet-stream'
        const ext = contentType.includes('png')
          ? 'png'
          : contentType.includes('webp')
            ? 'webp'
            : contentType.includes('gif')
              ? 'gif'
              : contentType.includes('avif')
                ? 'avif'
                : 'jpg'

        const key = `imports/designs/${row.id}/${i}-${crypto.randomUUID()}.${ext}`

        await env.R2.put(key, await res.arrayBuffer(), {
          httpMetadata: { contentType },
        })

        keys.push(key)
        results.push({
          id: row.id as number,
          ok: true,
          url,
          key,
        })
      } catch (error) {
        results.push({
          id: row.id as number,
          ok: false,
          url,
          error: String(error),
        })
      }
    }

    await env.DB.prepare(
      'UPDATE designs SET image_keys = ?, primary_image_key = ? WHERE id = ?'
    )
      .bind(JSON.stringify(keys), keys[0] || null, row.id)
      .run()
  }

  return results
}