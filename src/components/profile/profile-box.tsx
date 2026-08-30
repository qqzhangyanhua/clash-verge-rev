import { alpha, Box, styled } from '@mui/material'

export const ProfileBox = styled(Box)(
  ({ theme, 'aria-selected': selected }) => {
    const { mode, primary, text } = theme.palette
    const key = `${mode}-${!!selected}`

    const backgroundColor = 'var(--content-color)'

    const color = {
      'light-true': text.secondary,
      'light-false': text.secondary,
      'dark-true': alpha(text.secondary, 0.65),
      'dark-false': alpha(text.secondary, 0.65),
    }[key]!

    const h2color = {
      'light-true': primary.main,
      'light-false': text.primary,
      'dark-true': primary.main,
      'dark-false': text.primary,
    }[key]!

    return {
      position: 'relative',
      display: 'block',
      cursor: 'pointer',
      textAlign: 'left',
      padding: '8px 12px',
      boxSizing: 'border-box',
      width: '100%',
      backgroundColor,
      border: '1px solid var(--divider-color)',
      borderLeft: selected
        ? `3px solid ${primary.main}`
        : '1px solid var(--divider-color)',
      borderRadius: '6px',
      color,
      '& h2': { color: h2color },
    }
  },
)
