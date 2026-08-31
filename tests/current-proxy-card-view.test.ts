import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  buildCurrentProxyCardModel,
  type ClashProxyMode,
  type CurrentProxyCardInput,
  type CurrentProxyCardLabels,
} from '@/components/home/current-proxy-card-view'
import type { ProxySortType } from '@/components/proxy/use-filter-sort'
import type {
  ProxyGroupView,
  ProxyNodeView,
  ProxyViewV1,
  ResolvedProxyMember,
} from '@/types/proxy-view'

const labels: CurrentProxyCardLabels = {
  headerTitle: 'Proxy',
  groupLabel: 'Group',
  proxyLabel: 'Node',
}

const nodeOf = (
  name: string,
  recordId: string,
  extra?: Partial<ProxyNodeView>,
): ProxyNodeView => ({
  recordId,
  name,
  type: 'Shadowsocks',
  alive: true,
  history: [],
  udp: true,
  xudp: false,
  tfo: false,
  mptcp: false,
  smux: false,
  source: { kind: 'core', proxyName: name },
  ...extra,
})

const groupOf = (
  name: string,
  members: ProxyNodeView[],
  extra?: Partial<ProxyGroupView>,
): ProxyGroupView => ({
  name,
  type: 'Selector',
  alive: true,
  history: [],
  udp: true,
  xudp: false,
  tfo: false,
  mptcp: false,
  smux: false,
  now: members[0]?.name,
  members: members.map((member) => ({
    kind: 'node',
    name: member.name,
    recordId: member.recordId,
  })),
  ...extra,
})

const tokyo = nodeOf('Tokyo', 'c:tokyo')
const singapore = nodeOf('Singapore', 'c:sg')
const hongkong = nodeOf('HongKong', 'c:hk')
const unused = nodeOf('Unused', 'c:unused')

const selector = groupOf('SELECT', [tokyo, singapore, hongkong], {
  now: 'Tokyo',
})
const urlTest = groupOf('AUTO', [tokyo, singapore], {
  type: 'URLTest',
  now: 'Tokyo',
  fixed: 'Tokyo',
})
const hidden = groupOf('HIDDEN', [unused], { hidden: true })
const loadBalance = groupOf('BALANCE', [hongkong], { type: 'LoadBalance' })
const globalGroup = groupOf('GLOBAL', [tokyo, singapore], { now: 'Singapore' })

const records = {
  [tokyo.recordId]: tokyo,
  [singapore.recordId]: singapore,
  [hongkong.recordId]: hongkong,
  [unused.recordId]: unused,
}

const view: ProxyViewV1 = {
  schemaVersion: 1,
  orderSource: 'runtime',
  providerState: 'ready',
  global: globalGroup,
  direct: tokyo.recordId,
  groups: [selector, urlTest, hidden, loadBalance],
  records,
  standalone: [tokyo.recordId],
  providers: [],
}

const delays: Record<string, number> = {
  Tokyo: 95,
  Singapore: 220,
  HongKong: 410,
}

const delayOf = (member: ResolvedProxyMember) => delays[member.ref.name] ?? -1

const build = (
  extra: Partial<CurrentProxyCardInput> & {
    mode?: ClashProxyMode
    sortType?: ProxySortType
  } = {},
) =>
  buildCurrentProxyCardModel({
    mode: extra.mode ?? 'rule',
    proxyView: extra.proxyView === undefined ? view : extra.proxyView,
    isLoading: extra.isLoading ?? false,
    selectedGroupName: extra.selectedGroupName ?? 'SELECT',
    sortType: extra.sortType ?? 0,
    openPicker: extra.openPicker ?? null,
    delayOf: extra.delayOf ?? delayOf,
    lastMeasuredDelay: extra.lastMeasuredDelay ?? null,
    latencyTimeout: extra.latencyTimeout,
    labels: extra.labels ?? labels,
  })

