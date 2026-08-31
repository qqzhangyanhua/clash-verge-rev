import type { ProxyGroupView, ProxyNodeView } from '@/types/proxy-view'

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
