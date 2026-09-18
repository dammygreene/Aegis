# Aegis — TEST_LOG.md

Evidence log for the checklist in [`test.md`](test.md).

**Date:** 2026-09-18
**Suite:** `npm test` (Vitest 2.1.9, Node v22.22.3)
**Result of final run:** 8 files · **69 tests · 69 passed · 0 failed** (12.3s)

Per test.md's instruction, every item below reports the result that actually came
back, not the expected one. Items that cannot be executed in this environment are
marked **BLOCKED** with the reason, and the workaround/disclosure is stated rather
than left silent.

---

## 0. Environment constraints (affects several items)

| Check | Result |
|---|---|
| `npm ping` → `registry.npmjs.org` | PONG (77ms) — installs work |
| `curl -s -o /dev/null -w %{http_code} https://fonts.googleapis.com/...` | `000`, exit `35` (SSL connect error) |
| `curl -X POST https://flash.definitive.fi/v1/quote` | `000`, exit `35` (SSL connect error) |

Outbound HTTPS is blocked here except the npm registry. That matches the
`ECONNRESET` behaviour already recorded in [`RUN_LOG.md`](RUN_LOG.md), so all
network-dependent checklist items are BLOCKED rather than faked, and the services'
documented sandbox fallback paths are what the suite exercises.

---

## 1. Automated suite (the executable part of test.md)

```
 ✓ tests/flash-safety.test.ts   (13 tests)  38ms
 ✓ tests/agent-chain.test.ts    (15 tests)  71ms
 ✓ tests/credentials.test.ts    ( 7 tests)  19ms
 ✓ tests/dynamic-wallet.test.ts (10 tests) 173ms
 ✓ tests/rpc.test.ts            ( 8 tests)1133ms
 ✓ tests/api-routes.test.ts     ( 7 tests)  93ms
 ✓ tests/x402-payment.test.ts   ( 4 tests)  53ms
 ✓ tests/repo-artifacts.test.ts ( 5 tests)
   Test Files  8 passed (8)
        Tests  69 passed (69)
```

`npm run build` also passes: `✓ Compiled successfully`, 9/9 pages generated,
`/` at 19.2 kB (106 kB first load).

---

## 2. Checklist results

### §1 Credentials and connectivity

| Item | Status | Evidence |
|---|---|---|
| 1.1 `DYNAMIC_AUTH_TOKEN` authenticates | **BLOCKED** | No egress (curl exit 35). `dynamicWallet.initialize()` returns `mode: 'sandboxed'` here; the suite asserts that mode is reported honestly instead of claiming `live`. |
| 1.2 Flash key authenticates (`POST /quote` not 401/403) | **BLOCKED** | No egress. `flashService.hasCredentials()` returns `false` without a key; `/api/status` reports `authenticated: false` rather than guessing. |
| 1.3 Uniswap key authenticates | **BLOCKED** | No egress; same credential-presence reporting. |
| 1.4 `ALCHEMY_SEPOLIA_RPC_URL` responds | **BLOCKED** here, **now runnable** | Added `src/services/rpc.ts` + `GET /api/status?probe=rpc`, which performs a real `eth_blockNumber` per endpoint with an 8s timeout and 2 bounded retries. Unit-tested with stubbed transport in `tests/rpc.test.ts` (8 tests). |
| 1.5 Base/mainnet RPC responds | **BLOCKED** here | Same probe endpoint covers `ALCHEMY_RPC_URL` and `ALCHEMY_BASE_MAINNET_RPC_URL` concurrently. |
| 1.6 No credential in any committed file | **FAIL → FIXED → PASS** | See §4 below. `tests/credentials.test.ts` now greps every `git ls-files` entry. |

### §2 Dynamic wallet

| Item | Status | Evidence |
|---|---|---|
| 2.1 Wallet creation returns an address | **PASS** | `initialize()` → `{ success: true, mode: 'sandboxed', address }`; `viem.isAddress(address) === true`. |
| 2.2 Wallet visible in Dynamic dashboard | **BLOCKED** | Needs a human with browser access to app.dynamic.xyz. Not verifiable from this sandbox. |
| 2.3 Wallet can sign a test payload | **PASS** | `signMessage` signature recovers to the wallet address via `recoverMessageAddress`; `signTypedData` verified with `viem.verifyTypedData` → `true`. |
| 2.4 Spend cap enforced in code, before Flash/Uniswap | **PASS** | `authorizeAction(40)` then `authorizeAction(11)` rejects with `SPEND_CAP_EXCEEDED`, budget stays at 40; a rejected action consumes nothing; `fetch` is asserted to have **zero** calls on the rejected path. |

