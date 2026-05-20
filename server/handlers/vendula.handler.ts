import { createFactory } from 'hono/factory'
import { cors } from 'hono/cors'

const F = createFactory()

function safeJson(value: any, fallback: any[] = []) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function formatCollection(row: any) {
  return {
    ...row,
    themes: safeJson(row.themes),
    colours: safeJson(row.colours),
    image_urls: safeJson(row.image_urls),
  }
}

function formatDesign(row: any) {
  return {
    ...row,
    categories: safeJson(row.categories),
    image_urls: safeJson(row.image_urls),
    design_images: safeJson(row.design_images),
  }
}

function parseLimit(raw: string | null) {
  let limit = parseInt(raw || '500', 10)
  if (!Number.isFinite(limit) || limit <= 0) limit = 500
  if (limit > 1000) limit = 1000
  return limit
}

export const vendulaCollectionsGet = F.createHandlers(async (c) => {
  const url = new URL(c.req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const season = (url.searchParams.get('season') || '').trim()
  const limit = parseLimit(url.searchParams.get('limit'))

  const where: string[] = []
  const params: any[] = []

  if (season) {
    where.push('c.season = ?')
    params.push(season)
  }

  if (q) {
    where.push("(LOWER(c.name) LIKE '%' || LOWER(?) || '%' OR LOWER(c.description) LIKE '%' || LOWER(?) || '%')")
    params.push(q, q)
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

  const sql = `
    SELECT c.*,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', d.id,
              'collection_id', d.collection_id,
              'shape_id', d.shape_id,
              'name', d.name,
              'description', d.description,
              'image_urls', d.image_urls,
              'price', d.price,
              'release_year', d.release_year,
              'categories', d.categories,
              'shape_name_overwrite',d.shape_name_overwrite,
              'shape_measurements_overwrite',d.shape_measurements_overwrite,
              'shape_name', s.name,
              'measurements', s.measurements,
              'shape_category', s.category,
               'shape_size', s.size,
               'shape_desc', s.description
            )
          )
          FROM Designs AS d
          LEFT JOIN Shapes AS s ON s.id = d.shape_id
          WHERE d.collection_id = c.id
        ),
        '[]'
      ) AS designs
    FROM Collections AS c
    ${whereClause}
  
    ORDER BY COALESCE(c.release_year, 0) DESC, c.season DESC
    LIMIT ${limit}
  `

  const { results } = await c.env.DB.prepare(sql).all(...params)

  const cleaned = results.map((row: any) => {
    const designs = safeJson(row.designs)
    return {
      ...formatCollection(row),
      designs: designs.map((design: any) => ({
        ...formatDesign(design),
      })),
    }
  })

  return c.json(cleaned)
})

export const vendulaCollectionById = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  const collection = await c.env.DB.prepare(
    'SELECT * FROM Collections WHERE id = ?'
  )
    .bind(id)
    .first()

  if (!collection) return c.json({ error: 'Not found' }, 404)

  const { results: designs } = await c.env.DB.prepare(`
    SELECT D.*,
           S.name as shape_name,
           S.measurements,
           S.category as shape_category
    FROM Designs D
    LEFT JOIN Shapes S ON D.shape_id = S.id
    WHERE D.collection_id = ?
    ORDER BY D.id DESC
  `)
    .bind(id)
    .all()

  return c.json({
    ...formatCollection(collection),
    designs: designs.map(formatDesign),
  })
})