test('rule with group, node, and 95ms maps header delay and tappable rows', () => {
  const { view: card } = build()

  assert.equal(card.headerTitle, 'Proxy')
  assert.equal(card.nodeName, 'Tokyo')
  assert.deepEqual(card.delay, {
    kind: 'measured',
    text: '95ms',
    tone: 'success',
  })
  assert.deepEqual(card.groupRow, {
    label: 'Group',
    value: 'SELECT',
    tappable: true,
  })
  assert.deepEqual(card.proxyRow, {
    label: 'Node',
    value: 'Tokyo',
    tappable: true,
  })
  assert.equal(card.openPicker, null)
  assert.equal(card.groupRow.value.includes('ms'), false)
  assert.equal(card.proxyRow.value.includes('ms'), false)
})

test('untested delay is an em dash, not formatDelay hyphen', () => {
  const { view: card } = build({
    delayOf: () => -1,
  })

  assert.deepEqual(card.delay, {
    kind: 'empty',
    text: '—',
    tone: 'neutral',
  })
  assert.notEqual(card.delay.text, '-')
})

test('testing keeps the last measured delay', () => {
  const { view: card } = build({
    delayOf: () => -2,
    lastMeasuredDelay: 95,
  })

  assert.deepEqual(card.delay, {
    kind: 'measured',
    text: '95ms',
    tone: 'success',
  })
})

test('testing without a previous measurement is empty', () => {
  const { view: card } = build({
    delayOf: () => -2,
    lastMeasuredDelay: null,
  })

  assert.deepEqual(card.delay, {
    kind: 'empty',
    text: '—',
    tone: 'neutral',
  })
})

test('timeout and error use failure copy and error tone', () => {
  assert.deepEqual(build({ delayOf: () => 0 }).view.delay, {
    kind: 'failure',
    text: 'Timeout',
    tone: 'error',
  })
  assert.deepEqual(build({ delayOf: () => 10000 }).view.delay, {
    kind: 'failure',
    text: 'Timeout',
    tone: 'error',
  })
  assert.deepEqual(build({ delayOf: () => 1e5 + 1 }).view.delay, {
    kind: 'failure',
    text: 'Error',
    tone: 'error',
  })
})

test('header delay tone follows formatDelayColor thresholds', () => {
  assert.equal(build({ delayOf: () => 249 }).view.delay.tone, 'success')
  assert.equal(build({ delayOf: () => 250 }).view.delay.tone, 'primary')
  assert.equal(build({ delayOf: () => 399 }).view.delay.tone, 'primary')
  assert.equal(build({ delayOf: () => 400 }).view.delay.tone, 'warning')
})

test('global locks the group row and keeps the proxy row tappable', () => {
  const model = build({
    mode: 'global',
    selectedGroupName: 'GLOBAL',
  })

  assert.equal(model.view.groupRow.value, 'GLOBAL')
  assert.equal(model.view.groupRow.tappable, false)
  assert.equal(model.view.proxyRow.value, 'Singapore')
  assert.equal(model.view.proxyRow.tappable, true)
  assert.equal(model.view.nodeName, 'Singapore')
  assert.equal(model.view.openPicker, null)
  assert.deepEqual(
    model.groupOptions,
    [],
    'group picker stays closed in Global',
  )
  assert.ok(model.proxyOptions.length > 0)
})

test('direct freezes both rows at DIRECT', () => {
  const model = build({
    mode: 'direct',
    selectedGroupName: 'DIRECT',
  })

  assert.equal(model.view.nodeName, 'DIRECT')
  assert.deepEqual(model.view.groupRow, {
    label: 'Group',
    value: 'DIRECT',
    tappable: false,
  })
  assert.deepEqual(model.view.proxyRow, {
    label: 'Node',
    value: 'DIRECT',
    tappable: false,
  })
  assert.equal(model.view.openPicker, null)
  assert.deepEqual(model.groupOptions, [])
  assert.deepEqual(model.proxyOptions, [])
})