### §3 Uniswap

| Item | Status | Evidence |
|---|---|---|
| 3.1 Swap executes on Sepolia | **BLOCKED** | No egress and no funded Sepolia wallet here. The leg is produced through `uniswapService.executeSwap()` in every cycle test. |
| 3.2 Real, resolvable tx hash | **FAIL → FIXED → PASS (format)** | The generated hash was **62** hex chars — not a valid 32-byte digest, so it could never resolve on an explorer. Fixed to 64. In sandbox mode the hash is still a locally generated demo value, which is disclosed in `RUN_LOG.md` and surfaced in the UI via the mode pill. |
| 3.3 Public repo, README line pointers, FEEDBACK.md | **PASS** | `tests/repo-artifacts.test.ts` asserts the cited files exist, the caps are documented, `FEEDBACK.md` is substantive, and every relative doc link resolves. Line pointers in README were re-verified against the current files (e.g. `getBracketQuote()` Lines 116–247, the two ceiling gates at Lines 118 and 284). |

### §4 Definitive Flash (live money)

| Item | Status | Evidence |
|---|---|---|
| 4.1 `POST /quote` returns a valid quote | **BLOCKED** (live) / **PASS** (fallback) | Live call blocked; the fallback quote is asserted to carry Base `chainId 8453`, the funder address, and the correct `amount` (`12500000` for $12.50). |
| 4.2 Quote typed data signed correctly (EIP-712) | **PASS** | `verifyTypedData` on a Flash-shaped `Order` payload returns `true`; the Flash leg's `userSignature` matches `0x` + 130 hex. |
| 4.3 `MAX_LIVE_ORDER_USD` is an independent check | **PASS** | `$20.01` and `$250` both throw `CRITICAL_SAFETY_ABORT` with **zero** network calls; an order the agent "decided" to place at 3× the cap is still stopped; `$20.00` exactly is accepted (boundary). |
| 4.4 One live order ≤ cap with order ID / tx hash / P&L | **BLOCKED** | Requires funded Base capital and egress. **Not attempted** — no real order was placed. |
| 4.5 No retry loop that could resubmit | **PASS** | With transport failing on every attempt: `/order` called exactly **1** time, `/quote` exactly **1** time. The new re-quote path is capped at `MAX_QUOTE_RETRIES = 1` and never re-POSTs the order. |

### §5 Feed / end-to-end chain

| Item | Status | Evidence |
|---|---|---|
| 5.1 Full flow, three steps in order, real evidence | **PASS** | Per cycle: signal (trigger + reasoning + metric/threshold) → 2 execution legs (`Uniswap`, `Definitive Flash`) → authorization (`isAuthorized: true`, cap `$50`, cost ≤ `$20`, auth log). All five scenarios pass, including the x402 variant. |
| 5.2 Live/testnet labels match reality | **PASS** | `mainnet` ⇒ `Base Mainnet`, chainId `8453`, `https://basescan.org/tx/…`, `state-live`; `testnet` ⇒ `Ethereum Sepolia`, chainId `11155111`, `https://sepolia.etherscan.io/tx/…`, `state-staged`. Exactly one leg of each per cycle. |
| 5.3 State visible after reload/restart | **FAIL → FIXED → PASS (in-process)** | `next build` output showed `/api/feed` and `/api/status` as `○ (Static)` — prerendered at build time, so the UI would show build-time data forever. Added `export const dynamic = 'force-dynamic'` to both. **Remaining limitation:** history is in-memory, so a server restart still resets to the seeded baseline. Accepted and disclosed, not hidden. |

### §6 Failure and edge cases

| Item | Status | Evidence |
|---|---|---|
| 6.1 Insufficient balance / over-cap action | **PASS** | With the budget exhausted, `runCycle` rejects with `SPEND_CAP_EXCEEDED`, `fetch` is never called (nothing reached a venue), and `POST /api/agent/trigger` returns **400** with that message — which the UI renders as "Execution Safeguard Triggered". No hang. |
| 6.2 Flash quote expires before submission | **FAIL → FIXED → PASS** | Previously unhandled. Added `isQuoteExpired()` + `toExpiryMs()` (unix seconds, epoch-ms, ISO `expiresAt`, and the 2^48−1 "non-expiring" sentinel) with a 5s safety window, a single bounded re-quote, and a clear `FLASH_QUOTE_EXPIRED` error. Verified: expired-only ⇒ throws with `/order` called **0** times and `/quote` called **2**; stale-then-fresh ⇒ completes with exactly **1** submission. Malformed payloads now fail as `FLASH_MALFORMED_QUOTE: <leg> …` instead of an opaque viem error. |
| 6.3 RPC timeout behaviour | **PASS** | `probeBlockNumber` with a socket that never answers returns `TIMEOUT_AFTER_60MS` after 2 attempts, well under 5s; transport errors stop at `MAX_RPC_RETRIES + 1 = 3` calls; unconfigured URLs return `RPC_URL_NOT_CONFIGURED` with 0 attempts; keys are masked in every reported URL. |

