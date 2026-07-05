# Global USD Exchange Rate Barometer

A real-time-feeling dashboard for USD exchange rates, built with Next.js (App Router),
TypeScript, React, and Tailwind CSS. Charts and gauges are hand-built SVG — no charting
library, no database, no API keys, no paid services.

## Data source and honest limitation

Rates come from the [Frankfurter API](https://www.frankfurter.dev/), which republishes the
European Central Bank's official reference rates. **The ECB publishes one rate per business
day, around 16:00 CET, with no updates on weekends or holidays.** This app cannot and does not
claim tick-by-tick intraday accuracy. "Always available" means the dashboard itself is always
up and always shows the most recently published official daily rate — clearly labeled as
"Daily ECB reference rate — last published {date}" everywhere a rate appears.

If true intraday/real-time FX data is ever required, swap the upstream calls inside
`app/api/rates/route.ts` for a paid real-time FX provider. The route's response shape would
stay the same, so no client code would need to change.

## Architecture

- `app/api/rates/route.ts` — server-side route that fetches the ECB timeseries from
  `api.frankfurter.dev` (primary) with `api.frankfurter.app` as a mirror fallback. Requests are
  cached via Next.js fetch revalidation (1 hour) and retried with a timeout. If both hosts fail,
  the route returns the last successfully fetched payload for that exact request from an
  in-memory cache, marked `stale: true`, instead of erroring.
- `lib/useRates.ts` — client hook that calls only `/api/rates` (never the upstream directly),
  persists the last good response to `localStorage`, shows that cached copy instantly on
  load, and re-fetches live data on an hourly interval.
- `components/` — `Gauge` (deviation speedometer), `TimelineChart` (SVG area chart),
  `MetricStrip` (5 mini gauges), `RangeTabs`, `YearSelect`, `CurrencySelect`, `RateHeadline`,
  `StatusBadge`.
- `lib/metrics.ts` — volatility, momentum, range, 30-day deviation, and trend calculations
  derived from the real fetched series.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

Lint:

```bash
npm run lint
```

No environment variables or API keys are required.

## Data freshness and availability

- Server: Next.js fetch caching (`revalidate: 3600`) plus a primary/mirror failover with
  retries and an in-memory last-good fallback.
- Client: last successful response is cached in `localStorage` so a returning visitor sees
  real numbers immediately, then the page silently revalidates from `/api/rates`.
- Auto-refresh: the live view re-polls hourly so a newly published rate appears without a
  manual reload.
- Status indicator: green ("Live ECB rates"), amber ("showing cached/last-known rates"), or
  red ("no data available") — the dashboard never shows a blank screen on a transient upstream
  failure.
