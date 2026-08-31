import { describe, expect, it } from 'vitest'

import { collectGroupProtocols } from '@/components/proxy/proxy-group-meta'
import type { ProxyGroupView, ProxyNodeView } from '@/types/proxy-view'

const capabilities = {
  udp: true,
  xudp: false,
  tfo: false,
  mptcp: false,
  smux: false,
}

const group = (members: ProxyGroupView['members']): ProxyGroupView => ({
  name: 'PROXY',
  type: 'Selector',
  alive: true,
  now: 'Tokyo-01',
  history: [],
  members,
  ...capabilities,
})

const node = (recordId: string, type: string): ProxyNodeView => ({
  recordId,
  name: recordId,
  type,
  alive: true,
  history: [],
  source: { kind: 'core', proxyName: recordId },
  ...capabilities,
})

describe('collectGroupProtocols', () => {
  it('collects unique node types and UDP', () => {
    const records = {
      a: node('a', 'ss'),
      b: node('b', 'vmess'),
      c: node('c', 'ss'),
    }
    expect(
      collectGroupProtocols(
        group([
          { kind: 'node', name: 'a', recordId: 'a' },
          { kind: 'node', name: 'b', recordId: 'b' },
          { kind: 'node', name: 'c', recordId: 'c' },
        ]),
        records,
      ),
    ).toEqual(['ss', 'vmess', 'UDP'])
  })
})
