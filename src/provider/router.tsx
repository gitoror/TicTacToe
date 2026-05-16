import { BrowserRouter, Route, Routes } from 'react-router'
import App from '../App'
import { TicTacToePage } from '../pages/TicTacToePage'

export const RouterApplication = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/tictactoe" element={<TicTacToePage />} />
      </Routes>
    </BrowserRouter>
  )
}
