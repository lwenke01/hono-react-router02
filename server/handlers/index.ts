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

const apiHandler = new Hono<HonoENV>()

const _routes = apiHandler.get('/check', (c) => {
  return c.json({ status: 'ok' }, 200)
})

export type RPC = typeof _routes

export const setHandlers = (app: Hono<HonoENV>) => {
  app.on(['POST', 'GET'], '/api/auth/**', (c) => {
    const auth = c.get('auth')
    return auth.handler(c.req.raw)
  })

  apiHandler.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    })
  )

  apiHandler.get('/collections', ...vendulaCollectionsGet)
  apiHandler.get('/collections/:id', ...vendulaCollectionById)
  apiHandler.post('/collections', ...vendulaCollectionsPost)
  apiHandler.put('/collections/:id', ...vendulaCollectionsPut)

  apiHandler.get('/designs', ...vendulaDesignsGet)
  apiHandler.post('/designs', ...vendulaDesignsPost)
  apiHandler.put('/designs/:id', ...vendulaDesignsPut)

  apiHandler.get('/shapes', ...vendulaShapesGet)
  apiHandler.post('/shapes', ...vendulaShapesPost)

  app.route('/api', apiHandler)
  return app
}