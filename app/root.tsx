import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import type { Route } from './+types/root'
import stylesheet from './global.css?url'
// import { useSession, signOut } from './lib/auth-client'


export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
         <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
 
      </head>
      <body>
        {children}
        <ScrollRestoration />
        
        <Scripts />
          <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" defer />
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" defer />

      </body>
    </html>
  )
}

export default function App() {
  // const { data: session, isPending } = useSession()

  return (
    <>
    {/* <nav className="navbar navbar-*">
    <div>
        <a className="navbar-brand" href="#">f
            <img src="https://pub-af2fa0bccf8144cc980095caef793c08.r2.dev/website-images/generated-image(5).png" alt="" width="" height="" ></img>
        </a>
    </div>
</nav> */}
<nav className="navbar navbar-expand-lg fixed-top bg-danger-subtle border-bottom border-body">
  
  {/* <img src="https://pub-af2fa0bccf8144cc980095caef793c08.r2.dev/website-images/generated-image(5).png" className="object-fit-xxl-contain border rounded" alt=""></img> */}
  <div className="container-fluid">
    <a className="navbar-brand" href="#">Navbar</a>
     <a className="navbar-brand" href="#">Navbar</a>
    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="true" aria-label="Toggle navigation">
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse" id="navbarSupportedContent">
      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
        <li className="nav-item">
          <a className="nav-link active" aria-current="page" href="#">hello</a>
        </li>
        <li className="nav-item">
          <a className="nav-link" href="#">Link</a>
        </li>
        <li className="nav-item dropdown">
          <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Dropdown
          </a>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="#">Action</a></li>
            <li><a className="dropdown-item" href="#">Another action</a></li>
            <li className="dropdown-divider"></li>
            <li><a className="dropdown-item" href="#">Something else here</a></li>
          </ul>
        </li>
        <li className="nav-item">
          <a className="nav-link disabled" aria-disabled="true">Disabled</a>
        </li>
      </ul>
      <form className="d-flex" role="search">
        <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search"/>
        <button className="btn btn-outline-success" type="submit">Search</button>
      </form>
    </div>
  </div>
</nav>
      <header className="container d-flex px-4 py-8">
        xx
   
        {/* {isPending ? null : session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">{session.user.email}</span>
            <button
              onClick={() => signOut()}
              className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/sign-in"
            className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
          >
            Sign In
          </Link>
        )} */}
    
           {/* <nav>
  <div className="nav nav-tabs" id="nav-tab" role="tablist">
    <button className="nav-link active" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">Home</button>
    <button className="nav-link" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Profile</button>
    <button className="nav-link" id="nav-contact-tab" data-bs-toggle="tab" data-bs-target="#nav-contact" type="button" role="tab" aria-controls="nav-contact" aria-selected="false">Contact</button>
    <button className="nav-link" id="nav-disabled-tab" data-bs-toggle="tab" data-bs-target="#nav-disabled" type="button" role="tab" aria-controls="nav-disabled" aria-selected="false" disabled>Disabled</button>
  </div>
</nav> */}
{/* Vendula Handbag Library */}
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}