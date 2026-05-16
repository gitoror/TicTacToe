import { css } from "@emotion/react"
import { cx } from "../../../utils/cx"
import "./BasicButton.css"

export type BasicButtonProps = {
  size: "small" | "medium" | "large"
  children: React.ReactNode
  backgroundColor?: "primary" | "secondary" | "success" | "danger"
  logo?: React.ReactNode
  onClick: () => void
  className?: string
  style?: React.CSSProperties
}

export const BasicButton = ({
  size,
  children,
  backgroundColor = "primary",
  onClick,
  logo,
  className,
  style,
}: BasicButtonProps) => {
  const classes = cx([
    "basic-button",
    `basic-button--${size}`,
    `basic-button--${backgroundColor}`,
    className,
  ])
  return (
    <button className={classes} onClick={onClick} style={style}>
      {logo && <span className="basic-button__logo">{logo}</span>}
      {children}
      <div
        css={css`
          padding: 0.5rem;
        `}
      ></div>
    </button>
  )
}
