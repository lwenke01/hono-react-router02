import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  vendulaCollectionsGet,
  vendulaCollectionById,
  vendulaCollectionsPost,
  vendulaCollectionsPut,
  vendulaDesignsGet,
  vendulaDesignsPost,
  vendulaDesignsPut,
  vendulaShapesGet,
  vendulaShapesPost,
} from './vendula.handler'
import { migrateDesignImages } from './migrate_design_images'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  DEV: string
  BETTER_AUTH_URL: string
}

const apiHandler = new Hono<{ Bindings: Bindings }>()

apiHandler.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

const _routes = apiHandler.get('/check', (c) => {
  return c.json({ status: 'ok' }, 200)
})

export type RPC = typeof _routes

export const setHandlers = (app: Hono) => {
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    const auth = c.get('auth')
    return auth.handler(c.req.raw)
  })

  apiHandler.get('/collections', ...vendulaCollectionsGet)
  apiHandler.get('/collections/:id', ...vendulaCollectionById)
  apiHandler.post('/collections', ...vendulaCollectionsPost)
  apiHandler.put('/collections/:id', ...vendulaCollectionsPut)

  apiHandler.get('/designs', ...vendulaDesignsGet)
  apiHandler.post('/designs', ...vendulaDesignsPost)
  apiHandler.put('/designs/:id', ...vendulaDesignsPut)

  apiHandler.get('/shapes', ...vendulaShapesGet)
  apiHandler.post('/shapes', ...vendulaShapesPost)

  apiHandler.get('/health', (c) => c.json({ ok: true }))

  apiHandler.post('/images/migrate', async (c) => {
    const results = await migrateDesignImages(c.env.R2)
    return c.json({
      ok: true,
      count: results.length,
      results,
    })
  })

  app.route('/api', apiHandler)
}

