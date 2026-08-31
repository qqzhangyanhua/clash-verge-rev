import { CheckCircleOutlineRounded } from '@mui/icons-material'
import {
  alpha,
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  type SxProps,
  type Theme,
} from '@mui/material'
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
  layout?: 'row' | 'table'
  sx?: SxProps<Theme>
  onClick?: (member: ResolvedProxyMember) => void
}

const Widget = styled(Box)(() => ({
  padding: '3px 6px',
  fontSize: 14,
  borderRadius: '4px',
}))

const TypeBox = styled('span')(({ theme }) => ({
  display: 'inline-block',
  border: '1px solid #ccc',
  borderColor: alpha(theme.palette.text.secondary, 0.36),
  color: alpha(theme.palette.text.secondary, 0.42),
  borderRadius: 4,
  fontSize: 10,
  marginRight: '4px',
  padding: '0 2px',
  lineHeight: 1.25,
}))

export const ProxyItem = (props: Props) => {
  const { t } = useTranslation()
  const {
    group,
    member,
    selected,
    showType = true,
    layout = 'row',
    sx,
    onClick,
  } = props
  const table = layout === 'table'
  const details = memberDetails(member)
  const unresolved = member.kind === 'unresolved'
  const name = member.ref.name
  const type = unresolved ? member.ref.reason : (details?.type ?? '')
  const now = member.kind === 'group' ? member.group.now : undefined

  // -1/<=0 为不显示，-2 为 loading
  const { delayValue, isPreset, timeout, onDelay } = useProxyDelayState(
    member,
    group.name,
  )

  const statusTone = unresolved
    ? 'neutral'
    : details?.alive
      ? 'success'
      : 'error'
  const statusLabel = unresolved
    ? t('home.components.ipInfo.labels.unknown')
    : details?.alive
      ? t('proxies.page.labels.online')
      : t('proxies.page.labels.offline')
  const kindLabel =
    member.kind === 'group' ? type : t('proxies.page.labels.node')

  return (
    <ListItem disablePadding sx={sx}>
      <ListItemButton
        dense
        disabled={unresolved}
        selected={!unresolved && selected}
        onClick={unresolved ? undefined : () => onClick?.(member)}
        sx={[
          {
            borderRadius: table ? '10px' : 0,
            minHeight: table ? 42 : 36,
            height: table ? 42 : 36,
            mx: table ? 1 : 0,
            px: table ? 2 : 1.25,
            borderBottom: table ? 0 : '1px solid var(--divider-color)',
          },
          ({ palette: { primary } }) => {
            const showDelay = delayValue > 0

            return {
              '&:hover .the-check': { display: !showDelay ? 'block' : 'none' },
              '&:hover .the-delay': { display: showDelay ? 'block' : 'none' },
              '&:hover .the-icon': { display: 'none' },
              '&.Mui-selected': table
                ? {
                    bgcolor: 'var(--selected-row)',
                    boxShadow:
                      'inset 3px 0 0 var(--primary-main), var(--selection-glow)',
                  }
                : {
                    bgcolor: primary.main,
                    color: primary.contrastText,
                  },
              '&.Mui-selected:hover': table
                ? { bgcolor: 'var(--selected-row)' }
                : { bgcolor: primary.main },
              '&.Mui-selected .MuiListItemText-secondary, &.Mui-selected .MuiListItemText-secondary *':
                table
                  ? {}
                  : {
                      color: primary.contrastText,
                    },
            }
          },
        ]}
      >
        {table ? (
          <Box className="proxy-table__row" title={name}>
            <Box
              sx={{
                minWidth: 0,
                fontSize: 13,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
              {showType && now ? ` · ${now}` : ''}
            </Box>
            <Box className="proxy-group-item__chips">
              {type && <span className="proto-chip">{type}</span>}
              {!unresolved && details?.udp && (
                <span className="proto-chip">UDP</span>
              )}
            </Box>
            <Box sx={{ fontSize: 12, color: 'text.secondary' }}>
              {kindLabel}
            </Box>
            <Box
              sx={{
                fontSize: 12,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color:
                  delayValue > 0
                    ? delayManager.formatDelayColor(delayValue, timeout)
                    : 'text.secondary',
              }}
              onClick={(e) => {
                if (unresolved || isPreset) return
                e.preventDefault()
                e.stopPropagation()
                void onDelay()
              }}
            >
              {delayValue === -2
                ? '…'
                : delayValue > 0
                  ? delayManager.formatDelay(delayValue, timeout)
                  : '—'}
            </Box>
            <span className="proxy-status" data-tone={statusTone}>
              <span className="proxy-status__dot" data-tone={statusTone} />
              {statusLabel}
            </span>
          </Box>
        ) : (
          <ListItemText
            title={name}
            slotProps={{
              primary: { component: 'span' },
              secondary: { component: 'span' },
            }}
            secondary={
              <>
                <Box
                  sx={{
                    display: 'inline-block',
                    marginRight: '8px',
                    fontSize: '14px',
                    color: 'text.primary',
                  }}
                >
                  {name}
                  {showType && now && ` - ${now}`}
                </Box>
                {showType && <TypeBox>{type}</TypeBox>}
                {!unresolved && showType && details?.udp && (
                  <TypeBox>UDP</TypeBox>
                )}
                {!unresolved && showType && details?.xudp && (
                  <TypeBox>XUDP</TypeBox>
                )}
                {!unresolved && showType && details?.tfo && (
                  <TypeBox>TFO</TypeBox>
                )}
                {!unresolved && showType && details?.mptcp && (
                  <TypeBox>MPTCP</TypeBox>
                )}
                {!unresolved && showType && details?.smux && (
                  <TypeBox>SMUX</TypeBox>
                )}
              </>
            }
          />
        )}

        <ListItemIcon
          sx={{
            justifyContent: 'flex-end',
            color: 'primary.main',
            display: table || isPreset ? 'none' : '',
          }}
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
                display: 'none', // hover 时显示
                ':hover': { bgcolor: alpha(palette.primary.main, 0.15) },
              })}
            >
              {t('shared.actions.check')}
            </Widget>
          )}

          {!unresolved && delayValue > 0 && (
            // 显示延迟
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

          {!unresolved && delayValue !== -2 && delayValue <= 0 && selected && (
            // 展示已选择的 icon
            <CheckCircleOutlineRounded
              className="the-icon"
              sx={{ fontSize: 16 }}
            />
          )}
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  )
}
