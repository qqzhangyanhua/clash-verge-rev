import type { ProxySortType } from '@/components/proxy/use-filter-sort'
import {
  findCurrentGroupMember,
  getRecord,
  isInteractableMember,
  resolveMember,
  type InteractableProxyMemberOccurrence,
  type ProxyGroupView,
  type ProxyViewV1,
  type ResolvedProxyMember,
} from '@/types/proxy-view'
import {
  classifyDelay,
  compareByDelay,
  DEFAULT_DELAY_TIMEOUT,
} from '@/utils/delay'

const EMPTY_DISPLAY = '—'

export type DelayTone = 'success' | 'primary' | 'warning' | 'error' | 'neutral'

type HeaderDelay =
  | { kind: 'empty'; text: '—'; tone: 'neutral' }
  | {
      kind: 'measured'
      text: `${number}ms`
      tone: Exclude<DelayTone, 'error' | 'neutral'>
    }
  | { kind: 'failure'; text: 'Timeout' | 'Error'; tone: 'error' }

export type CardRow = {
  label: string
  value: string
  tappable: boolean
}

type CurrentProxyCardView = {
  headerTitle: string
  nodeName: string
  delay: HeaderDelay
  groupRow: CardRow
  proxyRow: CardRow
  openPicker: 'group' | 'proxy' | null
}

export type ClashProxyMode = 'rule' | 'global' | 'direct'

export type CurrentProxyCardLabels = {
  headerTitle: string
  groupLabel: string
  proxyLabel: string
}

export type GroupPickerOption = {
  name: string
  selected: boolean
}

type ProxyPinKind = 'solid' | 'hollow'

export type ProxyPickerOption = {
  memberIndex: number
  value: string
  name: string
  disabled: boolean
  delay: number
  pin: ProxyPinKind | null
  selected: boolean
}

export type CurrentProxyCardInput = {
  mode: ClashProxyMode
  proxyView: ProxyViewV1 | null
  isLoading: boolean
  selectedGroupName: string
  sortType: ProxySortType
  openPicker: 'group' | 'proxy' | null
  delayOf: (member: ResolvedProxyMember) => number
  lastMeasuredDelay: number | null
  latencyTimeout?: number
  labels: CurrentProxyCardLabels
}

export type CurrentProxyCardModel = {
  view: CurrentProxyCardView
  groupOptions: GroupPickerOption[]
  proxyOptions: ProxyPickerOption[]
  selectedGroup: ProxyGroupView | null
  currentMember: ResolvedProxyMember | null
}

const emptyDelay = (): HeaderDelay => ({
  kind: 'empty',
  text: EMPTY_DISPLAY,
  tone: 'neutral',
})

const emptyRow = (label: string): CardRow => ({
  label,
  value: EMPTY_DISPLAY,
  tappable: false,
})

const proxyOptionValue = (memberIndex: number, member: ResolvedProxyMember) =>
  `${memberIndex}:${
    member.kind === 'node' ? member.node.recordId : member.ref.name
  }`

export const delayToneColor = (tone: DelayTone): string => {
  switch (tone) {
    case 'success':
      return 'success.main'
    case 'primary':
      return 'primary.main'
    case 'warning':
      return 'warning.main'
    case 'error':
      return 'error.main'
    case 'neutral':
      return 'text.secondary'
  }
}

export const nextProxySortType = (sortType: ProxySortType): ProxySortType =>
  ((sortType + 1) % 3) as ProxySortType

export const rememberMeasuredDelay = (
  currentKey: string,
  previousKey: string,
  previousDelay: number | null,
  delay: number,
  timeout: number = DEFAULT_DELAY_TIMEOUT,
): number | null => {
  const measured = classifyDelay(delay, timeout) === 'measured' ? delay : null
  if (currentKey !== previousKey) return measured
  return measured ?? previousDelay
}

export function listSelectableGroups(
  proxyView: ProxyViewV1 | null,
): ProxyGroupView[] {
  if (!proxyView) return []
  return proxyView.groups.filter(
    (group) =>
      !group.hidden && (group.type === 'Selector' || group.type === 'URLTest'),
  )
}

