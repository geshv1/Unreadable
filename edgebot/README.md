# EdgeBot

A personal football betting assistant. It recommends a bet **only** when a price is measurably
better than the fair price *after* the bookmaker's margin. No edge = no bet.

Real-money betting is switched off in code. EdgeBot recommends; you place bets yourself, only at
NRA-licensed bookmakers where you have your own account.

## Status

| Phase | What | State |
|---|---|---|
| 1 | Data + pricing engine | ✅ done |
| 2 | Backtester (with parlays + timing analysis) | ✅ done |
| 3 | Paper trading + reports (free version, through the Claude chat) | ✅ done |
| 4 | Chat bot: send a screenshot or link to Claude (no Telegram, no server) | ✅ done |
| 5 | iPhone home-screen app on the same API | later |

Latest results: see [`docs/STATUS.md`](docs/STATUS.md).

## Commands (copy-paste)

You don't need a computer: these run in a Claude Code cloud session now, and on the server
automatically from Phase 4.

```bash
cd edgebot
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

python -m pytest                          # all tests, incl. the data-leakage tests
python -m edgebot sample-backtest         # offline demo on made-up data (no internet needed)
python -m edgebot download                # free past odds from football-data.co.uk
python -m edgebot backtest                # real past data, Strategy A (market value)
python -m edgebot backtest --strategy B   # own model blended with the market
python -m edgebot backtest --leagues E0,E1,SP1,I1   # other leagues
python -m edgebot compare-devig           # which margin-removal method is most accurate
python -m edgebot timing                  # when the best prices appear, per league/market
python -m edgebot picks                   # the pick sheet the bot would send
python -m edgebot check arsenal chelsea   # check one match on demand (see below)
python -m edgebot paper grade             # settle paper bets with free results + closing prices
python -m edgebot paper report            # profit, CLV, go-live gates
python -m edgebot variants                # every variant tested so far (honesty log)
python -m edgebot holdout --confirm       # the sealed final test: runs ONCE, then refuses
```

Every report is saved in `reports/` (report.txt, bets.csv, audit_log.csv, timing.csv, summary.json).

## Check one match (link, screenshot or team names)

```bash
python -m edgebot check "https://www.betano.bg/odds/liverpool-manchester-united/58231001/"
python -m edgebot check "Ливърпул - Манчестър Юнайтед" --odds "1=1.80 X=4.10 2=4.60 O=1.62 U=2.30"
```

You get the fair price of every outcome and the **minimum Betano odds worth betting**. With Betano's odds
you also get which bet has value (only one per match), the stake, a place-before time, what history says
about timing in that league, and a parlay built from value bets on different matches checked that day.
Screenshots: send one to Claude in the chat; it reads the teams and odds and runs this check.

Free data limits: fair prices come from football-data.co.uk's upcoming-matches file (Betfair Exchange,
22 European leagues, refreshed around Tuesday and Friday). Older prices lower the confidence and halve
the stake; prices over 5 days old are refused. Unknown matches are never guessed.

## Paper trading and the tracker page

Every ✅ bet from a check becomes a paper bet (pretend money, one per match). `paper grade` settles bets
with free results and measures CLV against the Betfair Exchange closing price. `paper report` shows
profit, ROI and CLV with 95% ranges, and progress on every go-live gate. The private tracker page
(`app/tracker.html`) shows the bets on your phone, with Placed / Skipped / Different odds buttons.
How Claude keeps the page in sync is described in `../CLAUDE.md`.

## Settings

Everything lives in [`config.yaml`](config.yaml), with safe defaults. The most useful lines:

- `bookmakers.playable` — the licensed bookmakers you have an account with
- `strategy.edge_threshold` — minimum edge (default 3%)
- `risk.level` — `safe` / `balanced` / `aggressive` (Kelly 0.10 / 0.20 / 0.25; max 1% / 1.5% / 2% per bet)
- `parlays.enabled` — parlays built only from legs that each have an edge
- `bankroll_eur`

Secrets (API keys, bot token) go only in environment variables: copy `.env.example` to `.env`.

## How a recommendation is made

1. Take the sharp reference prices (Pinnacle, Betfair Exchange) and remove their margin
   (multiplicative, power, Shin or additive; the most accurate one on past data is chosen).
   That gives the **fair price**.
2. Compare it with each of your bookmakers' prices: `edge = fair probability × odds − 1`.
3. Bet only if the edge is at least 3% (and not implausibly large, which usually means bad data).
4. Stake = fractional Kelly, capped per bet, per day, and by loss limits.
5. Parlays: only from legs that each pass step 3, one leg per match, max 3 legs, max 0.5% stake.
   The compounded bookmaker margin and the true vs offered payout are shown.

## How it protects you (weak spots of other bots)

| Weak spot | Protection here |
|---|---|
| Edge smaller than the margin | Edge measured against de-vigged fair odds; 3% threshold after margin and exchange commission |
| Data leakage | Every price and result has a timestamp; the engine stops any decision that uses data from at or after bet time; "time-travel" tests change the future and check that past decisions don't change |
| Backtesting at closing odds | Bets only at prices available at that moment, 15+ minutes before kick-off, with 1–2% worse odds and 10% random refusals |
| Overfitting | Sealed final test period (one-time); every variant logged and counted in each report; simple, shrunk models |
| Model adds nothing | Own model compared with the market out-of-sample; if it doesn't win, the report says so and Strategy A is used |
| Small-sample illusions | CLV and ROI with bootstrapped 95% ranges; "not enough data" below 300 bets |
| CLV worship | CLV net of margin, split by edge size; bets priced at the closing snapshot are left out of CLV |
| Reckless staking | Fractional Kelly, probabilities shrunk toward the market, per-bet/daily caps, loss limits, auto-pause at −20% |
| Account limits | Requested vs accepted stake logged; limits simulated as a cost |
| Stale data | Prices older than 5 minutes are ignored; audit log of every bet/skip with a reason |
| Market blind spots | Results split by league, market, bookmaker and timing |
| Parlay trap | Value legs only, compounded margin shown, same-match legs blocked |

## Reading a report

- **Edge** — how much better a price is than fair. +5% means €5 expected profit per €100 over the long run.
- **CLV** (closing line value) — how your price compares with the final fair price just before kick-off.
  Consistently positive CLV is the earliest reliable sign of a real edge.
- **ROI** — profit ÷ amount staked. Needs many hundreds of bets before it means anything.
- **95% range** — where the true value probably lies. If it includes zero, the result could be luck.
- **Drawdown** — the biggest fall from a high point.

## Folder map

```
edgebot/
  config.yaml          settings (the only file to edit)
  edgebot/
    data/              providers: sample (offline), football-data.co.uk, price index, SQLite store
    pricing/           implied probability, de-vig methods, sharp consensus, edge
    models/            Dixon–Coles goals model (Strategy B)
    strategies/        A: market value · B: model + market (same interface)
    staking/           Kelly and the risk manager
    parlays/           guarded parlay builder
    timing/            when the best prices appear
    backtest/          event-driven engine, execution simulator, metrics, benchmark, report
    execution/         interface only, permanently disabled
    leakage.py         the no-future-data guard
  tests/
```

## Data and legality

- Past odds: football-data.co.uk (free). It has bet365 but not Betano, efbet or Winbet, so backtests
  can only test bet365. Pinnacle prices stop after 2025/26, so Betfair Exchange is the reference after that.
- Pinnacle and Betfair Exchange are used **only as price references**, never as places to bet.
- Only NRA-licensed operators. No VPNs, no extra accounts, no accounts in other people's names.