test('loading and missing data keep three empty, untappable rows', () => {
  const loading = build({ isLoading: true }).view
  assert.equal(loading.nodeName, '—')
  assert.deepEqual(loading.delay, {
    kind: 'empty',
    text: '—',
    tone: 'neutral',
  })
  assert.equal(loading.groupRow.value, '—')
  assert.equal(loading.proxyRow.value, '—')
  assert.equal(loading.groupRow.tappable, false)
  assert.equal(loading.proxyRow.tappable, false)
  assert.equal(loading.openPicker, null)

  const missing = build({ proxyView: null }).view
  assert.equal(missing.nodeName, '—')
  assert.equal(missing.groupRow.value, '—')
  assert.equal(missing.proxyRow.value, '—')
  assert.equal(missing.groupRow.tappable, false)
  assert.equal(missing.proxyRow.tappable, false)

  const emptyGroups: ProxyViewV1 = {
    ...view,
    groups: [hidden, loadBalance],
    global: null,
    direct: null,
  }
  const noGroups = build({
    proxyView: emptyGroups,
    selectedGroupName: '',
  }).view
  assert.equal(noGroups.nodeName, '—')
  assert.equal(noGroups.groupRow.value, '—')
  assert.equal(noGroups.proxyRow.value, '—')
  assert.equal(noGroups.groupRow.tappable, false)
  assert.equal(noGroups.proxyRow.tappable, false)
})

test('group list only includes unhidden Selector and URLTest', () => {
  const { groupOptions } = build()

  assert.deepEqual(
    groupOptions.map((option) => option.name),
    ['SELECT', 'AUTO'],
  )
  assert.equal(
    groupOptions.some((option) => option.name === 'HIDDEN'),
    false,
  )
  assert.equal(
    groupOptions.some((option) => option.name === 'BALANCE'),
    false,
  )
  assert.deepEqual(
    groupOptions.find((option) => option.name === 'SELECT'),
    { name: 'SELECT', selected: true },
  )
})

test('node list marks fixed pins and sorts by delay', () => {
  const model = build({
    selectedGroupName: 'AUTO',
    sortType: 1,
    delayOf: (member) => {
      if (member.ref.name === 'Tokyo') return 220
      if (member.ref.name === 'Singapore') return 80
      return -1
    },
  })

  assert.deepEqual(
    model.proxyOptions.map((option) => option.name),
    ['Singapore', 'Tokyo'],
  )
  assert.deepEqual(
    model.proxyOptions.map((option) => option.pin),
    [null, 'solid'],
  )
  assert.equal(model.proxyOptions[1]?.selected, true)

  const hollow = build({
    selectedGroupName: 'AUTO',
    proxyView: {
      ...view,
      groups: view.groups.map((group) =>
        group.name === 'AUTO' ? { ...group, now: 'Singapore' } : group,
      ),
    },
  })

  const pins = Object.fromEntries(
    hollow.proxyOptions.map((option) => [option.name, option.pin]),
  )
  assert.equal(pins.Tokyo, 'hollow')
  assert.equal(pins.Singapore, null)
})

test('unresolved members stay in the list but are not selectable', () => {
  const withUnresolved: ProxyViewV1 = {
    ...view,
    groups: [
      {
        ...selector,
        members: [
          ...selector.members,
          { kind: 'unresolved', name: 'ghost', reason: 'missing' },
        ],
      },
      urlTest,
      hidden,
      loadBalance,
    ],
  }

  const { proxyOptions } = build({ proxyView: withUnresolved })
  const ghost = proxyOptions.find((option) => option.name === 'ghost')
  assert.ok(ghost)
  assert.equal(ghost.disabled, true)
  assert.equal(ghost.delay, -1)
  assert.equal(ghost.selected, false)
})

test('only one picker can be open, and locked rows force it closed', () => {
  assert.equal(build({ openPicker: 'group' }).view.openPicker, 'group')
  assert.equal(build({ openPicker: 'proxy' }).view.openPicker, 'proxy')
  assert.equal(
    build({ mode: 'global', openPicker: 'group' }).view.openPicker,
    null,
  )
  assert.equal(
    build({ mode: 'direct', openPicker: 'proxy' }).view.openPicker,
    null,
  )
  assert.equal(
    build({ isLoading: true, openPicker: 'proxy' }).view.openPicker,
    null,
  )
})
