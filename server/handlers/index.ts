import { Hono } from 'hono'
import { collectionsDelete, collectionsGet, collectionsPost } from './todo.handler'
import { designsDelete, designsGet, designsPost } from './design.handler'
import { shapesDelete, shapesGet, shapesPost } from './shape.handler'
import {
  vendulaCollectionsGet,
  vendulaCollectionById,
  vendulaCollectionsPost,
  vendulaCollectionsPut,
  vendulaDesignsPost,
  vendulaDesignsPut,
  vendulaShapesGet,
  vendulaShapesPost,
} from './vendula.handler'
import { cors } from 'hono/cors'

const apiHandler = new Hono<HonoENV>()

const _routes = apiHandler
  .get('/check', (c) => {
    return c.json({ status: 'ok' }, 200)
  })
export type RPC = typeof _routes

export const setHandlers = (app: Hono<HonoENV>) => {
  // Better Auth API routes
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    const auth = c.get('auth')
    return auth.handler(c.req.raw)
  })

  // Mount vendula API routes on apiHandler with CORS
  apiHandler.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }))

  apiHandler.get('/collections', vendulaCollectionsGet)
  apiHandler.get('/collections/:id', vendulaCollectionById)
  apiHandler.post('/collections', vendulaCollectionsPost)
  apiHandler.put('/collections/:id', vendulaCollectionsPut)
  apiHandler.post('/designs', vendulaDesignsPost)
  apiHandler.put('/designs/:id', vendulaDesignsPut)
  apiHandler.get('/shapes', vendulaShapesGet)
  apiHandler.post('/shapes', vendulaShapesPost)

  app.route('/api', apiHandler)
  return app
}
