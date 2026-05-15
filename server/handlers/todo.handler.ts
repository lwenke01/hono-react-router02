import { createFactory } from 'hono/factory'
import { collectionInsertSchema } from '../../database/schema/collection'

const F = createFactory<HonoENV>()

export const collectionsGet = F.createHandlers(async (c) => {
  const { collectionService } = c.get('services')
  const collections = await collectionService.findAll()
  return c.json(collections)
})

export const collectionsPost = F.createHandlers(async (c) => {
  const collection = await c.req.json()
  const validatedCollection = collectionInsertSchema.safeParse(collection)
  if (!validatedCollection.success) {
    return c.json({ error: validatedCollection.error }, 400)
  }

  const { collectionService } = c.get('services')
  const collections = await collectionService.create(validatedCollection.data)
  return c.json(collections)
})

export const collectionsDelete = F.createHandlers(async (c) => {
  const id = Number(c.req.param('id'))
  if (!id && id !== 0) {
    return c.json({ error: 'id is required' }, 400)
  }

  const { collectionService } = c.get('services')
  const collections = await collectionService.delete(id)
  if (!collections) {
    return c.json({ error: 'collection not found' }, 404)
  }
  return c.json(collections)
})
