import {
  CloudUploadOutlined,
  LaunchOutlined,
  StorageOutlined,
} from '@mui/icons-material'
import { Box, Button, LinearProgress, Link, Typography } from '@mui/material'
import { useLockFn } from 'ahooks'
import dayjs from 'dayjs'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { useAppRefreshers } from '@/providers/app-data-context'
import { updateProfile } from '@/services/cmds'
import { showNotice } from '@/services/notice-service'
import { openExternalUrl } from '@/utils/open-external-url'
import parseTraffic from '@/utils/parse-traffic'

import { EnhancedCard } from './enhanced-card'

const parseUrl = (url?: string) => {
  if (!url) return '-'
  if (url.startsWith('http')) return new URL(url).host
  return 'local'
}

const parseExpire = (expire?: number) => {
  if (!expire) return '-'
  return dayjs(expire * 1000).format('YYYY-MM-DD')
}

const openProfileHome = (url: string) => {
  void openExternalUrl(url).catch(showNotice.error)
}

const ProfileDetailRow = ({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
}) => (
  <Box
    className="home-profile-rows__row"
    onClick={onClick}
    sx={onClick ? { cursor: 'pointer' } : undefined}
  >
    <Typography className="home-profile-rows__label">{label}</Typography>
    <Box className="home-profile-rows__value">{children}</Box>
  </Box>
)

const ProfileDetails = ({
  current,
  onUpdateProfile,
}: {
  current: IProfileItem
  onUpdateProfile: () => void
}) => {
  const { t } = useTranslation()

  const usedTraffic = useMemo(() => {
    if (!current.extra) return 0
    return current.extra.upload + current.extra.download
  }, [current.extra])

  const trafficPercentage = useMemo(() => {
    if (!current.extra || !current.extra.total || current.extra.total <= 0) {
      return 0
    }
    return Math.min(Math.round((usedTraffic / current.extra.total) * 100), 100)
  }, [current.extra, usedTraffic])

  return (
    <Box className="home-profile-rows">
      {current.url && (
        <ProfileDetailRow label={t('shared.labels.from')}>
          {current.home ? (
            <Link
              component="button"
              onClick={() => current.home && openProfileHome(current.home)}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                maxWidth: '100%',
                fontWeight: 500,
              }}
              title={parseUrl(current.url)}
            >
              <Typography component="span" noWrap>
                {parseUrl(current.url)}
              </Typography>
              <LaunchOutlined sx={{ ml: 0.5, fontSize: '0.8rem' }} />
            </Link>
          ) : (
            <Typography component="span" noWrap title={parseUrl(current.url)}>
              {parseUrl(current.url)}
            </Typography>
          )}
        </ProfileDetailRow>
      )}

      {current.updated && (
        <ProfileDetailRow
          label={t('shared.labels.updateTime')}
          onClick={onUpdateProfile}
        >
          {dayjs(current.updated * 1000).format('YYYY-MM-DD HH:mm')}
        </ProfileDetailRow>
      )}

      {current.extra && (
        <>
          <ProfileDetailRow label={t('shared.labels.usedTotal')}>
            {parseTraffic(usedTraffic)} / {parseTraffic(current.extra.total)}
          </ProfileDetailRow>

          {current.extra.expire > 0 && (
            <ProfileDetailRow label={t('shared.labels.expireTime')}>
              {parseExpire(current.extra.expire)}
            </ProfileDetailRow>
          )}

          <Box sx={{ pt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={trafficPercentage}
              sx={{ height: 3, borderRadius: 1 }}
            />
          </Box>
        </>
      )}
    </Box>
  )
}

const EmptyProfile = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
        borderRadius: 1,
      }}
      onClick={onClick}
    >
      <CloudUploadOutlined
        sx={{ fontSize: 28, color: 'text.secondary', mb: 1 }}
      />
      <Typography variant="body2">
        {t('profiles.page.actions.import')} {t('profiles.page.title')}
      </Typography>
    </Box>
  )
}

interface HomeProfileCardProps {
  current: IProfileItem | null | undefined
  onProfileUpdated?: () => void
}

export const HomeProfileCard = ({
  current,
  onProfileUpdated,
}: HomeProfileCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refreshAll } = useAppRefreshers()
  const [updating, setUpdating] = useState(false)

  const onUpdateProfile = useLockFn(async () => {
    if (!current?.uid || updating) return

    setUpdating(true)
    try {
      await updateProfile(current.uid, current.option)
      onProfileUpdated?.()
      refreshAll()
    } catch (err) {
      showNotice.error(err, 3000)
    } finally {
      setUpdating(false)
    }
  })

  const goToProfiles = useCallback(() => {
    navigate('/profile')
  }, [navigate])

  const cardTitle = useMemo(() => {
    if (!current) return t('profiles.page.title')
    if (!current.home) return current.name

    return (
      <Link
        component="button"
        variant="body2"
        onClick={() => current.home && openProfileHome(current.home)}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          maxWidth: '100%',
          fontWeight: 600,
          fontSize: 13,
        }}
        title={current.name}
      >
        <span>{current.name}</span>
        <LaunchOutlined
          fontSize="inherit"
          sx={{ ml: 0.5, fontSize: '0.8rem', opacity: 0.7, flexShrink: 0 }}
        />
      </Link>
    )
  }, [current, t])

  const cardAction = useMemo(() => {
    if (!current) return null

    return (
      <Button
        variant="text"
        size="small"
        onClick={goToProfiles}
        endIcon={<StorageOutlined fontSize="small" />}
      >
        {t('layout.components.navigation.tabs.profiles')}
      </Button>
    )
  }, [current, goToProfiles, t])

  return (
    <EnhancedCard
      title={cardTitle}
      icon={<CloudUploadOutlined />}
      iconColor="info"
      action={cardAction}
    >
      {current ? (
        <ProfileDetails current={current} onUpdateProfile={onUpdateProfile} />
      ) : (
        <EmptyProfile onClick={goToProfiles} />
      )}
    </EnhancedCard>
  )
}