const measuredTone = (
  delay: number,
): Exclude<DelayTone, 'error' | 'neutral'> => {
  if (delay < 250) return 'success'
  if (delay < 400) return 'primary'
  return 'warning'
}

function mapHeaderDelay(
  delay: number,
  lastMeasuredDelay: number | null,
  timeout: number = DEFAULT_DELAY_TIMEOUT,
): HeaderDelay {
  const state = classifyDelay(delay, timeout)

  if (state === 'testing') {
    if (
      lastMeasuredDelay != null &&
      classifyDelay(lastMeasuredDelay, timeout) === 'measured'
    ) {
      return {
        kind: 'measured',
        text: `${lastMeasuredDelay}ms`,
        tone: measuredTone(lastMeasuredDelay),
      }
    }
    return emptyDelay()
  }

  if (state === 'untested') return emptyDelay()
  if (state === 'timeout') {
    return { kind: 'failure', text: 'Timeout', tone: 'error' }
  }
  if (state === 'error') {
    return { kind: 'failure', text: 'Error', tone: 'error' }
  }

  return {
    kind: 'measured',
    text: `${delay}ms`,
    tone: measuredTone(delay),
  }
}

export function resolveCardSelection(
  mode: ClashProxyMode,
  proxyView: ProxyViewV1 | null,
  selectedGroupName: string,
): {
  selectedGroup: ProxyGroupView | null
  currentMember: ResolvedProxyMember | null
  currentOccurrence: InteractableProxyMemberOccurrence | undefined
} {
  const selectableGroups = listSelectableGroups(proxyView)
  const selectedGroup = resolveSelectedGroup(
    proxyView,
    mode,
    selectedGroupName,
    selectableGroups,
  )
  const currentOccurrence =
    proxyView == null
      ? undefined
      : resolveCurrentMember(proxyView, mode, selectedGroup)

  return {
    selectedGroup,
    currentMember: currentOccurrence?.member ?? null,
    currentOccurrence,
  }
}

const resolveSelectedGroup = (
  proxyView: ProxyViewV1 | null,
  mode: ClashProxyMode,
  selectedGroupName: string,
  selectableGroups: ProxyGroupView[],
): ProxyGroupView | null => {
  if (!proxyView || mode === 'direct') return null
  if (mode === 'global') return proxyView.global
  return selectableGroups.find(({ name }) => name === selectedGroupName) ?? null
}

const resolveCurrentMember = (
  proxyView: ProxyViewV1,
  mode: ClashProxyMode,
  selectedGroup: ProxyGroupView | null,
): InteractableProxyMemberOccurrence | undefined => {
  if (mode === 'direct') {
    if (proxyView.direct == null) return undefined
    const node = getRecord(proxyView, proxyView.direct)
    if (!node) return undefined
    return {
      memberIndex: 0,
      member: {
        kind: 'node',
        ref: { kind: 'node', name: node.name, recordId: node.recordId },
        node,
      },
    }
  }

  return selectedGroup
    ? findCurrentGroupMember(proxyView, selectedGroup)
    : undefined
}

const sortProxyOptions = (
  options: ProxyPickerOption[],
  sortType: ProxySortType,
  timeout: number,
): ProxyPickerOption[] => {
  if (sortType === 0) return options
  if (sortType === 2) {
    return [...options].sort((a, b) => a.name.localeCompare(b.name))
  }

  return [...options].sort((a, b) => {
    const byDelay = compareByDelay(a.delay, b.delay, timeout)
    return byDelay || a.name.localeCompare(b.name)
  })
}

const buildProxyOptions = (
  proxyView: ProxyViewV1,
  group: ProxyGroupView,
  currentOccurrence: InteractableProxyMemberOccurrence | undefined,
  delayOf: (member: ResolvedProxyMember) => number,
  sortType: ProxySortType,
  timeout: number,
): ProxyPickerOption[] => {
  const currentValue = currentOccurrence
    ? proxyOptionValue(currentOccurrence.memberIndex, currentOccurrence.member)
    : ''
  const fixed = group.fixed

  const options = group.members.map((memberRef, memberIndex) => {
    const member = resolveMember(proxyView, memberRef)
    const name = member.ref.name
    const value = proxyOptionValue(memberIndex, member)
    const selected = value === currentValue
    const disabled = !isInteractableMember(member)
    const pin: ProxyPinKind | null =
      fixed === name ? (selected ? 'solid' : 'hollow') : null

    return {
      memberIndex,
      value,
      name,
      disabled,
      delay: disabled ? -1 : delayOf(member),
      pin,
      selected,
    }
  })

  return sortProxyOptions(options, sortType, timeout)
}

