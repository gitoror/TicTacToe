# nought.

Run `npm install`, then `npm run dev`. For local network play, run `npm run dev:network`. Open the URL printed in the terminal. Both `/` and `/tictactoe` open the game.

- **Train your brain:** Perfect AI uses minimax and cannot lose. Casual AI sometimes chooses a weaker move. Pick X or O, request a hint, and undo to explore alternatives. A draw against perfect play is the target.
- **Play together:** Two players alternate on the same screen. Completed rounds count toward the session score. Changing modes clears that score.
- **Challenge a friend:** Create a room and send the invite link, or enter a room code. Each player’s credential stays in their own tab’s session storage. A completed round restarts only after both players request a rematch.

## Remote play deployment

Build with `npm run build` and start with `npm start`. Deploy this SSR Node app as **one persistent server process**, reachable by both players, with HTTPS. The existing Dockerfile can package the app. On a local network, use the host machine’s LAN address instead of localhost; internet friends need a publicly reachable deployment. This change does not publish the application.

Rooms are held in server memory, expire after two hours without an action, and disappear when the server restarts. Multiple workers, autoscaling, or serverless instances require a shared database/room store before use. No account, durable history, or presence detection is provided. Polling synchronizes the board approximately every 1.2 seconds. Invite codes grant the remaining player slot, so share them only with your intended opponent.

## Checks

`npm run typecheck`, `npm test`, and `npm run build`. Tests exhaustively explore legal opponent continuations against the AI playing either side and verify room authorization, turn order, occupied squares, completed games, stale-round rejection, and mutual rematches.
