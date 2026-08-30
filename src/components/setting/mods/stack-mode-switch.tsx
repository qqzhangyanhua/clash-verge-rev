import { ToggleButton, ToggleButtonGroup } from '@mui/material'

interface Props {
  value?: string
  onChange?: (value: string) => void
}

const STACK_MODES = ['system', 'gvisor', 'mixed'] as const

const STACK_LABELS: Record<(typeof STACK_MODES)[number], string> = {
  system: 'System',
  gvisor: 'gVisor',
  mixed: 'Mixed',
}

export const StackModeSwitch = (props: Props) => {
  const { value, onChange } = props
  const current = value?.toLowerCase() ?? 'mixed'

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      className="segmented-control"
      value={current}
      onChange={(_event, next: string | null) => {
        if (next) onChange?.(next)
      }}
    >
      {STACK_MODES.map((mode) => (
        <ToggleButton key={mode} value={mode} disableRipple>
          {STACK_LABELS[mode]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
