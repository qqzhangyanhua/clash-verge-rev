import assert from 'node:assert/strict'

import { test } from 'vitest'

import {
  buildRenderList,
  type IRenderItem,
} from '@/components/proxy/render-list'
import { DEFAULT_STATE } from '@/components/proxy/use-head-state'
import type {
  ProxyGroupView,
  ProxyNodeView,
  ProxyViewV1,
} from '@/types/proxy-view'

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

const alpha = nodeOf('alpha', 'c:0')
const beta = nodeOf('beta', 'c:1')
const gamma = nodeOf('gamma', 'c:2')

const visible = groupOf('VISIBLE', [alpha, beta])
const hidden = groupOf('HIDDEN', [gamma], { hidden: true })
const globalGroup = groupOf('GLOBAL', [alpha, gamma])
const other = groupOf('OTHER', [gamma])

const view: ProxyViewV1 = {
  schemaVersion: 1,
  orderSource: 'runtime',
  providerState: 'ready',
  global: globalGroup,
  direct: null,
  groups: [visible, hidden],
  records: {
    [alpha.recordId]: alpha,
    [beta.recordId]: beta,
    [gamma.recordId]: gamma,
  },
  standalone: [alpha.recordId, gamma.recordId],
  providers: [],
}

const twoGroups: ProxyViewV1 = {
  ...view,
  groups: [visible, other],
}

const opened = (...names: string[]) =>
  Object.fromEntries(
    names.map((name) => [name, { ...DEFAULT_STATE, open: true }]),
  )

type Row =
  | { type: 'group'; name: string }
  | { type: 'head'; name: string }
  | { type: 'member'; group: string; name: string }
  | { type: 'empty'; name: string }
  | { type: 'col'; group: string; names: string[] }

const rowsOf = (items: IRenderItem[]): Row[] =>
  items.map((item) => {
    if (item.type === 0) return { type: 'group', name: item.group.name }
    if (item.type === 1) return { type: 'head', name: item.group.name }
    if (item.type === 2) {
      if (!item.member) throw new Error('member row is missing member')
      return {
        type: 'member',
        group: item.group.name,
        name: item.member.member.ref.name,
      }
    }
    if (item.type === 3) return { type: 'empty', name: item.group.name }
    if (!item.memberCol) throw new Error('column row is missing members')
    return {
      type: 'col',
      group: item.group.name,
      names: item.memberCol.map(({ member }) => member.ref.name),
    }
  })

test('rule mode renders expanded group headers and members and drops hidden groups', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'rule',
        col: 1,
        headStates: opened('VISIBLE', 'HIDDEN'),
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
    ],
  )
})

test('rule mode keeps a collapsed group as a header without members', () => {
  assert.deepEqual(rowsOf(buildRenderList({ view, mode: 'rule', col: 1 })), [
    { type: 'group', name: 'VISIBLE' },
  ])
})

test('rule mode packs expanded members into column blocks when col > 1', () => {
  const extra = nodeOf('delta', 'c:3')
  const wide = groupOf('VISIBLE', [alpha, beta, extra])
  const wideView: ProxyViewV1 = {
    ...view,
    groups: [wide, hidden],
    records: { ...view.records, [extra.recordId]: extra },
  }
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: wideView,
        mode: 'rule',
        col: 2,
        headStates: opened('VISIBLE'),
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'col', group: 'VISIBLE', names: ['alpha', 'beta'] },
      { type: 'col', group: 'VISIBLE', names: ['delta'] },
    ],
  )
})

test('rule mode renders each expanded group in order', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: twoGroups,
        mode: 'rule',
        col: 1,
        headStates: opened('VISIBLE', 'OTHER'),
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
      { type: 'group', name: 'OTHER' },
      { type: 'member', group: 'OTHER', name: 'gamma' },
    ],
  )
})

test('global mode renders only GLOBAL members without needing the group header open', () => {
  assert.deepEqual(rowsOf(buildRenderList({ view, mode: 'global', col: 1 })), [
    { type: 'head', name: 'GLOBAL' },
    { type: 'member', group: 'GLOBAL', name: 'alpha' },
    { type: 'member', group: 'GLOBAL', name: 'gamma' },
  ])
  assert.deepEqual(rowsOf(buildRenderList({ view, mode: 'global', col: 2 })), [
    { type: 'head', name: 'GLOBAL' },
    { type: 'col', group: 'GLOBAL', names: ['alpha', 'gamma'] },
  ])
})

test('direct mode has no renderable groups', () => {
  assert.deepEqual(buildRenderList({ view, mode: 'direct', col: 1 }), [])
})

test('chain rule mode lists the selected group members and does not fall back when that group is gone', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'rule',
        isChainMode: true,
        selectedGroup: 'VISIBLE',
        col: 1,
        runtimeConfigReady: true,
        runtimeProxies: [{ name: 'gamma' }],
      }),
    ),
    [
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
    ],
  )

  assert.deepEqual(
    buildRenderList({
      view,
      mode: 'rule',
      isChainMode: true,
      selectedGroup: 'removed-group',
      col: 1,
      runtimeConfigReady: true,
      runtimeProxies: [{ name: 'gamma' }],
    }),
    [],
  )
})

