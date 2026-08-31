import { Box, type BoxProps } from '@mui/material'

export const ProfileBox = ({ className, ...props }: BoxProps) => (
  <Box
    className={['profile-card', className].filter(Boolean).join(' ')}
    {...props}
  />
)
