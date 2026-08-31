import { describe, expect, it } from 'vitest'

import {
  collectGroupProtocols,
  collectMemberProtocols,
  protocolLabel,
} from '@/components/proxy/proxy-group-meta'
import type {
  ProxyGroupView,
  ProxyNodeView,
  ResolvedProxyMember,
} from '@/types/proxy-view'

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

describe('protocolLabel', () => {
  it('maps short types to display names', () => {
    expect(protocolLabel('ss')).toBe('Shadowsocks')
    expect(protocolLabel('vmess')).toBe('VMess')
    expect(protocolLabel('custom')).toBe('custom')
  })
})

describe('collectMemberProtocols', () => {
  it('returns protocol and UDP chips for a node', () => {
    const member: ResolvedProxyMember = {
      kind: 'node',
      ref: { kind: 'node', name: 'Tokyo-01', recordId: 'a' },
      node: node('a', 'ss'),
    }
    expect(collectMemberProtocols(member)).toEqual(['Shadowsocks', 'UDP'])
  })
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
