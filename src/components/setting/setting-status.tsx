import { Box, Grid, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { ClashInfoCard } from '@/components/home/clash-info-card'
import { SystemInfoCard } from '@/components/home/system-info-card'
import { TestCard } from '@/components/home/test-card'

const SettingStatus = () => {
  const { t } = useTranslation()

  return (
    <Box>
      <Typography
        sx={{
          px: 2,
          py: 1,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {t('settings.sections.status.title')}
      </Typography>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ClashInfoCard />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SystemInfoCard />
        </Grid>
        <Grid size={12}>
          <TestCard />
        </Grid>
      </Grid>
    </Box>
  )
}

export default SettingStatus
