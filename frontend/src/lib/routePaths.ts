/** Recover GitHub Pages' 404 redirect without treating its query as a route. */
export function recoverStaticRoute(pathname: string, search: string, base: string) {
  const redirected = new URLSearchParams(search).get('p')
  let path = pathname,
    restoredUrl: string | undefined
  if (redirected) {
    const clean = '/' + redirected.replace(/^\/+/, '')
    const target = new URL(`${base}${clean}`, 'https://atlas.invalid')
    if (base && target.pathname !== base && !target.pathname.startsWith(base + '/')) {
      target.pathname = base + '/not-found'
      target.search = ''
    }
    path = target.pathname
    restoredUrl = target.pathname + target.search + target.hash
  }
  if (base && (path === base || path.startsWith(base + '/'))) path = path.slice(base.length)
  return { route: path.startsWith('/') ? path : `/${path}`, restoredUrl }
}
