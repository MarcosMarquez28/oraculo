# Oraculo

Trading journal and scheduled Binance signal scanner.

## Run locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set the Discord webhook URLs. `dotenv` loads
   the local file when the bot starts.
4. Run `npm start`.

The Express app serves the journal and exposes `GET /health` for service health checks.
The scanner checks the configured pairs at 09:00, 15:00, and 20:00, plus the backup
cron schedule. Times use `BOT_TIMEZONE` (defaults to UTC); set it to an IANA timezone
such as `America/Caracas` to match your local schedule.

## Render configuration

Create an always-on Node web service for this repository with build command
`npm install` and start command `npm start`. Set the health check path to `/health`,
then configure `WEBHOOK_RADAR` and `WEBHOOK_FRANCOTIRADOR` as Render environment
variables. Free web services can spin down while idle, so they are not suitable for
continuous scheduled scans. Do not commit real webhook URLs or a `.env` file.

Optional environment variables:

- `PORT`: HTTP port (Render provides this automatically).
- `BOT_TIMEZONE`: IANA timezone for scheduled runs; defaults to `UTC`.
- `SCAN_SYMBOLS`: comma-separated list of up to 10 symbols; defaults to
  `BTCUSDT,ETHUSDT,SOLUSDT`.
- `RADAR_TIMEFRAME`: Spot timeframe (`5m`, `15m`, `1h`, or `4h`); defaults to `15m`.
- `FUTURES_TIMEFRAME`: USDⓈ-M timeframe (`1h` or `4h`); defaults to `1h`.
- `BACKUP_SCAN_CRON`: backup cron expression; defaults to every 15 minutes.

Spot signals go to the Radar webhook. Futures alerts are sent only when the
Order Block and CHoCH filters pass and the confluence score is at least 80/100.
The service sends alerts only; it does not place orders. Duplicate alerts are
suppressed in memory for the lifetime of the running process.

The browser simulator and the scheduled scanner use the same detection and risk
calculations from `strategy.js`; simulated signals are local and never send alerts.
