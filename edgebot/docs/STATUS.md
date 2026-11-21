# Status — 21 Nov 2026

## Phases 1 + 2: done (79 tests passing)

**Phase 1 — data + pricing engine**
- Data sources: offline sample generator; free football-data.co.uk history (Pinnacle, Betfair Exchange, bet365 and 10 other bookmakers, 2019/20 → 2025/26)
- Every price and result is timestamped; SQLite storage (Postgres-ready)
- De-vig: multiplicative, power, Shin, additive. The most accurate one on the warm-up season is picked automatically (multiplicative won on real data)
- Strategy A (market value) and Strategy B (Dixon–Coles model blended with the market), same interface
- Staking: fractional Kelly, per-bet and daily caps, loss limits, auto-pause at −20%, cool-off
- Guarded parlays and timing analysis
- `picks` command: the pick sheet the bot will send (example: `backtests/2026-11-21_example-pick-sheet.txt`)

**Phase 2 — backtester**
- Event-driven and in time order. Bets are placed only at prices available at that moment, at least 15 minutes before kick-off
- 1–2% worse odds than quoted, 10% of bets refused, account limits after 200 bets
- No-leakage guard inside the engine. "Time-travel" tests rewrite the future and check that past decisions don't change
- Sealed final test (2025/26 season), not opened yet; every variant tested is logged
- ROI and CLV with bootstrapped 95% ranges; "not enough data" below 300 bets

## What real past data says (honest)

| Test | Bets | CLV vs closing price | ROI | Verdict |
|---|---|---|---|---|
| A · Premier League, Championship, Bundesliga · bet365 | 103 | **+3.1%** (95% range +1.5% to +4.7%) | +8.3% (−37% to +60%) | Not enough data |
| A · 18 European leagues · bet365 | 1,173 | −0.6% (−1.3% to 0.0%) | −3.9% (−15% to +7%) | No clear edge |
| B · own model + market · 3 leagues | 581 | −2.7% (−3.6% to −1.9%) | −0.5% | **No edge** |
| Parlays (inside A · 18 leagues) | 174 | −1.1% | −27% | Not enough data |

What this means:
1. **Our own model does not beat the market** (log loss worse in every test). Strategy B is off; the bot uses Strategy A.
2. **A small, promising signal in the top leagues only.** At bet365, prices that beat Pinnacle's fair price in the Premier League, Championship and Bundesliga tended to stay better than the closing price. But it's only ~20 bets per season, which is far too few to prove profit.
3. **In smaller leagues the "edges" were not real.** Pinnacle's early prices there are less sharp, so apparent value vanished by kick-off. This is why the bot sticks to top leagues by default.
4. **Bigger "edges" were not better.** Edges of 8%+ more often meant a stale or wrong price.
5. **Parlays did not help.** They are only as good as their legs and add a ~10% compounded bookmaker margin.
6. **Timing:** past data has only two price snapshots per match, so timing advice is coarse. Premier League 1X2 prices were about 0.7% better 3+ days before kick-off than in the last hour. Live odds in Phase 3 will measure timing properly.
7. **Stakes are small:** €1–€15 on a €1,000 bankroll, because most value is on longer odds and staking is deliberately cautious.

Biggest unknown: Betano, efbet and Winbet are not in any free history. If they are slower than bet365 to move their prices, there could be more value. Only live paper trading can show this.

## Decisions so far

- Bookmaker: **Betano** only (set in `config.yaml`). Betano isn't in free past data, so backtests use bet365 as a clearly labelled stand-in.
- Budget: **€0**. No paid odds feed, no server, no paid AI.
- A €6/month server is not worth it now: expected profit is about €2 a season on current evidence, and the free data is the real limit, not the server.
- Strategy A (market value) only; Strategy B is off because the model lost to the market.

## Next: Phase 3 — paper trading (free version, waiting for your go)

- Fair prices: football-data.co.uk upcoming-matches file (Betfair Exchange reference, about twice a week)
- Betano prices: free OddsPapi account if it really has Betano; otherwise a "bet only if Betano shows X or more" line on each pick
- Runs on GitHub's free scheduler; paper-bet records encrypted because the repo is public
- Picks and results via a free Telegram bot
