import { createFactory } from 'hono/factory'
import { cors } from 'hono/cors'
import { collectionInsertSchema } from '../../database/schema/collection'
import { designInsertSchema } from '../../database/schema/design'
import { shapeInsertSchema } from '../../database/schema/shape'

const F = createFactory<HonoENV>()

function safeJson(value: any, fallback: any[] = []) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

async function ensureAdmin(c: any) {
  const auth = c.get('auth')
  if (!auth) return { ok: false, error: { status: 401, body: { error: 'Unauthorized' } } }
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return { ok: false, error: { status: 401, body: { error: 'Unauthorized' } } }
  const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (admins.length > 0 && !admins.includes(session.user.email)) {
    return { ok: false, error: { status: 403, body: { error: 'Forbidden' } } }
  }
  return { ok: true, session }
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

export const vendulaCollectionsGet = F.createHandlers(async (c) => {
  // Support query params: q (search), season, limit
  const url = new URL(c.req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const season = (url.searchParams.get('season') || '').trim()
  let limit = parseInt(url.searchParams.get('limit') || '5', 10)
  if (!Number.isFinite(limit) || limit <= 0) limit = 5
  if (limit > 100) limit = 100

  // Build SQL with optional WHERE clauses and bound params
  const where: string[] = []
  const params: any[] = []

  if (season) {
    where.push('c.season = ?')
    params.push(season)
  }

  if (q) {
    // search in name and description (case-insensitive)
    where.push("(LOWER(c.name) LIKE '%' || LOWER(?) || '%' OR LOWER(c.description) LIKE '%' || LOWER(?) || '%')")
    params.push(q, q)
  }

  const whereClause = where.length > 0 ? ('WHERE ' + where.join(' AND ')) : ''

  const sql = `
    SELECT c.*,
      COALESCE(
        (
          SELECT json_group_array(
            json_object(
              'id', d.id,
              'name', d.name,
              'shape_id', d.shape_id,
              'shape_name', s.name,
              'design_images', d.image_urls,
              'price', d.price,
              'measurements', s.measurements
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
    ORDER BY c.id DESC
    LIMIT ${limit}
  `

  // Execute query; params contains only season/q bindings (limit injected directly)
  const { results } = await c.env.DB.prepare(sql).all(...params)

  const cleaned = results.map((row: any) => {
    const designs = safeJson(row.designs)

    return {
      ...formatCollection(row),
      designs: designs.map((design: any) => ({
        ...design,
        design_images: safeJson(design.design_images),
      })),
    }
  })

  return c.json(cleaned)
})

export const vendulaCollectionById = F.createHandlers(async (c) => {
  const id = c.req.param('id')

  const collection = await c.env.DB.prepare('SELECT * FROM Collections WHERE id = ?').bind(id).first()
  if (!collection) return c.json({ error: 'Not found' }, 404)

  const { results: designs } = await c.env.DB.prepare(`
    SELECT D.*, S.name as shape_name, S.measurements, S.category as shape_category
    FROM Designs D
    LEFT JOIN Shapes S ON D.shape_id = S.id
    WHERE D.collection_id = ?
    ORDER BY D.id DESC
  `).bind(id).all()

  return c.json({
    ...formatCollection(collection),
    designs: designs.map(formatDesign),
  })
})

export const vendulaDesignsPost = F.createHandlers(async (c) => {
  // require admin
  const authCheck = await ensureAdmin(c)
  if (!authCheck.ok) return c.json(authCheck.error.body, authCheck.error.status)

  const body = await c.req.json()
  const validated = designInsertSchema.safeParse({
    collectionId: body.collection_id ?? body.collectionId,
    shapeId: body.shape_id ?? body.shapeId,
    name: body.name,
    imageUrls: JSON.stringify(body.image_urls ?? body.imageUrls ?? []),
    price: body.price,
    releaseYear: body.release_year ?? body.releaseYear,
    categories: JSON.stringify(body.categories ?? []),
  })

  if (!validated.success) return c.json({ error: validated.error }, 400)

  await c.env.DB.prepare(
    'INSERT INTO Designs (collection_id, shape_id, name, image_urls, price, release_year, categories) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    validated.data.collectionId,
    validated.data.shapeId,
    validated.data.name,
    validated.data.imageUrls,
    validated.data.price,
    validated.data.releaseYear,
    validated.data.categories
  ).run()

  return c.json({ success: true }, 201)
})

export const vendulaDesignsPut = F.createHandlers(async (c) => {
  const authCheck = await ensureAdmin(c)
  if (!authCheck.ok) return c.json(authCheck.error.body, authCheck.error.status)

  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = designInsertSchema.safeParse({
    collectionId: body.collection_id ?? body.collectionId,
    shapeId: body.shape_id ?? body.shapeId,
    name: body.name,
    imageUrls: JSON.stringify(body.image_urls ?? body.imageUrls ?? []),
    price: body.price,
    releaseYear: body.release_year ?? body.releaseYear,
    categories: JSON.stringify(body.categories ?? []),
  })

  if (!validated.success) return c.json({ error: validated.error }, 400)

  await c.env.DB.prepare(
    'UPDATE Designs SET collection_id=?, shape_id=?, name=?, image_urls=?, price=?, release_year=?, categories=? WHERE id=?'
  ).bind(
    validated.data.collectionId,
    validated.data.shapeId,
    validated.data.name,
    validated.data.imageUrls,
    validated.data.price,
    validated.data.releaseYear,
    validated.data.categories,
    id
  ).run()

  return c.json({ success: true })
})

export const vendulaShapesGet = F.createHandlers(async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM Shapes ORDER BY id DESC').all()
  return c.json(results.map((shape: any) => ({ ...shape, category: safeJson(shape.category) })))
})

export const vendulaShapesPost = F.createHandlers(async (c) => {
  const authCheck = await ensureAdmin(c)
  if (!authCheck.ok) return c.json(authCheck.error.body, authCheck.error.status)

  const body = await c.req.json()
  const validated = shapeInsertSchema.safeParse({
    name: body.name,
    measurements: body.measurements,
    category: JSON.stringify(body.category ?? []),
  })

  if (!validated.success) return c.json({ error: validated.error }, 400)

  await c.env.DB.prepare('INSERT INTO Shapes (name, measurements, category) VALUES (?, ?, ?)').bind(
    validated.data.name,
    validated.data.measurements,
    validated.data.category
  ).run()
  return c.json({ success: true }, 201)
})

export const vendulaCollectionsPost = F.createHandlers(async (c) => {
  const authCheck = await ensureAdmin(c)
  if (!authCheck.ok) return c.json(authCheck.error.body, authCheck.error.status)

  const body = await c.req.json()
  const validated = collectionInsertSchema.safeParse({
    name: body.name,
    description: body.description,
    season: body.season,
    series: body.series,
    edition: body.edition,
    release_year: body.release_year,
    themes: JSON.stringify(body.themes ?? []),
    colours: JSON.stringify(body.colours ?? []),
    name_friendly: body.name_friendly,
    type: body.type,
    image_urls: JSON.stringify(body.image_urls ?? []),
    releaseDate: body.releaseDate,
    exclusive: body.exclusive,
  })

  if (!validated.success) return c.json({ error: validated.error }, 400)

  await c.env.DB.prepare(`
    INSERT INTO Collections (name, description, season, series, edition, release_year, themes, colours, name_friendly, type, image_urls, releaseDate, exclusive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    validated.data.name,
    validated.data.description,
    validated.data.season,
    validated.data.series,
    validated.data.edition,
    validated.data.release_year,
    validated.data.themes,
    validated.data.colours,
    validated.data.name_friendly,
    validated.data.type,
    validated.data.image_urls,
    validated.data.releaseDate,
    validated.data.exclusive
  ).run()

  return c.json({ success: true }, 201)
})

export const vendulaCollectionsPut = F.createHandlers(async (c) => {
  const authCheck = await ensureAdmin(c)
  if (!authCheck.ok) return c.json(authCheck.error.body, authCheck.error.status)

  const id = c.req.param('id')
  const body = await c.req.json()
  const validated = collectionInsertSchema.safeParse({
    name: body.name,
    description: body.description,
    season: body.season,
    series: body.series,
    edition: body.edition,
    release_year: body.release_year,
    themes: JSON.stringify(body.themes ?? []),
    colours: JSON.stringify(body.colours ?? []),
    name_friendly: body.name_friendly,
    type: body.type,
    image_urls: JSON.stringify(body.image_urls ?? []),
    releaseDate: body.releaseDate,
    exclusive: body.exclusive,
  })

  if (!validated.success) return c.json({ error: validated.error }, 400)

  await c.env.DB.prepare(`
    UPDATE Collections SET
      name=?, description=?, season=?, series=?, edition=?, release_year=?, themes=?, colours=?, name_friendly=?, type=?, image_urls=?, releaseDate=?, exclusive=?
    WHERE id=?
  `).bind(
    validated.data.name,
    validated.data.description,
    validated.data.season,
    validated.data.series,
    validated.data.edition,
    validated.data.release_year,
    validated.data.themes,
    validated.data.colours,
    validated.data.name_friendly,
    validated.data.type,
    validated.data.image_urls,
    validated.data.releaseDate,
    validated.data.exclusive,
    id
  ).run()

  return c.json({ success: true })
})
