import { createFactory } from 'hono/factory'
import { shapeInsertSchema } from '../../database/schema/shape'

const F = createFactory<HonoENV>()

export const shapesGet = F.createHandlers(async (c) => {
  const { shapeService } = c.get('services')
  const shapes = await shapeService.findAll()
  return c.json(shapes)
})

export const shapesPost = F.createHandlers(async (c) => {
  const auth = c.get('auth')
  const session = auth ? await auth.api.getSession({ headers: c.req.raw.headers }) : null
  const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  if (admins.length > 0 && !admins.includes(session.user.email)) return c.json({ error: 'Forbidden' }, 403)

  const shape = await c.req.json()
  const validated = shapeInsertSchema.safeParse(shape)
  if (!validated.success) return c.json({ error: validated.error }, 400)

  const { shapeService } = c.get('services')
  const created = await shapeService.create(validated.data)
  return c.json(created)
})

export const shapesDelete = F.createHandlers(async (c) => {
  const auth = c.get('auth')
  const session = auth ? await auth.api.getSession({ headers: c.req.raw.headers }) : null
  const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  if (admins.length > 0 && !admins.includes(session.user.email)) return c.json({ error: 'Forbidden' }, 403)

  const id = Number(c.req.param('id'))
  if (!id && id !== 0) return c.json({ error: 'id is required' }, 400)

  const { shapeService } = c.get('services')
  const res = await shapeService.delete(id)
  if (!res) return c.json({ error: 'shape not found' }, 404)
  return c.json(res)
})