test('chain global mode lists GLOBAL chain candidates from runtime standalone nodes', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'global',
        isChainMode: true,
        col: 1,
        runtimeConfigReady: true,
        runtimeProxies: [{ name: 'alpha' }, { name: 'gamma' }],
      }),
    ),
    [
      { type: 'member', group: 'chain-mode', name: 'alpha' },
      { type: 'member', group: 'chain-mode', name: 'gamma' },
    ],
  )
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'global',
        isChainMode: true,
        col: 2,
        runtimeConfigReady: true,
        runtimeProxies: [{ name: 'alpha' }, { name: 'gamma' }],
        headStates: {
          'chain-mode': { ...DEFAULT_STATE, filterText: 'alpha', sortType: 2 },
        },
      }),
    ),
    [{ type: 'col', group: 'chain-mode', names: ['alpha', 'gamma'] }],
  )
})

test('filter and name sort still apply to member rows', () => {
  const filtered = buildRenderList({
    view,
    mode: 'rule',
    col: 1,
    headStates: {
      VISIBLE: { ...DEFAULT_STATE, open: true, filterText: 'al' },
    },
  })
  assert.deepEqual(rowsOf(filtered), [
    { type: 'group', name: 'VISIBLE' },
    { type: 'member', group: 'VISIBLE', name: 'alpha' },
  ])

  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'rule',
        col: 1,
        headStates: {
          VISIBLE: { ...DEFAULT_STATE, open: true, filterText: 'no-such' },
        },
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'empty', name: 'VISIBLE' },
    ],
  )

  const unordered = groupOf('VISIBLE', [beta, alpha])
  const unorderedView: ProxyViewV1 = {
    ...view,
    groups: [unordered],
  }
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: unorderedView,
        mode: 'rule',
        col: 1,
        headStates: opened('VISIBLE'),
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
    ],
  )
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: unorderedView,
        mode: 'rule',
        col: 1,
        headStates: {
          VISIBLE: { ...DEFAULT_STATE, open: true, sortType: 2 },
        },
      }),
    ),
    [
      { type: 'group', name: 'VISIBLE' },
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
    ],
  )
})

test('split pane lists only the selected group tools and single-column members', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: twoGroups,
        mode: 'rule',
        col: 2,
        splitPane: true,
        selectedGroup: 'OTHER',
        headStates: opened('VISIBLE', 'OTHER'),
      }),
    ),
    [
      { type: 'head', name: 'OTHER' },
      { type: 'member', group: 'OTHER', name: 'gamma' },
    ],
  )
})

test('split pane shows members even when the selected group is collapsed', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: twoGroups,
        mode: 'rule',
        col: 2,
        splitPane: true,
        selectedGroup: 'VISIBLE',
      }),
    ),
    [
      { type: 'head', name: 'VISIBLE' },
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
    ],
  )
})

test('split pane without a selected group has no rows', () => {
  assert.deepEqual(
    buildRenderList({
      view: twoGroups,
      mode: 'rule',
      col: 1,
      splitPane: true,
    }),
    [],
  )
})

test('split pane ignores a hidden selected group', () => {
  assert.deepEqual(
    buildRenderList({
      view,
      mode: 'rule',
      col: 1,
      splitPane: true,
      selectedGroup: 'HIDDEN',
      headStates: opened('HIDDEN'),
    }),
    [],
  )
})

test('split pane still uses tools and members in global mode as a single column', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'global',
        col: 2,
        splitPane: true,
      }),
    ),
    [
      { type: 'head', name: 'GLOBAL' },
      { type: 'member', group: 'GLOBAL', name: 'alpha' },
      { type: 'member', group: 'GLOBAL', name: 'gamma' },
    ],
  )
})

test('split pane does not change chain-mode rows', () => {
  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view,
        mode: 'rule',
        isChainMode: true,
        splitPane: true,
        selectedGroup: 'VISIBLE',
        col: 1,
        runtimeConfigReady: true,
        runtimeProxies: [{ name: 'gamma' }],
      }),
    ),
    [
      { type: 'member', group: 'VISIBLE', name: 'alpha' },
      { type: 'member', group: 'VISIBLE', name: 'beta' },
    ],
  )

  assert.deepEqual(
    buildRenderList({
      view,
      mode: 'rule',
      isChainMode: true,
      splitPane: true,
      selectedGroup: 'removed-group',
      col: 1,
      runtimeConfigReady: true,
      runtimeProxies: [{ name: 'gamma' }],
    }),
    [],
  )
})

test('delay sort respects latency timeout on member rows', () => {
  const slow = nodeOf('slow', 'c:0', {
    history: [{ time: '1', delay: 1500 }],
  })
  const fast = nodeOf('fast', 'c:1', {
    history: [{ time: '1', delay: 80 }],
  })
  const group = groupOf('PROXY', [slow, fast])
  const delayView: ProxyViewV1 = {
    ...view,
    groups: [group],
    records: { [slow.recordId]: slow, [fast.recordId]: fast },
  }

  assert.deepEqual(
    rowsOf(
      buildRenderList({
        view: delayView,
        mode: 'rule',
        col: 1,
        latencyTimeout: 1000,
        headStates: {
          PROXY: { ...DEFAULT_STATE, open: true, sortType: 1 },
        },
      }),
    ),
    [
      { type: 'group', name: 'PROXY' },
      { type: 'member', group: 'PROXY', name: 'fast' },
      { type: 'member', group: 'PROXY', name: 'slow' },
    ],
  )
})
