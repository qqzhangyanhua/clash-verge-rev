import { Box } from '@mui/material'

import { CurrentProxyPickers } from '@/components/home/current-proxy-card'
import { HomeHeroCard } from '@/components/home/home-hero-card'
import { HomeProfileCard } from '@/components/home/home-profile-card'
import { HomeTrafficRow } from '@/components/home/home-traffic-row'
import { IpInfoCard } from '@/components/home/ip-info-card'
import { useCurrentProxyCard } from '@/components/home/use-current-proxy-card'
import { useProfiles } from '@/hooks/use-profiles'

export const HomeDashboard = () => {
  const { current, mutateProfiles } = useProfiles()
  const controller = useCurrentProxyCard()

  return (
    <Box className="home-dashboard">
      <HomeHeroCard model={controller.model} />
      <Box className="home-dashboard__modules">
        <HomeProfileCard current={current} onProfileUpdated={mutateProfiles} />
        <CurrentProxyPickers controller={controller} />
        <HomeTrafficRow />
        <IpInfoCard />
      </Box>
    </Box>
  )
}
