import { BrowserRouter, Route, Routes } from "react-router"
import { TicTacToePage } from "../pages/TicTacToePage"

export const RouterApplication = () => {
  return (
    <BrowserRouter basename="/TicTacToe/">
      <Routes >
        <Route path="/" element={<TicTacToePage />} />
      </Routes>
    </BrowserRouter>
  )
}
