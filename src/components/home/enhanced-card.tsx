import { Box, Typography } from '@mui/material'
import { forwardRef, type ReactNode } from 'react'

interface EnhancedCardProps {
  title: ReactNode
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
  iconColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  minHeight?: number | string
  noContentPadding?: boolean
}

export const EnhancedCard = forwardRef<HTMLElement, EnhancedCardProps>(
  (
    {
      title,
      icon,
      action,
      children,
      iconColor = 'primary',
      minHeight,
      noContentPadding = false,
    },
    ref,
  ) => {
    const titleTruncateStyle = {
      minWidth: 0,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'block',
    } as const

    return (
      <Box
        className="inset-group"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        ref={ref}
      >
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            borderBottom: '1px solid var(--divider-color)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              flex: 1,
              overflow: 'hidden',
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: `${iconColor}.main`,
                flexShrink: 0,
                '& .MuiSvgIcon-root': { fontSize: 18 },
              }}
            >
              {icon}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {typeof title === 'string' ? (
                <Typography
                  sx={{
                    ...titleTruncateStyle,
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                  title={title}
                >
                  {title}
                </Typography>
              ) : (
                <Box
                  sx={{
                    ...titleTruncateStyle,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {title}
                </Box>
              )}
            </Box>
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: noContentPadding ? 0 : 1.5,
            ...(minHeight && { minHeight }),
          }}
        >
          {children}
        </Box>
      </Box>
    )
  },
)
