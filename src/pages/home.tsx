import { HelpOutlineRounded, HistoryEduOutlined } from '@mui/icons-material'
import { Box, IconButton, Tooltip } from '@mui/material'
import { useLockFn } from 'ahooks'
import { useTranslation } from 'react-i18next'

import { BasePage } from '@/components/base'
import { CurrentProxyCard } from '@/components/home/current-proxy-card'
import { HomeProfileCard } from '@/components/home/home-profile-card'
import { HomeTrafficRow } from '@/components/home/home-traffic-row'
import { IpInfoCard } from '@/components/home/ip-info-card'
import { useProfiles } from '@/hooks/use-profiles'
import { entry_lightweight_mode } from '@/services/cmds'
import { showNotice } from '@/services/notice-service'
import { openExternalUrl } from '@/utils/open-external-url'

const HomePage = () => {
  const { t } = useTranslation()
  const { current, mutateProfiles } = useProfiles()

  const toGithubDoc = useLockFn(() =>
    openExternalUrl('https://clash-verge-rev.github.io/index.html').catch(
      showNotice.error,
    ),
  )

  return (
    <BasePage
      title={t('home.page.title')}
      contentStyle={{ padding: 16 }}
      header={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={t('home.page.tooltips.lightweightMode')} arrow>
            <IconButton
              onClick={async () => await entry_lightweight_mode()}
              size="small"
              color="inherit"
            >
              <HistoryEduOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('home.page.tooltips.manual')} arrow>
            <IconButton onClick={toGithubDoc} size="small" color="inherit">
              <HelpOutlineRounded />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <Box className="home-console">
        <HomeProfileCard current={current} onProfileUpdated={mutateProfiles} />
        <CurrentProxyCard />
        <HomeTrafficRow />
        <IpInfoCard />
      </Box>
    </BasePage>
  )
}

export default HomePage
