import {
  DirectionsRounded,
  LanguageRounded,
  MultipleStopRounded,
} from '@mui/icons-material'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CLASH_MODES,
  useClashModeSwitch,
  type ClashMode,
} from '@/hooks/use-clash-mode-switch'
import type { TranslationKey } from '@/types/generated/i18n-keys'

const MODE_META: Record<
  ClashMode,
  { label: TranslationKey; description: TranslationKey }
> = {
  rule: {
    label: 'home.components.clashMode.labels.rule',
    description: 'home.components.clashMode.descriptions.rule',
  },
  global: {
    label: 'home.components.clashMode.labels.global',
    description: 'home.components.clashMode.descriptions.global',
  },
  direct: {
    label: 'home.components.clashMode.labels.direct',
    description: 'home.components.clashMode.descriptions.direct',
  },
}

const MODE_ICONS: Record<ClashMode, ReactNode> = {
  rule: <MultipleStopRounded fontSize="small" />,
  global: <LanguageRounded fontSize="small" />,
  direct: <DirectionsRounded fontSize="small" />,
}

export const ClashModeCard = () => {
  const { t } = useTranslation()
  const { currentMode, isPending, onChangeMode } = useClashModeSwitch()

  const modeDescription = currentMode
    ? t(MODE_META[currentMode].description)
    : isPending
      ? '\u00A0'
      : t('home.components.clashMode.errors.communication')

  const buttonStyles = (mode: ClashMode) => ({
    cursor: 'pointer',
    px: 2,
    py: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    bgcolor: mode === currentMode ? 'primary.main' : 'background.paper',
    color: mode === currentMode ? 'primary.contrastText' : 'text.primary',
    borderRadius: 1.5,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'visible',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: 1,
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&::after':
      mode === currentMode
        ? {
            content: '""',
            position: 'absolute',
            bottom: -16,
            left: '50%',
            width: 2,
            height: 16,
            bgcolor: 'primary.main',
            transform: 'translateX(-50%)',
          }
        : {},
  })

  const descriptionStyles = {
    width: '95%',
    textAlign: 'center',
    color: 'text.secondary',
    p: 0.8,
    borderRadius: 1,
    borderColor: 'primary.main',
    borderWidth: 1,
    borderStyle: 'solid',
    backgroundColor: 'background.paper',
    wordBreak: 'break-word',
    hyphens: 'auto',
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {CLASH_MODES.map((mode) => (
          <Paper
            key={mode}
            elevation={mode === currentMode ? 2 : 0}
            onClick={() => onChangeMode(mode)}
            sx={buttonStyles(mode)}
          >
            {MODE_ICONS[mode]}
            <Typography
              variant="body2"
              sx={{
                textTransform: 'capitalize',
                fontWeight: mode === currentMode ? 600 : 400,
              }}
            >
              {t(MODE_META[mode].label)}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Box
        sx={{
          width: '100%',
          my: 1,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'visible',
        }}
      >
        <Typography variant="caption" component="div" sx={descriptionStyles}>
          {modeDescription}
        </Typography>
      </Box>
    </Box>
  )
}
