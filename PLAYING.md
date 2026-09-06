# nought.

Run `npm install`, then `npm run dev`. For local network play, run `npm run dev:network`. Open the URL printed in the terminal. Both `/` and `/tictactoe` open the game.

- **Train your brain:** Perfect AI uses minimax and cannot lose. Casual AI sometimes chooses a weaker move. Pick X or O, request a hint, and undo to explore alternatives. A draw against perfect play is the target.
- **Play together:** Two players alternate on the same screen. Completed rounds count toward the session score. Changing modes clears that score.
- **Challenge a friend:** Create a room and send the invite link, or enter a room code. Each player’s credential stays in their own tab’s session storage. A completed round restarts only after both players request a rematch.

## Remote play deployment

Build with `npm run build` and start with `npm start`. Deploy this SSR Node app as **one persistent server process**, reachable by both players, with HTTPS. The existing Dockerfile can package the app. On a local network, use the host machine’s LAN address instead of localhost; internet friends need a publicly reachable deployment. This change does not publish the application.

Rooms are held in server memory, expire after two hours without an action, and disappear when the server restarts. Multiple workers, autoscaling, or serverless instances require a shared database/room store before use. No account, durable history, or presence detection is provided. Polling synchronizes the board approximately every 1.2 seconds. Invite codes grant the remaining player slot, so share them only with your intended opponent.

## GitHub Pages

The Pages workflow sets `GITHUB_PAGES=true` and uses the `base_path` from
`actions/configure-pages` (normally `/TicTacToe`). This creates a static,
prerendered build with the correct router and asset prefixes. The workflow runs
`node scripts/prepare-pages.mjs` to place the prerendered HTML at the artifact
root and verify its asset references, then uploads `build/client`.

Pages supports every game mode. Online rooms use a direct WebRTC data connection
between the two browsers, brokered by the public PeerJS Cloud signaling service.
The player who creates the room owns its state and must keep the page open. Some
restricted corporate networks or symmetric NAT configurations may require a TURN
relay or the normal Node deployment.

To reproduce locally, set `GITHUB_PAGES=true` and `PAGES_BASE_PATH=/TicTacToe`,
then run `npm run build` and `node scripts/prepare-pages.mjs`. Unset these variables
before building the normal server version. Build output remains ignored by Git.

## Checks

`npm run typecheck`, `npm test`, and `npm run build`. Tests exhaustively explore legal opponent continuations against the AI playing either side and verify room authorization, turn order, occupied squares, completed games, stale-round rejection, and mutual rematches.
