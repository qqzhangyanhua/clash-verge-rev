import { Box, ClickAwayListener, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { CurrentProxyCardRow } from './current-proxy-card-rows'
import { GroupPickerList, ProxyPickerList } from './current-proxy-pickers'
import {
  useCurrentProxyCard,
  type CurrentProxyCardController,
} from './use-current-proxy-card'

const GROUP_PICKER_ID = 'current-proxy-group-listbox'
const PROXY_PICKER_ID = 'current-proxy-node-listbox'

export const CurrentProxyPickers = ({
  controller,
}: {
  controller: CurrentProxyCardController
}) => {
  const { t } = useTranslation()
  const {
    model,
    sortType,
    groupRowRef,
    proxyRowRef,
    checkDelayDisabled,
    togglePicker,
    closePicker,
    handleGroupChange,
    handleProxyChange,
    handleCheckDelay,
    handleSortTypeChange,
  } = controller

  return (
    <ClickAwayListener onClickAway={() => closePicker()}>
      <Box className="home-module current-proxy-card">
        <Typography className="home-module__title">
          {t('home.components.currentProxy.title')}
        </Typography>
        <CurrentProxyCardRow
          id="current-proxy-group-row"
          row={model.view.groupRow}
          open={model.view.openPicker === 'group'}
          pickerId={GROUP_PICKER_ID}
          rowRef={groupRowRef}
          onToggle={() => togglePicker('group')}
        >
          <GroupPickerList
            id={GROUP_PICKER_ID}
            labelledBy="current-proxy-group-row"
            options={model.groupOptions}
            onSelect={handleGroupChange}
          />
        </CurrentProxyCardRow>
        <CurrentProxyCardRow
          id="current-proxy-node-row"
          row={model.view.proxyRow}
          open={model.view.openPicker === 'proxy'}
          pickerId={PROXY_PICKER_ID}
          rowRef={proxyRowRef}
          onToggle={() => togglePicker('proxy')}
        >
          <ProxyPickerList
            id={PROXY_PICKER_ID}
            labelledBy="current-proxy-node-row"
            options={model.proxyOptions}
            sortType={sortType}
            checkDisabled={checkDelayDisabled}
            onSelect={handleProxyChange}
            onCheckDelay={() => {
              void handleCheckDelay()
            }}
            onSortTypeChange={handleSortTypeChange}
          />
        </CurrentProxyCardRow>
      </Box>
    </ClickAwayListener>
  )
}

export const CurrentProxyCard = () => {
  const controller = useCurrentProxyCard()
  return <CurrentProxyPickers controller={controller} />
}
