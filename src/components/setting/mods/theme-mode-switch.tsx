import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'

type ThemeValue = IVergeConfig['theme_mode']

interface Props {
  value?: ThemeValue
  onChange?: (value: ThemeValue) => void
}

export const ThemeModeSwitch = (props: Props) => {
  const { value, onChange } = props
  const { t } = useTranslation()

  const modes = ['light', 'dark', 'system'] as const

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      className="segmented-control"
      value={value ?? 'system'}
      onChange={(_event, next: ThemeValue | null) => {
        if (next) onChange?.(next)
      }}
    >
      {modes.map((mode) => (
        <ToggleButton key={mode} value={mode} disableRipple>
          {t(`settings.sections.appearance.${mode}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
