import {
  RefreshOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import { Box, Button, IconButton, Skeleton, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVisibility } from '@/hooks/use-visibility'
import { getIpInfo } from '@/services/api'
import { useQuery } from '@/services/query-client'

const IP_REFRESH_MS = 300_000
const IP_INFO_CACHE_KEY = 'cv_ip_info_cache'

const getCountryFlag = (countryCode: string | undefined) => {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const useIPInfo = () =>
  useQuery({
    queryKey: [IP_INFO_CACHE_KEY],
    queryFn: getIpInfo,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 30_000,
  })

export const IpInfoCard = () => {
  const { t } = useTranslation()
  const [showIp, setShowIp] = useState(false)
  const pageVisible = useVisibility()
  const { data: ipInfo, error, isLoading, refetch: mutate } = useIPInfo()

  useEffect(() => {
    if (!pageVisible) return

    const timer = window.setInterval(() => {
      if (navigator.onLine) {
        void mutate()
      }
    }, IP_REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [mutate, pageVisible])

  const toggleShowIp = useCallback(() => {
    setShowIp((prev) => !prev)
  }, [])

  const location =
    [ipInfo?.city, ipInfo?.region].filter(Boolean).join(', ') ||
    ipInfo?.country ||
    t('home.components.ipInfo.labels.unknown')

  return (
    <Box className="home-console__row">
      {isLoading ? (
        <Skeleton variant="text" width="70%" height={24} />
      ) : error ? (
        <>
          <Typography
            variant="body2"
            color="error"
            sx={{ flex: 1, minWidth: 0 }}
          >
            {error instanceof Error
              ? error.message
              : t('home.components.ipInfo.errors.load')}
          </Typography>
          <Button size="small" onClick={() => mutate()}>
            {t('shared.actions.retry')}
          </Button>
        </>
      ) : (
        <>
          <Box
            component="span"
            sx={{
              fontSize: '1.15rem',
              width: 24,
              textAlign: 'center',
              flexShrink: 0,
              fontFamily: '"twemoji mozilla", sans-serif',
              lineHeight: 1,
            }}
          >
            {getCountryFlag(ipInfo?.country_code)}
          </Box>
          <Typography
            variant="body2"
            noWrap
            sx={{ flexShrink: 1, minWidth: 0 }}
          >
            {location}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              flexShrink: 0,
            }}
          >
            {showIp ? ipInfo?.ip : '••••••••••'}
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', flexShrink: 0 }}>
            <IconButton
              size="small"
              onClick={toggleShowIp}
              aria-label={
                showIp
                  ? t('shared.actions.hideDetails')
                  : t('shared.actions.showDetails')
              }
            >
              {showIp ? (
                <VisibilityOffOutlined fontSize="small" />
              ) : (
                <VisibilityOutlined fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => mutate()}
              aria-label={t('shared.actions.refresh')}
            >
              <RefreshOutlined fontSize="small" />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  )
}
