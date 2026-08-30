import {
  resolveMember,
  selectGlobalChainNodes,
  selectRuleChainMembers,
  type ProxyGroupView,
  type ProxyViewV1,
  type ResolvedProxyMember,
} from '@/types/proxy-view'

import { filterSort } from './use-filter-sort'
import { DEFAULT_STATE, type HeadState } from './use-head-state'

export interface ResolvedMemberOccurrence {
  memberIndex: number
  member: ResolvedProxyMember
}

export interface IRenderItem {
  type: 0 | 1 | 2 | 3 | 4
  key: string
  group: ProxyGroupView
  member?: ResolvedMemberOccurrence
  memberCol?: ResolvedMemberOccurrence[]
  col?: number
  headState?: HeadState
  icon?: string
  testUrl?: string
}

export type BuildRenderListInput = {
  view: ProxyViewV1
  mode: string
  col: number
  isChainMode?: boolean
  selectedGroup?: string | null
  headStates?: Record<string, HeadState>
  latencyTimeout?: number
  runtimeConfigReady?: boolean
  runtimeProxies?: unknown
}

/**
 * Whether the list about to be drawn contains anything a user would call content.
 *
 * Derived from the list itself rather than predicted beside it. The prediction that used to
 * live in the empty-state model asked a different question in chain mode — whether any
 * Selector or URLTest group existed — which is unrelated to what the chain list is actually
 * built from, so both a false "empty" and a false "not empty" were reachable.
 *
 * A group header alone counts only when the group is visible; every other row is content by
 * definition, including the members of a group that is hidden but expanded.
 */
export const hasRenderableItems = (
  renderList: readonly IRenderItem[],
): boolean => renderList.some((item) => item.type !== 0 || !item.group.hidden)

export const CHAIN_DELAY_GROUP = 'chain-mode'

const resolveOccurrences = (view: ProxyViewV1, group: ProxyGroupView) =>
  group.members.map((member, memberIndex) => ({
    memberIndex,
    member: resolveMember(view, member),
  }))

const memberKey = (
  group: ProxyGroupView,
  occurrence: ResolvedMemberOccurrence,
) => {
  const { memberIndex, member } = occurrence
  const identity =
    member.kind === 'node' ? member.node.recordId : member.ref.name
  return `${group.name}:${memberIndex}:${identity}`
}

const groupOccurrences = <T>(list: T[], size: number): T[][] =>
  list.reduce<T[][]>((acc, item) => {
    const lastGroup = acc[acc.length - 1]
    if (!lastGroup || lastGroup.length >= size) acc.push([item])
    else lastGroup.push(item)
    return acc
  }, [])

const virtualGroup = (members: ProxyGroupView['members']): ProxyGroupView => ({
  name: CHAIN_DELAY_GROUP,
  type: 'Selector',
  alive: true,
  udp: false,
  xudp: false,
  tfo: false,
  mptcp: false,
  smux: false,
  history: [],
  members,
})

const memberRows = (
  group: ProxyGroupView,
  occurrences: ResolvedMemberOccurrence[],
  headState: HeadState,
  col: number,
): IRenderItem[] => {
  if (occurrences.length === 0) {
    return [{ type: 3, key: `empty-${group.name}`, group, headState }]
  }
  if (col > 1) {
    return groupOccurrences(occurrences, col).map((memberCol) => ({
      type: 4 as const,
      key: `col:${memberKey(group, memberCol[0])}`,
      group,
      headState,
      col,
      memberCol,
    }))
  }
  return occurrences.map((member) => ({
    type: 2 as const,
    key: memberKey(group, member),
    group,
    member,
    headState,
  }))
}

export const chainOccurrencesOf = (
  view: ProxyViewV1,
  mode: string,
  selectedGroup: string | null,
  runtimeConfigReady: boolean,
  runtimeProxies: unknown,
): ResolvedMemberOccurrence[] => {
  if (mode === 'rule' && selectedGroup) {
    return selectRuleChainMembers(view, selectedGroup)
  }
  if (!runtimeConfigReady) return []
  return selectGlobalChainNodes(view, runtimeProxies).map(
    (node, memberIndex) => ({
      memberIndex,
      member: {
        kind: 'node' as const,
        ref: {
          kind: 'node' as const,
          name: node.name,
          recordId: node.recordId,
        },
        node,
      },
    }),
  )
}

export function buildRenderList({
  view,
  mode,
  col,
  isChainMode = false,
  selectedGroup = null,
  headStates = {},
  latencyTimeout,
  runtimeConfigReady = false,
  runtimeProxies,
}: BuildRenderListInput): IRenderItem[] {
  if (isChainMode) {
    const selected =
      mode === 'rule'
        ? view.groups.find(({ name }) => name === selectedGroup)
        : undefined
    const group = selected ?? virtualGroup([])
    const occurrences = filterSort(
      chainOccurrencesOf(
        view,
        mode,
        selectedGroup,
        runtimeConfigReady,
        runtimeProxies,
      ),
      selected?.name ?? CHAIN_DELAY_GROUP,
      '',
      0,
      latencyTimeout,
    )
    if (col > 1) {
      return groupOccurrences(occurrences, col).map((memberCol) => ({
        type: 4,
        key: `chain-col:${memberKey(group, memberCol[0])}`,
        group,
        headState: DEFAULT_STATE,
        col,
        memberCol,
      }))
    }
    return occurrences.map((member) => ({
      type: 2,
      key: `chain:${memberKey(group, member)}`,
      group,
      member,
      headState: DEFAULT_STATE,
    }))
  }

  if (mode === 'direct') return []

  const useRule = mode === 'rule' || mode === 'script'
  const renderGroups = useRule
    ? view.groups
    : view.global === null
      ? []
      : [view.global]

  const retList = renderGroups.flatMap((group) => {
    const headState = headStates[group.name] || DEFAULT_STATE
    const ret: IRenderItem[] = [
      {
        type: 0,
        key: group.name,
        group,
        headState,
        icon: group.icon,
        testUrl: group.testUrl,
      },
    ]

    if (headState.open || !useRule) {
      const occurrences = filterSort(
        resolveOccurrences(view, group),
        group.name,
        headState.filterText,
        headState.sortType,
        latencyTimeout,
        {
          matchCase: headState.filterMatchCase,
          matchWholeWord: headState.filterMatchWholeWord,
          useRegularExpression: headState.filterUseRegularExpression,
        },
      )
      if (!useRule) {
        ret.push({ type: 1, key: `head-${group.name}`, group, headState })
      }
      ret.push(...memberRows(group, occurrences, headState, col))
    }

    return ret
  })

  return !useRule
    ? retList.slice(1)
    : retList.filter((item) => !item.group.hidden)
}
