import { Box, styled } from '@mui/material'

export const ProfileBox = styled(Box)(
  ({ theme, 'aria-selected': selected }) => {
    const { primary } = theme.palette

    return {
      position: 'relative',
      display: 'block',
      cursor: 'pointer',
      textAlign: 'left',
      padding: '10px 12px',
      boxSizing: 'border-box',
      width: '100%',
      backgroundColor: selected ? primary.main : 'var(--content-color)',
      border: '1px solid var(--divider-color)',
      borderRadius: 'var(--border-radius)',
      color: selected ? primary.contrastText : 'var(--text-secondary)',
      '& h2': {
        color: selected ? primary.contrastText : 'var(--text-primary)',
      },
    }
  },
)