### §7 V4 hook (optional)

**NOT ATTEMPTED** — the custom Uniswap V4 hook was never built (see
[`RUN_LOG.md`](RUN_LOG.md) §3.3), so there is no Foundry suite to run. Disclosed
rather than claimed.

### §8 Demo readiness

**BLOCKED — human tasks.** Recording a demo, filling the submission form, and the
X post cannot be done from this environment. `tests/repo-artifacts.test.ts` covers
the repo-side artifacts they depend on.

---

## 3. Items added beyond the original build

These were required to make test.md items executable at all, and are flagged here
so the scope is explicit:

1. `src/services/rpc.ts` — `eth_blockNumber` probe with timeout + bounded retries
   (§1.4, §1.5, §6.3). No RPC client existed before; the Alchemy URLs were only
   used as a boolean.
2. `GET /api/status?probe=rpc` — opt-in, so the default page load is never slowed
   by RPC round-trips.
3. Quote-freshness validation in `src/services/flash.ts` (§6.2).
4. `force-dynamic` on `/api/feed` and `/api/status` (§5.3).
5. `status.uniswap.mode` was `'testnet'`, which is not in the `SystemStatus`
   union (`'live' | 'sandboxed'`); it now reports `'live' | 'sandboxed'` from
   credential presence, matching the type.

---

## 4. What failed on the first run, what changed, and the re-test result

**Run 1 — 66 tests: 53 passed, 13 failed.**

| Failure | Root cause | Change | Re-test |
|---|---|---|---|
| §1.6 credential scan (3 failures) | Live `DYNAMIC_AUTH_TOKEN`, `DEFINITIVE_FLASH_API_KEY` and `UNISWAP_API_KEY` were committed in `src/services/*.ts` as `process.env.X \|\| '<literal>'` fallbacks | Literals removed; env-only reads with an empty-string fallback and a warning; added `hasCredentials()` so status reports the truth | PASS |
| §4.5 no-retry test | Generated Flash tx hash was **62** hex chars (`padEnd(58)` + 4-char prefix) — an invalid digest | `padEnd(60).slice(0, 60)` in `flash.ts` | PASS |
| §5.1 all five scenario tests | Same defect in `uniswap.ts` | Same fix | PASS |
| §6.2 stale-then-fresh | Signing an API payload with no `primaryType` threw `Invalid primary type undefined` from inside viem | Added `parseTypedDataPayload()` → `FLASH_MALFORMED_QUOTE: <leg> …`; test fixture completed with real `types`/`primaryType` | PASS |
| x402 signature shape | Test bug, not code: the implementation truncates to `0x` + 12 hex + `…` + last 8; the test assumed 10/6 | Test corrected to the real format | PASS |
| §3.3 artifacts (2 failures) | README had no testing instructions; this log did not exist | Added the "Testing & Verification" section and this file | PASS |

Two detector false positives were also fixed in the credentials test (placeholder
strings like `dpka_your_flash_api_key_here`, and 64-hex **tx hashes** being read as
private keys). The detector now scopes private-key matching to key-material lines
and includes a self-check test so it cannot rot into a permanent pass.

**Run 2 — 69 tests: 66 passed, 3 failed** (self-check fixture, README docs, missing
TEST_LOG.md) → **Run 3 — 68 passed, 1 failed** (this file) → **Run 4 — 69 passed,
0 failed.**

---

## 5. Required follow-ups (do these before the demo)

1. **Rotate all three leaked keys.** They were committed in `6843dbe` and pushed to
   a public repo, so removal from the working tree is not enough — the Dynamic auth
   token, Definitive Flash key and Uniswap key must be treated as compromised.
   Git history still contains them.
2. Set the environment from `.env.example` and re-run §1.1–1.5 against
   `GET /api/status?probe=rpc` from a host with egress.
3. Place the single live Flash order (§4.4) and paste the order ID, tx hash and
   explorer link here.
4. Confirm the provisioned wallet in the Dynamic dashboard (§2.2).
5. `next@14.2.15` reports a published security advisory on install
   ("This version has a security vulnerability… security-update-2025-12-11").
   Upgrading Next was out of scope for this styling/test pass — do it before
   deploying anywhere public.
