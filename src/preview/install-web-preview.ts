import { mockConvertFileSrc, mockIPC, mockWindows } from '@tauri-apps/api/mocks'

import { handleWebPreviewInvoke } from './web-preview-invoke'

type TauriInternalsWindow = Window & {
  __TAURI_INTERNALS__?: { metadata?: unknown }
}

export const installWebPreview = (): void => {
  if (import.meta.env.VITE_WEB_PREVIEW !== '1') return
  if ((window as TauriInternalsWindow).__TAURI_INTERNALS__?.metadata) return

  mockWindows('main')
  mockConvertFileSrc('linux')
  mockIPC(
    (cmd, args) =>
      handleWebPreviewInvoke(cmd, args as Record<string, unknown> | undefined),
    { shouldMockEvents: true },
  )
}

installWebPreview()
