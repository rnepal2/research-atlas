import test from 'node:test'
import assert from 'node:assert/strict'
import { recoverStaticRoute } from '../src/lib/routePaths.ts'

test('GitHub Pages paper deep links retain filters and snapshot but route by pathname', () => {
  const path = '/explore?paper=W123&snapshot=1234567890abcdef&camera=%7B%22x%22%3A0.5%7D'
  const result = recoverStaticRoute('/research-atlas/', '?p=' + encodeURIComponent(path), '/research-atlas')
  assert.equal(result.route, '/explore')
  assert.equal(result.restoredUrl, '/research-atlas' + path)
})
test('normal, root and similarly prefixed routes are handled without accidental stripping', () => {
  assert.equal(recoverStaticRoute('/research-atlas/', '', '/research-atlas').route, '/')
  assert.equal(
    recoverStaticRoute('/research-atlas/connections', '?kind=authors', '/research-atlas').route,
    '/connections',
  )
  assert.equal(
    recoverStaticRoute('/research-atlas-other', '', '/research-atlas').route,
    '/research-atlas-other',
  )
})
test('redirect recovery cannot turn into an external URL or escape the mount', () => {
  assert.equal(
    recoverStaticRoute(
      '/research-atlas/',
      '?p=' + encodeURIComponent('//example.com/explore'),
      '/research-atlas',
    ).restoredUrl,
    '/research-atlas/example.com/explore',
  )
  assert.equal(
    recoverStaticRoute('/research-atlas/', '?p=' + encodeURIComponent('/../../explore'), '/research-atlas')
      .route,
    '/not-found',
  )
})
