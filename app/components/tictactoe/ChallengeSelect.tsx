import { useEffect, useId, useRef, useState } from "react"

const challenges = [
  {
    value: "perfect",
    title: "Unbeatable",
    subtitle: "Perfect play. Rise to the challenge.",
    icon: "✦",
    tag: "EXPERT",
  },
  {
    value: "casual",
    title: "Casual",
    subtitle: "Room to explore. Space to learn.",
    icon: "☀",
    tag: "RELAXED",
  },
]

export default function ChallengeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const selected = Math.max(
    0,
    challenges.findIndex((option) => option.value === value)
  )
  const [active, setActive] = useState(selected)
  const choice = challenges[selected]

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", dismiss)
    return () => document.removeEventListener("pointerdown", dismiss)
  }, [open])

  function choose(index: number) {
    if (challenges[index].value !== value) onChange(challenges[index].value)
    setOpen(false)
    trigger.current?.focus()
  }

  return (
    <div
      className="challenge-select"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label id={`${id}-label`} htmlFor={`${id}-trigger`}>
        Choose your challenge
      </label>
      <button
        ref={trigger}
        id={`${id}-trigger`}
        type="button"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-options` : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        className={`challenge-trigger ${open ? "is-open" : ""}`}
        onClick={() => {
          setActive(selected)
          setOpen(!open)
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault()
            setOpen(true)
            setActive(
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? challenges.length - 1
                  : !open
                    ? selected
                    : (active +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        challenges.length) %
                      challenges.length
            )
          } else if (event.key === "Escape") {
            event.preventDefault()
            setOpen(false)
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            if (open) choose(active)
            else {
              setActive(selected)
              setOpen(true)
            }
          } else if (event.key === "Tab") setOpen(false)
          else {
            const match = challenges.findIndex((option) =>
              option.title.toLowerCase().startsWith(event.key.toLowerCase())
            )
            if (event.key.length === 1 && match >= 0) {
              event.preventDefault()
              setActive(match)
              setOpen(true)
            }
          }
        }}
      >
        <span className={`challenge-emblem ${choice.value}`} aria-hidden="true">
          {choice.icon}
        </span>
        <span className="challenge-current" id={`${id}-value`}>
          <strong>{choice.title}</strong>
          <small>
            {choice.value === "perfect" ? "Perfect play" : "Room to experiment"}
          </small>
        </span>
        <svg
          className="challenge-chevron"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="m4 6 4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="challenge-menu"
          role="listbox"
          id={`${id}-options`}
          aria-labelledby={`${id}-label`}
        >
          {challenges.map((option, index) => (
            <button
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={selected === index}
              id={`${id}-option-${index}`}
              key={option.value}
              className={`challenge-option ${active === index ? "is-active" : ""}`}
              onPointerMove={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
            >
              <span
                className={`challenge-emblem ${option.value}`}
                aria-hidden="true"
              >
                {option.icon}
              </span>
              <span className="challenge-option-copy">
                <span className="challenge-option-title">
                  <strong>{option.title}</strong>
                  <span className="challenge-tag">{option.tag}</span>
                </span>
                <small>{option.subtitle}</small>
              </span>
              <span className="challenge-check" aria-hidden="true">
                {selected === index ? "✓" : ""}
              </span>
            </button>
          ))}
          <div className="challenge-menu-foot" aria-hidden="true">
            YOUR PACE. YOUR NEXT AHA.
          </div>
        </div>
      )}
    </div>
  )
}
