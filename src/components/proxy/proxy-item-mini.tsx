import { CheckCircleOutlineRounded } from '@mui/icons-material'
import { alpha, Box, ListItemButton, styled } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { BaseLoading } from '@/components/base'
import { useProxyDelayState } from '@/hooks/use-proxy-delay-state'
import delayManager from '@/services/delay'
import {
  memberDetails,
  type ProxyGroupView,
  type ResolvedProxyMember,
} from '@/types/proxy-view'

interface Props {
  group: ProxyGroupView
  member: ResolvedProxyMember
  selected: boolean
  showType?: boolean
  onClick?: (member: ResolvedProxyMember) => void
}

export const ProxyItemMini = (props: Props) => {
  const { group, member, selected, showType = true, onClick } = props
  const details = memberDetails(member)
  const unresolved = member.kind === 'unresolved'
  const name = member.ref.name
  const type = unresolved ? member.ref.reason : (details?.type ?? '')
  const now = member.kind === 'group' ? member.group.now : undefined
  const { t } = useTranslation()
  const { delayValue, isPreset, timeout, onDelay } = useProxyDelayState(
    member,
    group.name,
  )
  const showDelay = delayValue > 0

  return (
    <ListItemButton
      dense
      disabled={unresolved}
      selected={!unresolved && selected}
      onClick={unresolved ? undefined : () => onClick?.(member)}
      className={`proxy-mini${!unresolved && selected ? ' is-selected' : ''}`}
      sx={{
        '&:hover .the-check': { display: !showDelay ? 'block' : 'none' },
        '&:hover .the-delay': { display: showDelay ? 'block' : 'none' },
        '&:hover .the-icon': { display: 'none' },
        '& .the-pin, & .the-unpin': {
          position: 'absolute',
          fontSize: '12px',
          top: '-5px',
          right: '-5px',
        },
        '& .the-unpin': { filter: 'grayscale(1)' },
      }}
    >
      <Box
        title={`${name}\n${now ?? ''}`}
        sx={{ overflow: 'hidden', minWidth: 0 }}
      >
        <div className="proxy-mini__name">{name}</div>
        {showType && (
          <div className="proxy-mini__chips">
            {now && <span className="proto-chip">{now}</span>}
            {type && <span className="proto-chip">{type}</span>}
            {!unresolved && details?.udp && (
              <span className="proto-chip">UDP</span>
            )}
            {!unresolved && details?.xudp && (
              <span className="proto-chip">XUDP</span>
            )}
            {!unresolved && details?.tfo && (
              <span className="proto-chip">TFO</span>
            )}
            {!unresolved && details?.mptcp && (
              <span className="proto-chip">MPTCP</span>
            )}
            {!unresolved && details?.smux && (
              <span className="proto-chip">SMUX</span>
            )}
          </div>
        )}
      </Box>
      <Box
        sx={{ ml: 0.5, color: 'primary.main', display: isPreset ? 'none' : '' }}
      >
        {!unresolved && delayValue === -2 && (
          <Widget>
            <BaseLoading />
          </Widget>
        )}
        {!unresolved && delayValue !== -2 && (
          <Widget
            className="the-check"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void onDelay()
            }}
            sx={({ palette }) => ({
              display: 'none',
              ':hover': { bgcolor: alpha(palette.primary.main, 0.15) },
            })}
          >
            {t('shared.actions.check')}
          </Widget>
        )}
        {!unresolved && delayValue >= 0 && (
          <Widget
            className="the-delay"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void onDelay()
            }}
            sx={({ palette }) => ({
              color: delayManager.formatDelayColor(delayValue, timeout),
              ':hover': { bgcolor: alpha(palette.primary.main, 0.15) },
            })}
          >
            {delayManager.formatDelay(delayValue, timeout)}
          </Widget>
        )}
        {!unresolved &&
          type !== 'Direct' &&
          delayValue !== -2 &&
          delayValue < 0 &&
          selected && (
            <CheckCircleOutlineRounded
              className="the-icon"
              sx={{ fontSize: 16, mr: 0.5, display: 'block' }}
            />
          )}
      </Box>
      {!unresolved && group.fixed && group.fixed === name && (
        <span
          className={name === group.now ? 'the-pin' : 'the-unpin'}
          title={
            group.type === 'URLTest'
              ? t('proxies.page.labels.delayCheckReset')
              : ''
          }
        >
          📌
        </span>
      )}
    </ListItemButton>
  )
}

const Widget = styled(Box)(({ theme: { typography } }) => ({
  padding: '2px 4px',
  fontSize: 14,
  fontFamily: typography.fontFamily,
  borderRadius: '4px',
}))
