import { useEffect, useRef, useState } from "react"
import ChallengeSelect from "./ChallengeSelect"
import type { PeerRoom, PeerRoomClient } from "./peerRoom.client"
import {
  emptyBoard,
  explain,
  moves,
  other,
  result,
  type Board,
  type Mark,
} from "./engine"
type Mode = "train" | "local" | "online"
type Remote = PeerRoom & {
  token?: string
}
const lessons = [
  [
    "Win before you block",
    "Look for your own three in a row first. If you cannot win, stop an immediate threat.",
  ],
  [
    "See the fork",
    "A fork creates two winning lines at once. Build your own, and watch for your opponent’s.",
  ],
  [
    "Make a draw your floor",
    "Two perfect players always draw. Becoming unbeatable means never giving away a forced loss.",
  ],
]
export default function Nought() {
  const [mode, setMode] = useState<Mode>("train")
  const [history, setHistory] = useState<Board[]>([emptyBoard()])
  const [human, setHuman] = useState<Mark>("X")
  const [difficulty, setDifficulty] = useState("perfect")
  const [hint, setHint] = useState(false)
  const [feedback, setFeedback] = useState(
    "A fresh board. A little strategy. Your next great move."
  )
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 })
  const [room, setRoom] = useState<Remote | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [lesson, setLesson] = useState(0)
  const [sound, setSound] = useState(false)
  const peerRoom = useRef<PeerRoomClient | null>(null)
  const board =
    mode === "online" && room ? room.board : history[history.length - 1]
  const turn: Mark =
    mode === "online" && room ? room.turn : history.length % 2 ? "X" : "O"
  const end = result(board)
  const thinking =
    mode === "train" && turn !== human && !end.winner && !end.draw
  const ranked = moves(board, turn),
    best = ranked[0]
  useEffect(() => {
    const invited = new URLSearchParams(location.search).get("room")
    if (invited) {
      setCode(invited.toUpperCase())
      setMode("online")
    }
  }, [])
  useEffect(() => {
    if (!thinking) return
    const timer = setTimeout(() => {
      const options = moves(board, turn)
      const move =
        difficulty === "casual" && Math.random() < 0.45
          ? options[Math.floor(Math.random() * options.length)]
          : options[0]
      if (move)
        setHistory((h) => [
          ...h,
          board.map((v, i) => (i === move.i ? turn : v)),
        ])
    }, 550)
    return () => clearTimeout(timer)
  }, [thinking, board, turn, difficulty])
  useEffect(() => {
    if (import.meta.env.VITE_STATIC_PAGES || mode !== "online" || !room) return
    const controller = new AbortController()
    let running = false
    const timer = setInterval(async () => {
      if (running) return
      running = true
      try {
        const response = await fetch(`/api/room?id=${room.id}`, {
          headers: { Authorization: `Bearer ${room.token}` },
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setRoom((current) =>
          current && current.id === data.id
            ? { ...data, token: current.token }
            : current
        )
        setError("")
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Connection lost. Retrying…"
          )
      } finally {
        running = false
      }
    }, 1200)
    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [mode, room?.id, room?.token])
  useEffect(
    () => () => {
      peerRoom.current?.destroy()
    },
    []
  )
  function reset() {
    setHistory([emptyBoard()])
    setHint(false)
    setFeedback("A fresh board. A little strategy. Your next great move.")
  }
  function changeMode(next: Mode) {
    if (import.meta.env.VITE_STATIC_PAGES && next !== "online") {
      peerRoom.current?.destroy()
      peerRoom.current = null
      setRoom(null)
    }
    setMode(next)
    reset()
    setScores({ X: 0, O: 0, draw: 0 })
    setError("")
  }
  function tone() {
    if (!sound) return
    try {
      const ctx = new AudioContext(),
        o = ctx.createOscillator(),
        g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = turn === "X" ? 440 : 620
      g.gain.setValueAtTime(0.04, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13)
      o.start()
      o.stop(ctx.currentTime + 0.15)
      o.onended = () => {
        void ctx.close()
      }
    } catch {
      /* optional audio */
    }
  }
  async function online(action: string, index?: number) {
    setBusy(true)
    setError("")
    try {
      if (import.meta.env.VITE_STATIC_PAGES) {
        if (!peerRoom.current) {
          const { PeerRoomClient } = await import("./peerRoom.client")
          peerRoom.current = new PeerRoomClient(setRoom, setError)
        }
        let connectedRoom: PeerRoom | undefined
        if (action === "create") connectedRoom = await peerRoom.current.create()
        else if (action === "join")
          connectedRoom = await peerRoom.current.join(code)
        else peerRoom.current.act(action as "move" | "rematch", index)
        if (connectedRoom) {
          setCode(connectedRoom.id)
          const roomUrl = new URL(window.location.href)
          roomUrl.searchParams.set("room", connectedRoom.id)
          window.history.replaceState(null, "", roomUrl)
        }
        return
      }
      const id = room?.id ?? code.trim().toUpperCase(),
        saved = sessionStorage.getItem(`xo-room-${id}`)
      const response = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          id,
          token: room?.token ?? saved,
          index,
          round: room?.round,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      const credential = data.token ?? room?.token ?? saved
      sessionStorage.setItem(`xo-room-${data.id}`, credential)
      setRoom({ ...data, token: credential })
      setCode(data.id)
      const roomUrl = new URL(window.location.href)
      roomUrl.searchParams.set("room", data.id)
      window.history.replaceState(null, "", roomUrl)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not connect. Please try again."
      )
    } finally {
      setBusy(false)
    }
  }
  function play(i: number) {
    if (board[i] || end.winner || end.draw || thinking) return
    if (mode === "online") {
      if (room?.ready && room.mark === turn && !busy) {
        tone()
        void online("move", i)
      }
      return
    }
    tone()
    if (mode === "train" && best) {
      const chosen = ranked.find((m) => m.i === i)!
      setFeedback(
        chosen.score < best.score
          ? `A learning moment: ${best.score === 1 ? "you had a forced win" : "you could have held a draw"}. Undo and explore square ${best.i + 1}.`
          : `Good move. ${explain(board, turn, i)}`
      )
    }
    setHint(false)
    setHistory((h) => [...h, board.map((v, j) => (j === i ? turn : v))])
  }
  function nextRound() {
    if (mode === "online") {
      void online("rematch")
      return
    }
    if (end.winner || end.draw)
      setScores((s) => ({
        ...s,
        [end.winner ?? "draw"]: s[end.winner ?? "draw"] + 1,
      }))
    reset()
  }
  const title = end.winner
    ? `${mode === "train" && end.winner === human ? "You" : end.winner} won the round!`
    : end.draw
      ? "A perfectly good draw."
      : thinking
        ? "Your opponent is thinking…"
        : mode === "online"
          ? !room
            ? "Bring a friend. Make a move."
            : !room.ready
              ? "Waiting for your friend…"
              : room.mark === turn
                ? `Your turn (${room.mark}). Choose a square.`
                : `Waiting for ${turn} to play.`
          : mode === "train"
            ? "Your move. Make it count."
            : `${turn}’s turn. Take the board.`
  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          aria-label="Nought home"
        >
          <span className="brand-icon">
            ×<span>○</span>
          </span>
          nought<span className="brand-dot">.</span>
        </a>
        <span className="header-note">SMALL BOARD. BIG BRAIN.</span>
        <button
          className="sound-button"
          aria-pressed={sound}
          onClick={() => setSound(!sound)}
        >
          ♪ Sound {sound ? "on" : "off"}
        </button>
      </header>
      <main>
        <section className="intro">
          <div className="eyebrow">
            <span /> THE CLASSIC, WITH A LITTLE MORE PLAY
          </div>
          <h1>
            Nine squares.
            <br />
            Endless <em>aha moments.</em>
          </h1>
          <p>
            Find your edge, challenge a friend, and make every move a little
            smarter.
          </p>
        </section>
        <nav className="mode-tabs" aria-label="Game mode">
          {(
            [
              ["train", "✦", "Train your brain", "Play against the AI"],
              ["local", "⌘", "Play together", "Two players, one screen"],
              ["online", "↗", "Challenge a friend", "Your own online room"],
            ] as const
          ).map(([key, icon, label, sub]) => (
            <button
              key={key}
              className={mode === key ? "active" : ""}
              aria-pressed={mode === key}
              onClick={() => changeMode(key)}
            >
              <span className="mode-icon">{icon}</span>
              <span>
                <strong>{label}</strong>
                <small>{sub}</small>
              </span>
              <span className="mode-dot" />
            </button>
          ))}
        </nav>
        <div className="play-layout">
          <section className="game-card">
            <div className="game-top">
              <span className="pill">
                <span />
                {mode === "train"
                  ? "PRACTICE STUDIO"
                  : mode === "local"
                    ? "SIDE BY SIDE"
                    : "PRIVATE ROOM"}
              </span>
              <span className="round-label">
                {mode === "online"
                  ? room
                    ? `ROOM ${room.id}`
                    : "JUST YOU TWO"
                  : `ROUND ${scores.X + scores.O + scores.draw + 1}`}
              </span>
            </div>
            <div className="game-heading" aria-live="polite">
              <h2>{title}</h2>
              <p>
                {end.draw
                  ? "No gaps in the defense. That’s how unbeatable starts."
                  : end.winner
                    ? "Take a breath. There’s always another round."
                    : mode === "train"
                      ? `You’re ${human}. ${difficulty === "perfect" ? "Perfect" : "Casual"} AI is ${other(human)}. Let’s play.`
                      : mode === "local"
                        ? "Pass the turn, keep the rivalry friendly."
                        : room
                          ? `You’re ${room.mark}. Share the room and meet on the board.`
                          : "Create a room or enter a friend’s code to get started."}
              </p>
            </div>
            <div className="board" aria-label="Tic tac toe board">
              {board.map((cell, i) => (
                <button
                  key={i}
                  aria-label={`Square ${i + 1}, ${cell ?? "empty"}${hint && best?.i === i ? ", suggested move" : ""}`}
                  disabled={
                    !!cell ||
                    !!end.winner ||
                    end.draw ||
                    thinking ||
                    (mode === "online" &&
                      (!room?.ready || room.mark !== turn || busy))
                  }
                  className={`square ${cell?.toLowerCase() ?? ""} ${end.line.includes(i) ? "winning" : ""} ${hint && best?.i === i ? "hinted" : ""}`}
                  onClick={() => play(i)}
                >
                  {cell ? (
                    <span className={`mark mark-${cell.toLowerCase()}`} />
                  ) : hint && best?.i === i ? (
                    <span className="hint-star">✦</span>
                  ) : (
                    <span className="cell-number">{i + 1}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="board-actions">
              {mode === "train" && !end.winner && !end.draw ? (
                <>
                  <button
                    className="secondary"
                    disabled={thinking}
                    onClick={() => setHint(!hint)}
                  >
                    ✦ {hint ? "Hide hint" : "Give me a hint"}
                  </button>
                  <button
                    className="text-button"
                    disabled={history.length < 2}
                    onClick={() => {
                      setHistory((h) =>
                        h.slice(
                          0,
                          Math.max(1, h.length - (turn === human ? 2 : 1))
                        )
                      )
                      setHint(false)
                      setFeedback(
                        "Try a different path. That’s what practice is for."
                      )
                    }}
                  >
                    ↶ Undo
                  </button>
                </>
              ) : end.winner || end.draw ? (
                <button className="primary" disabled={busy} onClick={nextRound}>
                  {mode === "online" && room?.rematchRequested
                    ? "Accept / wait for rematch"
                    : "Play another round"}{" "}
                  ↗
                </button>
              ) : (
                <span className="quiet-note">
                  {mode === "local"
                    ? "A little friendly competition looks good on you."
                    : "Private by invitation. No account needed."}
                </span>
              )}
            </div>
            {mode !== "online" && (
              <div className="scoreboard">
                <div>
                  <span className="x-color">
                    X ·{" "}
                    {mode === "train"
                      ? human === "X"
                        ? "YOU"
                        : "AI"
                      : "PLAYER ONE"}
                  </span>
                  <strong>{scores.X + (end.winner === "X" ? 1 : 0)}</strong>
                </div>
                <div>
                  <span>DRAWS</span>
                  <strong>{scores.draw + (end.draw ? 1 : 0)}</strong>
                </div>
                <div>
                  <span className="o-color">
                    O ·{" "}
                    {mode === "train"
                      ? human === "O"
                        ? "YOU"
                        : "AI"
                      : "PLAYER TWO"}
                  </span>
                  <strong>{scores.O + (end.winner === "O" ? 1 : 0)}</strong>
                </div>
              </div>
            )}
          </section>
          <aside className="sidebar">
            {mode === "train" ? (
              <>
                <section className="settings-card">
                  <div className="section-label">MAKE IT YOUR GAME</div>
                  <h3>A worthy opponent.</h3>
                  <ChallengeSelect
                    value={difficulty}
                    onChange={(value) => {
                      setDifficulty(value)
                      reset()
                    }}
                  />
                  <p className="setting-note">
                    {difficulty === "perfect"
                      ? "Never slips up. Can you hold your ground?"
                      : "Sometimes misses a move. Find the opening."}
                  </p>
                  <label>Pick your side</label>
                  <div className="side-picker">
                    {(["X", "O"] as Mark[]).map((mark) => (
                      <button
                        key={mark}
                        className={human === mark ? "selected" : ""}
                        aria-pressed={human === mark}
                        onClick={() => {
                          setHuman(mark)
                          reset()
                        }}
                      >
                        <b className={mark === "X" ? "x-color" : "o-color"}>
                          {mark === "X" ? "×" : "○"}
                        </b>
                        {mark === "X" ? "Go first" : "Go second"}
                      </button>
                    ))}
                  </div>
                </section>
                <section className="coach-card">
                  <span className="coach-icon">✦</span>
                  <div className="section-label">YOUR CORNER COACH</div>
                  <h3>
                    {hint
                      ? "Here’s your next move."
                      : "Every move is a lesson."}
                  </h3>
                  <p aria-live="polite">
                    {hint && best
                      ? `Try square ${best.i + 1}. ${explain(board, turn, best.i)}`
                      : feedback}
                  </p>
                  <div className="coach-foot">
                    A draw against perfect play is a win for your skills.
                  </div>
                </section>
              </>
            ) : mode === "online" ? (
              <section className="settings-card">
                <div className="section-label">GOOD GAMES TRAVEL</div>
                <h3>A friend, anywhere.</h3>
                <p className="setting-note">
                  Send an invite. Take turns. Settle the score.
                </p>
                {!room ? (
                  <>
                    <button
                      className="primary full"
                      disabled={busy}
                      onClick={() => void online("create")}
                    >
                      Create a private room ↗
                    </button>
                    <div className="or-divider">or join a friend</div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        void online("join")
                      }}
                    >
                      <label htmlFor="room-code">Room code</label>
                      <input
                        id="room-code"
                        placeholder="Enter room code"
                        maxLength={10}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                      />
                      <button
                        className="secondary full"
                        disabled={busy || !code.trim()}
                      >
                        Join room
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <label>Your room code</label>
                    <div className="room-code">{room.id}</div>
                    <button
                      className="primary full"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${location.origin}${location.pathname}?room=${room.id}`
                          )
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2500)
                        } catch {
                          setError(
                            "Copy the room code above and send it to your friend."
                          )
                        }
                      }}
                    >
                      {copied ? "Invite copied ✓" : "Copy invite link ↗"}
                    </button>
                    <p className="setting-note">
                      {!room.ready
                        ? "Waiting for a player connection."
                        : end.winner || end.draw
                          ? "Round complete. Both players can request a rematch."
                          : room.mark === room.turn
                            ? `You’re ${room.mark}. It’s your turn — choose an empty square.`
                            : `You’re ${room.mark}. Wait for ${room.turn} to play${room.board.every((cell) => cell === null) ? " first — the room creator starts" : ""}.`}
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        peerRoom.current?.destroy()
                        peerRoom.current = null
                        setRoom(null)
                        reset()
                        setError("")
                        const roomUrl = new URL(window.location.href)
                        roomUrl.searchParams.delete("room")
                        window.history.replaceState(null, "", roomUrl)
                      }}
                    >
                      Leave board
                    </button>
                  </>
                )}
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
                <p className="room-note">
                  {import.meta.env.VITE_STATIC_PAGES
                    ? "On GitHub Pages, moves travel directly between both browsers. The room creator must keep this tab open."
                    : "Rooms last up to 2 hours without a move. Keep this tab open to stay in the game."}
                </p>
              </section>
            ) : (
              <section className="settings-card">
                <div className="section-label">BETTER WITH COMPANY</div>
                <h3>
                  Same screen.
                  <br />
                  Double the fun.
                </h3>
                <p className="setting-note">
                  X starts. O follows. Connect three squares in a row, column,
                  or diagonal to take the round.
                </p>
                <div className="local-art">
                  <span>×</span>
                  <span>○</span>
                </div>
                <p className="setting-note">
                  Keep playing to build your session score. A new mode starts a
                  fresh scoreboard.
                </p>
                <button className="secondary full" onClick={reset}>
                  Restart this round ↶
                </button>
              </section>
            )}
            <div className="tiny-tip">
              <span>↗</span>
              <p>
                Easy to learn.
                <br />
                <strong>So satisfying to master.</strong>
              </p>
            </div>
          </aside>
        </div>
        <section className="lesson-strip">
          <div className="lesson-number">
            0{lesson + 1}
            <span> / 03</span>
          </div>
          <div>
            <span className="section-label">THE PLAYBOOK</span>
            <h3>{lessons[lesson][0]}</h3>
            <p>{lessons[lesson][1]}</p>
          </div>
          <button
            aria-label="Next strategy lesson"
            onClick={() => setLesson((lesson + 1) % lessons.length)}
          >
            →
          </button>
        </section>
      </main>
      <footer>
        <span>
          nought. <span>A little play. A sharper mind.</span>
        </span>
        <span>MADE FOR YOUR NEXT AHA.</span>
      </footer>
    </div>
  )
}
