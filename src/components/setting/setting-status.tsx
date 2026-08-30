import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { ClashInfoCard } from '@/components/home/clash-info-card'
import { SystemInfoCard } from '@/components/home/system-info-card'
import { TestCard } from '@/components/home/test-card'

const SettingStatus = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Box className="inset-group-block__title">
        {t('settings.sections.status.title')}
      </Box>
      <ClashInfoCard />
      <SystemInfoCard />
      <TestCard />
    </Box>
  )
}

export default SettingStatus
