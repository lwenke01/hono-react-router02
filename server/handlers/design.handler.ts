import { createFactory } from 'hono/factory'
import { designInsertSchema } from '../../database/schema/design'

const F = createFactory<HonoENV>()

export const designsGet = F.createHandlers(async (c) => {
  const { designService } = c.get('services')
  const designs = await designService.findAll()
  return c.json(designs)
})

export const designsPost = F.createHandlers(async (c) => {
  const auth = c.get('auth')
  const session = auth ? await auth.api.getSession({ headers: c.req.raw.headers }) : null
  const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  if (admins.length > 0 && !admins.includes(session.user.email)) return c.json({ error: 'Forbidden' }, 403)

  const design = await c.req.json()
  const validated = designInsertSchema.safeParse(design)
  if (!validated.success) return c.json({ error: validated.error }, 400)

  const { designService } = c.get('services')
  const created = await designService.create(validated.data)
  return c.json(created)
})

export const designsDelete = F.createHandlers(async (c) => {
  const auth = c.get('auth')
  const session = auth ? await auth.api.getSession({ headers: c.req.raw.headers }) : null
  const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  if (admins.length > 0 && !admins.includes(session.user.email)) return c.json({ error: 'Forbidden' }, 403)

  const id = Number(c.req.param('id'))
  if (!id && id !== 0) return c.json({ error: 'id is required' }, 400)

  const { designService } = c.get('services')
  const res = await designService.delete(id)
  if (!res) return c.json({ error: 'design not found' }, 404)
  return c.json(res)
})
