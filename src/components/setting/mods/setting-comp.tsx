import { ChevronRightRounded } from '@mui/icons-material'
import CircularProgress from '@mui/material/CircularProgress'
import { type ReactNode, useState } from 'react'

interface ItemProps {
  label: ReactNode
  extra?: ReactNode
  children?: ReactNode
  secondary?: ReactNode
  onClick?: () => Promise<unknown> | void
}

export const SettingItem = ({
  label,
  extra,
  children,
  secondary,
  onClick,
}: ItemProps) => {
  const clickable = !!onClick
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    if (!onClick) return
    const result = onClick()
    if (result) {
      setIsLoading(true)
      void result.finally(() => setIsLoading(false))
    }
  }

  return (
    <div
      className={`setting-row${clickable ? ' is-clickable' : ''}`}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleClick()
              }
            }
          : undefined
      }
    >
      <div className="setting-row__main">
        <div className="setting-row__label">
          <span>{label}</span>
          {extra}
        </div>
        {secondary ? (
          <div className="setting-row__secondary">{secondary}</div>
        ) : null}
      </div>
      <div className="setting-row__control">
        {clickable ? (
          isLoading ? (
            <CircularProgress color="inherit" size={16} />
          ) : (
            <ChevronRightRounded fontSize="small" />
          )
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export const SettingList = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="setting-panel">
    <div className="setting-panel__title">{title}</div>
    <div className="setting-panel__list">{children}</div>
  </section>
)
