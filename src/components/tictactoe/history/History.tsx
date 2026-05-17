import type { HistoryEntry } from "../../../features/tictactoe/TicTacToe"
import "./History.css"

export const History = ({ history }: { history: HistoryEntry[] }) => {
  return (
    <div className="history">
      {history.map((move, index) => (
        <HistoryItem key={index} move={move} index={index} />
      ))}
    </div>
  )
}

const HistoryItem = ({
  move,
  index,
}: {
  move: HistoryEntry
  index: number
}) => {
  const col = String.fromCharCode(65 + move.position[1])
  const row = move.position[0] + 1

  return (
    <div className="history-item">
      <div className="history-item__content">
        <div className="history-item__move-number">{index + 1}</div>
        <div className="history-item__player-badge" data-player={move.player}>
          {move.player}
        </div>
        <div className="history-item__position">
          {col}
          {row}
        </div>
      </div>
    </div>
  )
}
