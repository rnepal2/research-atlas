import test from 'node:test'
import assert from 'node:assert/strict'
import { sharedConnections } from '../src/lib/connections.ts'

test('connections retain exact shared work IDs, deduplicate and rank by shared count', () => {
  const hub = { id: 'A1', name: 'One', works: ['W1', 'W2'], citations: 10 }
  const peers = [
    hub,
    { id: 'A2', name: 'Two', works: ['W1', 'W1'], citations: 100 },
    { id: 'A3', name: 'Three', works: ['W1', 'W2', 'W3'], citations: 1 },
    { id: 'A4', name: 'Other', works: ['W4'], citations: 1000 },
  ]
  const result = sharedConnections(hub, peers, 1)
  assert.equal(result.total, 2)
  assert.equal(result.neighbors[0].id, 'A3')
  assert.deepEqual(result.neighbors[0].sharedWorks, ['W1', 'W2'])
  assert.equal(sharedConnections(undefined, peers).total, 0)
})
