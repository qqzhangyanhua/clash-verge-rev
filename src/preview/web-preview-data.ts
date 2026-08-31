import type { ProxyViewV1 } from '@/types/proxy-view'

const now = Math.floor(Date.now() / 1000)

const capabilities = {
  udp: true,
  xudp: false,
  tfo: false,
  mptcp: false,
  smux: false,
}

export const previewVergeConfig: IVergeConfig = {
  language: 'zh',
  theme_mode: 'light',
  traffic_graph: true,
  enable_tun_mode: false,
  enable_system_proxy: true,
  enable_auto_launch: false,
  enable_silent_start: false,
  collapse_navbar: false,
  menu_icon: 'monochrome',
  clash_core: 'verge-mihomo',
  verge_mixed_port: 7890,
  proxy_host: '127.0.0.1',
}

export const previewProfiles: IProfilesConfig = {
  current: 'p-main',
  items: [
    {
      uid: 'p-main',
      type: 'remote',
      name: 'Airport Main',
      url: 'https://example.com/sub',
      home: 'https://example.com',
      updated: now - 3600,
      extra: {
        upload: 1.2 * 1024 ** 3,
        download: 12.4 * 1024 ** 3,
        total: 100 * 1024 ** 3,
        expire: now + 30 * 24 * 3600,
      },
    },
    {
      uid: 'p-backup',
      type: 'local',
      name: 'Local Backup',
      updated: now - 86400,
    },
  ],
}

export const previewClashInfo: IClashInfo = {
  mixed_port: 7890,
  server: '127.0.0.1:9097',
  secret: '',
}

export const previewClashConfig: IConfigData = {
  port: 7890,
  mode: 'rule',
  ipv6: false,
  'socket-port': 7890,
  'allow-lan': false,
  'log-level': 'info',
  'mixed-port': 7890,
  'redir-port': 0,
  'socks-port': 7891,
  'tproxy-port': 0,
  'external-controller': '127.0.0.1:9097',
  'external-controller-cors': {
    'allow-private-network': true,
    'allow-origins': ['*'],
  },
  secret: '',
  'unified-delay': true,
  tun: {
    stack: 'mixed',
    device: 'utun',
    'auto-route': true,
    'auto-detect-interface': true,
    'dns-hijack': ['any:53'],
    'strict-route': false,
    mtu: 1500,
  },
}

export const previewProxyView: ProxyViewV1 = {
  schemaVersion: 1,
  orderSource: 'runtime',
  providerState: 'ready',
  global: {
    name: 'GLOBAL',
    type: 'Selector',
    alive: true,
    now: 'Tokyo-01',
    history: [],
    members: [
      { kind: 'node', name: 'Tokyo-01', recordId: 'n-tyo' },
      { kind: 'node', name: 'Singapore-01', recordId: 'n-sg' },
    ],
    ...capabilities,
  },
  direct: 'DIRECT',
  groups: [
    {
      name: 'PROXY',
      type: 'Selector',
      alive: true,
      now: 'Tokyo-01',
      history: [],
      members: [
        { kind: 'node', name: 'Tokyo-01', recordId: 'n-tyo' },
        { kind: 'node', name: 'Singapore-01', recordId: 'n-sg' },
        { kind: 'node', name: 'Hong Kong-01', recordId: 'n-hk' },
        { kind: 'node', name: 'Taiwan-01', recordId: 'n-tw' },
        { kind: 'node', name: 'US-West-01', recordId: 'n-us' },
      ],
      ...capabilities,
    },
    {
      name: 'Streaming',
      type: 'URLTest',
      alive: true,
      now: 'Singapore-01',
      fixed: 'Singapore-01',
      history: [],
      members: [
        { kind: 'node', name: 'Singapore-01', recordId: 'n-sg' },
        { kind: 'node', name: 'Hong Kong-01', recordId: 'n-hk' },
      ],
      ...capabilities,
    },
  ],
  records: {
    'n-tyo': {
      recordId: 'n-tyo',
      name: 'Tokyo-01',
      type: 'ss',
      alive: true,
      history: [{ time: new Date().toISOString(), delay: 48 }],
      source: { kind: 'core', proxyName: 'Tokyo-01' },
      ...capabilities,
    },
    'n-sg': {
      recordId: 'n-sg',
      name: 'Singapore-01',
      type: 'ss',
      alive: true,
      history: [{ time: new Date().toISOString(), delay: 72 }],
      source: { kind: 'core', proxyName: 'Singapore-01' },
      ...capabilities,
    },
    'n-hk': {
      recordId: 'n-hk',
      name: 'Hong Kong-01',
      type: 'vmess',
      alive: true,
      history: [{ time: new Date().toISOString(), delay: 36 }],
      source: { kind: 'core', proxyName: 'Hong Kong-01' },
      ...capabilities,
    },
    'n-tw': {
      recordId: 'n-tw',
      name: 'Taiwan-01',
      type: 'trojan',
      alive: true,
      history: [{ time: new Date().toISOString(), delay: 54 }],
      source: { kind: 'core', proxyName: 'Taiwan-01' },
      ...capabilities,
    },
    'n-us': {
      recordId: 'n-us',
      name: 'US-West-01',
      type: 'vless',
      alive: false,
      history: [{ time: new Date().toISOString(), delay: 0 }],
      source: { kind: 'core', proxyName: 'US-West-01' },
      udp: false,
      xudp: false,
      tfo: false,
      mptcp: false,
      smux: false,
    },
  },
  standalone: [],
  providers: [],
}

