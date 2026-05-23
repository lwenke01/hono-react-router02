import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('/collection/:id', 'routes/collection.$id.tsx'),
  route('/wheretobuy', 'routes/buy.tsx'),
  route('/sample', 'routes/sample.tsx'),
  route('/sign-in', 'routes/sign-in.tsx'),
  route('/sign-up', 'routes/sign-up.tsx'),
  //route('/stockists', 'routes/buy.tsx'),
 // route('/stockists/form', 'routes/buy.add.tsx'),
  // Auth required routes (verified on Hono server)
  route('/dashboard', 'routes/dashboard.tsx'),
    route('/admin', 'routes/admin.tsx'),
] satisfies RouteConfig
