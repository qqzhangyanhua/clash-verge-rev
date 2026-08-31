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
import { getCountryFlag } from '@/utils/country-flag'

const IP_REFRESH_MS = 300_000
const IP_INFO_CACHE_KEY = 'cv_ip_info_cache'

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
    <Box className="home-module home-ip">
      <Box className="home-module__header">
        <Typography className="home-module__title">
          {t('home.components.ipInfo.title')}
        </Typography>
        <Box className="home-ip__actions">
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
      </Box>
      {isLoading ? (
        <Skeleton variant="text" width="70%" height={32} />
      ) : error ? (
        <Box className="home-ip__error">
          <Typography variant="body2" color="error" sx={{ minWidth: 0 }}>
            {error instanceof Error
              ? error.message
              : t('home.components.ipInfo.errors.load')}
          </Typography>
          <Button size="small" onClick={() => mutate()}>
            {t('shared.actions.retry')}
          </Button>
        </Box>
      ) : (
        <Box className="home-ip__body">
          <span className="home-ip__flag">
            {getCountryFlag(ipInfo?.country_code)}
          </span>
          <Box className="home-ip__copy">
            <Typography className="home-ip__location">{location}</Typography>
            <Typography className="home-ip__address">
              {showIp ? ipInfo?.ip : '••••••••••'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}
