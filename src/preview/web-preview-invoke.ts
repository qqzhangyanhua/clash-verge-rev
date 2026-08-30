import {
  previewClashConfig,
  previewClashInfo,
  previewConnections,
  previewLogItems,
  previewLogs,
  previewMihomoBaseConfig,
  previewNetworkInterfaces,
  previewProfiles,
  previewProxyView,
  previewRules,
  previewRuntimeState,
  previewUnlockItems,
  previewVergeConfig,
} from './web-preview-data'

type InvokeArgs = Record<string, unknown> | undefined

interface ChannelLike {
  onmessage?: (message: unknown) => void
}

const asRecord = (args: InvokeArgs): Record<string, unknown> => args ?? {}

const asChannel = (value: unknown): ChannelLike | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  return value
}

const emitChannel = (channel: ChannelLike | undefined, message: unknown) => {
  window.setTimeout(() => {
    channel?.onmessage?.(message)
  }, 0)
}

const seedWebSocket = (cmd: string, args: InvokeArgs): number => {
  const channel = asChannel(asRecord(args).onMessage)

  if (cmd === 'plugin:mihomo|ws_connections') {
    emitChannel(channel, JSON.stringify(previewConnections))
  }

  if (cmd === 'plugin:mihomo|ws_logs') {
    previewLogItems.forEach((item, index) => {
      window.setTimeout(() => {
        channel?.onmessage?.(JSON.stringify(item))
      }, index * 30)
    })
  }

  if (cmd === 'plugin:mihomo|ws_traffic') {
    let upTotal = 16 * 1024 * 1024
    let downTotal = 128 * 1024 * 1024
    for (let index = 0; index < 6; index += 1) {
      const up = 800 + index * 120
      const down = 3600 + index * 240
      upTotal += up
      downTotal += down
      const payload = JSON.stringify({ up, down, upTotal, downTotal })
      window.setTimeout(() => {
        channel?.onmessage?.(payload)
      }, index * 400)
    }
  }

  if (cmd === 'plugin:mihomo|ws_memory') {
    emitChannel(channel, JSON.stringify({ inuse: 48 * 1024 * 1024 }))
  }

  return crypto.getRandomValues(new Uint32Array(1))[0]
}

const windowDefaults = (cmd: string): unknown => {
  if (cmd.endsWith('|theme')) return 'light'
  if (cmd.endsWith('|is_decorated')) return true
  if (cmd.endsWith('|is_maximized')) return false
  if (cmd.endsWith('|is_fullscreen')) return false
  if (cmd.endsWith('|is_minimized')) return false
  if (cmd.endsWith('|is_focused')) return true
  if (cmd.endsWith('|is_visible')) return true
  if (cmd.endsWith('|inner_size')) return { width: 1200, height: 800 }
  if (cmd.endsWith('|outer_size')) return { width: 1200, height: 800 }
  if (cmd.startsWith('plugin:window|') || cmd.startsWith('plugin:webview|')) {
    return null
  }
  return undefined
}

const pluginDefaults = (cmd: string, args: InvokeArgs): unknown => {
  if (cmd === 'plugin:http|fetch') return 1
  if (cmd === 'plugin:http|fetch_send') {
    return {
      status: 200,
      statusText: 'OK',
      url: '',
      headers: [['content-type', 'application/json']],
      rid: 2,
    }
  }
  if (cmd === 'plugin:http|fetch_read_body') return [1]
  if (cmd.startsWith('plugin:http|')) return null

  if (cmd === 'plugin:path|join') {
    const paths = asRecord(args).paths
    return Array.isArray(paths) ? paths.map(String).join('/') : ''
  }
  if (cmd.startsWith('plugin:path|')) return ''

  if (cmd === 'plugin:fs|exists') return false
  if (cmd.startsWith('plugin:fs|')) return null

  return undefined
}

