import { ChevronRight } from '@mui/icons-material'
import { Box, Popper, Typography } from '@mui/material'
import {
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useRef,
} from 'react'

import { type CardRow } from './current-proxy-card-view'

const mergeRefs = <T,>(
  ...refs: Array<Ref<T> | undefined>
): ((node: T | null) => void) => {
  return (node) => {
    for (const ref of refs) {
      if (ref == null) continue
      if (typeof ref === 'function') {
        ref(node)
      } else {
        ref.current = node
      }
    }
  }
}

export const CurrentProxyCardRow = ({
  id,
  row,
  open,
  pickerId,
  rowRef,
  onToggle,
  children,
}: {
  id: string
  row: CardRow
  open: boolean
  pickerId: string
  rowRef?: Ref<HTMLButtonElement>
  onToggle: () => void
  children: ReactNode
}) => {
  const localRef = useRef<HTMLButtonElement>(null)
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      mergeRefs(localRef, rowRef)(node)
    },
    [rowRef],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!row.tappable) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <Box className="current-proxy-card__row-wrap">
      <Box
        component="button"
        type="button"
        id={id}
        ref={setRefs}
        disabled={!row.tappable}
        data-tappable={row.tappable ? 'true' : 'false'}
        className="current-proxy-card__row"
        aria-haspopup={row.tappable ? 'listbox' : undefined}
        aria-expanded={row.tappable ? open : undefined}
        aria-controls={open ? pickerId : undefined}
        onClick={row.tappable ? onToggle : undefined}
        onKeyDown={handleKeyDown}
      >
        <Typography className="current-proxy-card__label">
          {row.label}
        </Typography>
        <Box className="current-proxy-card__value">
          <Typography noWrap className="current-proxy-card__name">
            {row.value}
          </Typography>
          {row.tappable && (
            <ChevronRight
              fontSize="small"
              className="current-proxy-card__chevron"
            />
          )}
        </Box>
      </Box>
      <Popper
        open={open}
        anchorEl={localRef.current}
        placement="bottom-start"
        sx={{
          width: localRef.current?.clientWidth,
          zIndex: (theme) => theme.zIndex.modal,
        }}
      >
        {children}
      </Popper>
    </Box>
  )
}