export const previewRules = [
  {
    type: 'DomainSuffix',
    payload: 'google.com',
    proxy: 'PROXY',
    index: 1,
    size: -1,
  },
  {
    type: 'DomainSuffix',
    payload: 'github.com',
    proxy: 'PROXY',
    index: 2,
    size: -1,
  },
  { type: 'GeoIP', payload: 'CN', proxy: 'DIRECT', index: 3, size: -1 },
  { type: 'Match', payload: '', proxy: 'PROXY', index: 4, size: -1 },
]

export const previewMihomoBaseConfig = {
  mixedPort: 7890,
  socksPort: 7891,
  port: 7890,
  redirPort: 0,
  tproxyPort: 0,
  mode: 'rule',
  allowLan: false,
  ipv6: false,
  logLevel: 'info',
  unifiedDelay: true,
}

export const previewLogs = [
  'time="2026-08-30T10:01:12+08:00" level=info msg="match google.com --> PROXY"',
  'time="2026-08-30T10:01:13+08:00" level=warning msg="retry connection to Tokyo-01"',
  'time="2026-08-30T10:01:14+08:00" level=error msg="dns lookup failed for example.test"',
]

export const previewLogItems = [
  {
    time: '08-30 10:01:12',
    type: 'info',
    payload: 'match google.com --> PROXY',
  },
  {
    time: '08-30 10:01:13',
    type: 'warning',
    payload: 'retry connection to Tokyo-01',
  },
  {
    time: '08-30 10:01:14',
    type: 'error',
    payload: 'dns lookup failed for example.test',
  },
]

export const previewNetworkInterfaces: INetworkInterface[] = [
  {
    name: 'en0',
    index: 1,
    mac_addr: '00:11:22:33:44:55',
    addr: [
      {
        V4: {
          ip: '192.168.1.8',
          netmask: '255.255.255.0',
        },
      },
    ],
  },
]

export const previewUnlockItems = [
  { name: 'Netflix', status: 'Yes', region: 'SG', check_time: '10:01:12' },
  { name: 'YouTube', status: 'Yes', region: 'JP', check_time: '10:01:18' },
  {
    name: 'Disney+',
    status: 'No',
    region: null,
    check_time: '10:01:21',
  },
]

export const previewConnections = {
  downloadTotal: 128 * 1024 * 1024,
  uploadTotal: 16 * 1024 * 1024,
  connections: [
    {
      id: 'c-1',
      metadata: {
        network: 'tcp',
        type: 'HTTPS',
        host: 'github.com',
        sourceIP: '127.0.0.1',
        sourcePort: '51234',
        destinationPort: '443',
        destinationIP: '20.27.177.113',
        process: 'Safari',
      },
      upload: 4096,
      download: 102400,
      start: new Date(Date.now() - 60_000).toISOString(),
      chains: ['PROXY', 'Tokyo-01'],
      rule: 'DomainSuffix',
      rulePayload: 'github.com',
      curUpload: 120,
      curDownload: 4800,
    },
    {
      id: 'c-2',
      metadata: {
        network: 'udp',
        type: 'QUIC',
        host: 'youtube.com',
        sourceIP: '127.0.0.1',
        sourcePort: '51235',
        destinationPort: '443',
        process: 'Chrome',
      },
      upload: 8192,
      download: 204800,
      start: new Date(Date.now() - 12_000).toISOString(),
      chains: ['Streaming', 'Singapore-01'],
      rule: 'DomainSuffix',
      rulePayload: 'youtube.com',
      curUpload: 80,
      curDownload: 9600,
    },
    {
      id: 'c-3',
      metadata: {
        network: 'tcp',
        type: 'HTTPS',
        host: 'apple.com',
        sourceIP: '127.0.0.1',
        sourcePort: '51236',
        destinationPort: '443',
        process: 'Safari',
      },
      upload: 2048,
      download: 51200,
      start: new Date(Date.now() - 8_000).toISOString(),
      chains: ['DIRECT'],
      rule: 'GeoIP',
      rulePayload: 'CN',
      curUpload: 20,
      curDownload: 800,
    },
  ],
}

export const previewRuntimeState = {
  mode: 'Sidecar',
  service: 'unknown',
  serviceUnavailableReason: null,
  pendingAction: null,
  sidecarAllowed: true,
  isAdmin: false,
  opInFlight: false,
  serviceUsable: false,
  tunCapable: false,
  serviceNeedsAttention: false,
}