export const handleWebPreviewInvoke = (
  cmd: string,
  args: InvokeArgs,
): unknown => {
  switch (cmd) {
    case 'get_verge_config':
      return previewVergeConfig
    case 'patch_verge_config':
    case 'patch_clash_config':
    case 'patch_clash_mode':
    case 'patch_profiles_config':
    case 'enhance_profiles':
    case 'update_profile':
    case 'import_profile':
    case 'create_profile':
    case 'delete_profile':
    case 'reorder_profile':
    case 'patch_profile':
    case 'sync_tray_proxy_selection':
    case 'record_selected_node':
    case 'forget_selected_node':
    case 'entry_lightweight_mode':
    case 'update_proxy_chain_config_in_runtime':
      return { status: 'valid' }
    case 'get_profiles':
      return previewProfiles
    case 'get_clash_info':
      return previewClashInfo
    case 'get_clash_mode':
      return previewClashConfig.mode
    case 'get_runtime_config':
      return previewClashConfig
    case 'get_runtime_yaml':
      return 'mode: rule\n'
    case 'get_runtime_logs':
      return {}
    case 'get_runtime_proxy_chain_config':
      return ''
    case 'get_proxy_view':
      return previewProxyView
    case 'get_runtime_state':
      return previewRuntimeState
    case 'get_pending_failures':
      return []
    case 'get_app_uptime':
      return 3_600_000
    case 'get_embedded_server_port':
      return 33331
    case 'get_app_dir':
      return '/tmp/clash-zyh-preview'
    case 'get_sys_proxy':
      return { enable: true, server: '127.0.0.1:7890', bypass: '' }
    case 'get_auto_proxy':
      return { enable: false, url: '' }
    case 'get_clash_logs':
      return previewLogs
    case 'get_system_info':
      return {
        system_name: 'macOS',
        system_version: '15.0',
        system_kernel_version: '24.0',
        system_arch: 'arm64',
        app_version: '2.5.4',
        app_core_mode: 'Sidecar',
        app_is_admin: false,
      }
    case 'get_system_hostname':
      return 'preview-host'
    case 'get_network_interfaces':
      return ['en0']
    case 'get_network_interfaces_info':
      return previewNetworkInterfaces
    case 'get_unlock_items':
      return previewUnlockItems
    case 'check_media_unlock': {
      const onComplete = asChannel(asRecord(args).onComplete)
      previewUnlockItems.forEach((item, index) => {
        window.setTimeout(() => {
          onComplete?.onmessage?.(item)
        }, index * 40)
      })
      return previewUnlockItems
    }
    case 'check_media_unlock_item': {
      const name = asRecord(args).name
      return (
        previewUnlockItems.find((item) => item.name === name) ??
        previewUnlockItems[0]
      )
    }
    case 'plugin:app|name':
      return 'Clash ZYH'
    case 'plugin:app|version':
      return '2.5.4'
    case 'plugin:mihomo|get_version':
      return { version: '1.19.0', meta: true }
    case 'plugin:mihomo|get_base_config':
      return previewMihomoBaseConfig
    case 'plugin:mihomo|get_rules':
      return { rules: previewRules }
    case 'plugin:mihomo|get_rule_providers':
      return { providers: {} }
    case 'plugin:mihomo|get_connections':
      return previewConnections
    case 'plugin:mihomo|close_all_connections':
    case 'plugin:mihomo|close_connection':
    case 'plugin:mihomo|ws_disconnect':
    case 'plugin:mihomo|clear_all_ws_connections':
      return null
    case 'plugin:mihomo|ws_traffic':
    case 'plugin:mihomo|ws_memory':
    case 'plugin:mihomo|ws_connections':
    case 'plugin:mihomo|ws_logs':
      return seedWebSocket(cmd, args)
    default: {
      const pluginValue = pluginDefaults(cmd, args)
      if (pluginValue !== undefined) return pluginValue
      const windowValue = windowDefaults(cmd)
      if (windowValue !== undefined) return windowValue
      console.warn('[web-preview] unhandled invoke', cmd, args)
      return null
    }
  }
}