export const vendulaDesignsGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      D.*,
      C.name AS collection_name,
      C.release_year AS collection_year,
      C.season AS collection_season,
      C.series AS collection_series,
      S.name AS shape_name,
      S.measurements,
      S.category AS shape_category
    FROM Designs D
    LEFT JOIN Collections C ON C.id = D.collection_id
    LEFT JOIN Shapes S ON S.id = D.shape_id
   ORDER BY
  COALESCE(C.release_year, C.season, 0) DESC,
  CASE WHEN C.season IS NULL THEN 1 ELSE 0 END,
  C.season DESC,
  D.name ASC;
  `).all()

  return c.json(
    results.map((row: any) => ({
      ...formatDesign(row),
    }))
  )
})

export const vendulaDesignsPost = F.createHandlers(async (c) => {
  const { collection_id, shape_id,description, image_urls, price, release_year, categories,shape_name_overwrite,shape_measurements_overwrite } =
    await c.req.json()

  await c.env.DB.prepare(
    'INSERT INTO Designs (collection_id, shape_id, name, description, image_urls, price, release_year, categories,shape_name_overwrite,shape_measurements_overwrite) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?)'
  )
    .bind(
      collection_id,
      shape_id,
      name,
      description ?? null,
      JSON.stringify(image_urls ?? []),
      price,
      release_year,
      JSON.stringify(categories ?? [])
    )
    .run()

  return c.json({ success: true }, 201)
})

export const vendulaDesignsPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const { collection_id, shape_id, name, description, image_urls, price, release_year, categories,shape_name_overwrite,shape_measurements_overwrite } =
    await c.req.json()

  await c.env.DB.prepare(
    'UPDATE Designs SET collection_id=?, shape_id=?, name=?, description=?, image_urls=?, price=?, release_year=?, categories=?,shape_name_overwrite?,shape_measurements_overwrite WHERE id=?'
  )
    .bind(
      collection_id,
      shape_id,
      name,
      description ?? null,
      JSON.stringify(image_urls ?? []),
      price,
      release_year,
      JSON.stringify(categories ?? []),
      shape_name_overwrite ?? null,
      shape_measurements_overwrite ?? null,

      id
    )
    .run()

  return c.json({ success: true })
})

export const vendulaShapesGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Shapes ORDER BY name DESC').all()
  return c.json(results.map((shape: any) => ({ ...shape, category: safeJson(shape.category) })))
})

export const vendulaShapesPost = F.createHandlers(async (c) => {
  const { name, measurements, category,name_friendly,size,description } = await c.req.json()
  const categoryToStore = Array.isArray(category) ? JSON.stringify(category) : (category ?? '[]')

  await c.env.DB.prepare('INSERT INTO Shapes (name, measurements, category, name_friendly,size,description) VALUES (?, ?, ?,?,?,?)')
    .bind(name, measurements, categoryToStore,name_friendly,size,description)
    .run()

  return c.json({ success: true }, 201)
})

export const vendulaShapesPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const { name, measurements, category,name_friendly,size,description } =
    await c.req.json()

  await c.env.DB.prepare(
    'UPDATE Shapes SET name=?, measurements=?,category=?, name_friendly=?,size=?, description=? WHERE id=?'
  )
    .bind(
      name,
      measurements ?? null,
      JSON.stringify(category ?? []),
      name_friendly ?? null,
      size ?? null,
      description ?? null,
      id
    )
    .run()

  return c.json({ success: true })
})

export const vendulaCollectionsPost = F.createHandlers(async (c) => {
  const body = await c.req.json()
  const {
    name,
    description,
    season,
    series,
    edition,
    release_year,
    themes,
    colours,
    name_friendly,
    type,
    image_urls,
    releaseDate,
    exclusive,
  } = body

  await c.env.DB.prepare(`
    INSERT INTO Collections (
      name, description, season, series, edition, release_year,
      themes, colours, name_friendly, type, image_urls, releaseDate, exclusive
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      name,
      description,
      season,
      series,
      edition,
      release_year,
      JSON.stringify(themes ?? []),
      JSON.stringify(colours ?? []),
      name_friendly,
      type,
      JSON.stringify(image_urls ?? []),
      releaseDate,
      exclusive
    )
    .run()

  return c.json({ success: true }, 201)
})

export const vendulaCollectionsPut = F.createHandlers(async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    name,
    description,
    season,
    series,
    edition,
    release_year,
    themes,
    colours,
    name_friendly,
    type,
    image_urls,
    releaseDate,
    exclusive,
  } = body

  await c.env.DB.prepare(`
    UPDATE Collections SET
      name=?, description=?, season=?, series=?, edition=?, release_year=?,
      themes=?, colours=?, name_friendly=?, type=?, image_urls=?, releaseDate=?, exclusive=?
    WHERE id=?
  `)
    .bind(
      name,
      description,
      season,
      series,
      edition,
      release_year,
      JSON.stringify(themes ?? []),
      JSON.stringify(colours ?? []),
      name_friendly,
      type,
      JSON.stringify(image_urls ?? []),
      releaseDate,
      exclusive,
      id
    )
    .run()

  return c.json({ success: true })
})