import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  route("api/room", "routes/room.ts"),
  route("tictactoe", "./routes/tictactoe.tsx"),
] satisfies RouteConfig
