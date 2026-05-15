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

  apiHandler.get('/collections', ...vendulaCollectionsGet)
  apiHandler.get('/collections/:id', ...vendulaCollectionById)
  apiHandler.post('/collections', ...vendulaCollectionsPost)
  apiHandler.put('/collections/:id', ...vendulaCollectionsPut)
  apiHandler.delete('/collections/:id', ...collectionsDelete)

  apiHandler.get('/designs', ...designsGet)
  apiHandler.post('/designs', ...vendulaDesignsPost)
  apiHandler.put('/designs/:id', ...vendulaDesignsPut)
  apiHandler.delete('/designs/:id', ...designsDelete)

  apiHandler.get('/shapes', ...vendulaShapesGet)
  apiHandler.post('/shapes', ...vendulaShapesPost)
  apiHandler.delete('/shapes/:id', ...shapesDelete)

  // Quick dev-only admin page: render the admin component directly (protected)
  app.get('/admin', async (c) => {
    const auth = c.get('auth')
    const session = auth ? await auth.api.getSession({ headers: c.req.raw.headers }) : null
    const admins = (c.env.BETTER_AUTH_ADMINS || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    if (!session) {
      return c.redirect('/sign-in')
    }
    if (admins.length > 0 && !admins.includes(session.user.email)) {
      return c.text('Forbidden', 403)
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="/app/global.css"/></head><body><div id="root"></div><script type="module">import React from '/node_modules/react/index.js';import { createRoot } from '/node_modules/react-dom/client.js';import Admin from '/app/routes/admin.tsx';createRoot(document.getElementById('root')).render(React.createElement(Admin));</script></body></html>`
    return c.html(html)
  })

  app.route('/api', apiHandler)
  return app
}
