import {
  memberDetails,
  type ProxyGroupView,
  type ProxyNodeView,
  type ResolvedProxyMember,
} from '@/types/proxy-view'

const PROTOCOL_LABELS: Record<string, string> = {
  ss: 'Shadowsocks',
  ssr: 'ShadowsocksR',
  vmess: 'VMess',
  vless: 'VLESS',
  trojan: 'Trojan',
  hysteria: 'Hysteria',
  hysteria2: 'Hysteria2',
  tuic: 'TUIC',
  wireguard: 'WireGuard',
  socks: 'SOCKS',
  http: 'HTTP',
}

export const protocolLabel = (type: string): string =>
  PROTOCOL_LABELS[type.toLowerCase()] ?? type

export const collectMemberProtocols = (
  member: ResolvedProxyMember,
): string[] => {
  const details = memberDetails(member)
  if (!details?.type) return []
  const chips = [protocolLabel(details.type)]
  if (details.udp) chips.push('UDP')
  return chips
}

export const collectGroupProtocols = (
  group: ProxyGroupView,
  records: Record<string, ProxyNodeView>,
): string[] => {
  const types = new Set<string>()
  for (const member of group.members) {
    if (member.kind === 'node') {
      const record = records[member.recordId]
      if (record?.type) types.add(record.type)
    }
  }
  if (group.udp) types.add('UDP')
  return [...types]
}