const effectiveTimeout = (latencyTimeout?: number) =>
  typeof latencyTimeout === 'number' && latencyTimeout > 0
    ? latencyTimeout
    : DEFAULT_DELAY_TIMEOUT

export function buildCurrentProxyCardModel(
  input: CurrentProxyCardInput,
): CurrentProxyCardModel {
  const {
    mode,
    proxyView,
    isLoading,
    selectedGroupName,
    sortType,
    openPicker,
    delayOf,
    lastMeasuredDelay,
    labels,
  } = input
  const timeout = effectiveTimeout(input.latencyTimeout)
  const selectableGroups = listSelectableGroups(proxyView)
  const { selectedGroup, currentMember, currentOccurrence } =
    resolveCardSelection(mode, proxyView, selectedGroupName)

  const collapsed =
    isLoading ||
    proxyView == null ||
    (mode === 'rule' && selectableGroups.length === 0)

  if (collapsed) {
    return {
      view: {
        headerTitle: labels.headerTitle,
        nodeName: EMPTY_DISPLAY,
        delay: emptyDelay(),
        groupRow: emptyRow(labels.groupLabel),
        proxyRow: emptyRow(labels.proxyLabel),
        openPicker: null,
      },
      groupOptions: [],
      proxyOptions: [],
      selectedGroup,
      currentMember: isLoading ? null : currentMember,
    }
  }

  const rawDelay = currentMember ? delayOf(currentMember) : -1
  const delay = mapHeaderDelay(rawDelay, lastMeasuredDelay, timeout)

  if (mode === 'direct') {
    return {
      view: {
        headerTitle: labels.headerTitle,
        nodeName: 'DIRECT',
        delay,
        groupRow: {
          label: labels.groupLabel,
          value: 'DIRECT',
          tappable: false,
        },
        proxyRow: {
          label: labels.proxyLabel,
          value: 'DIRECT',
          tappable: false,
        },
        openPicker: null,
      },
      groupOptions: [],
      proxyOptions: [],
      selectedGroup,
      currentMember,
    }
  }

  const nodeName = currentMember?.ref.name ?? EMPTY_DISPLAY
  const groupValue =
    mode === 'global'
      ? (proxyView?.global?.name ?? 'GLOBAL')
      : (selectedGroup?.name ?? EMPTY_DISPLAY)
  const hasInteractable =
    proxyView != null &&
    selectedGroup != null &&
    selectedGroup.members.some((memberRef) =>
      isInteractableMember(resolveMember(proxyView, memberRef)),
    )
  const groupTappable = mode === 'rule' && selectableGroups.length > 0
  const proxyTappable = hasInteractable
  const resolvedPicker =
    (openPicker === 'group' && groupTappable) ||
    (openPicker === 'proxy' && proxyTappable)
      ? openPicker
      : null

  const groupOptions = groupTappable
    ? selectableGroups.map((group) => ({
        name: group.name,
        selected: group.name === selectedGroup?.name,
      }))
    : []
  const proxyOptions =
    proxyView && selectedGroup
      ? buildProxyOptions(
          proxyView,
          selectedGroup,
          currentOccurrence,
          delayOf,
          sortType,
          timeout,
        )
      : []

  return {
    view: {
      headerTitle: labels.headerTitle,
      nodeName,
      delay,
      groupRow: {
        label: labels.groupLabel,
        value: groupValue,
        tappable: groupTappable,
      },
      proxyRow: {
        label: labels.proxyLabel,
        value: nodeName,
        tappable: proxyTappable,
      },
      openPicker: resolvedPicker,
    },
    groupOptions,
    proxyOptions,
    selectedGroup,
    currentMember,
  }
}
