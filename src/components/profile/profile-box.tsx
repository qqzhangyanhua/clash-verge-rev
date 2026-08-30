import { Box, styled } from '@mui/material'

export const ProfileBox = styled(Box)(({ 'aria-selected': selected }) => ({
  position: 'relative',
  display: 'block',
  cursor: 'pointer',
  textAlign: 'left',
  padding: '10px 12px',
  boxSizing: 'border-box',
  width: '100%',
  backgroundColor: selected ? 'var(--selected-row)' : 'var(--content-color)',
  border: '1px solid var(--divider-color)',
  borderRadius: 'var(--border-radius)',
  color: 'var(--text-secondary)',
  '& h2': {
    color: 'var(--text-primary)',
  },
}))
