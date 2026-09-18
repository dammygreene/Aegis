# Aegis — test.md

Paste this to your agent once Phase 4 (the core chain) is built and, separately, again after any major change (the styling pass, the V4 hook stretch, etc.). Run these tests yourself; don't just claim they pass — show the actual output/evidence for each.

## How to work through this file

For each test: run it, report the actual result (not what you expect the result to be), and if it fails, fix the root cause and re-run the same test before moving to the next one. Do not skip a failing test to "come back to it later" unless it's explicitly marked optional below. Keep a log of what failed, what you changed, and the re-test result — this is what gets reviewed, especially for anything run overnight unsupervised.

## 1. Credentials and connectivity

- [ ] `DYNAMIC_AUTH_TOKEN` + `DYNAMIC_ENVIRONMENT_ID` authenticate successfully (`authenticateApiToken` succeeds, no error)
- [ ] `DEFINITIVE_FLASH_API_KEY` authenticates (a `POST /quote` call returns a valid quote, not a 401/403)
- [ ] Uniswap API key authenticates (a read-only call, e.g. fetching pool state, succeeds)
- [ ] `ALCHEMY_SEPOLIA_RPC_URL` responds to a basic call (e.g. `eth_blockNumber`)
- [ ] `ALCHEMY_BASE_MAINNET_RPC_URL` (or eth-mainnet, whichever is wired for live use) responds to a basic call
- [ ] No credential appears in any committed file — grep the repo for the literal key/secret strings and confirm zero matches outside `.env`/`.env.example` (the latter should have placeholders only)

## 2. Dynamic wallet (Phase 1)

- [ ] `createWalletAccount` (or the pattern actually implemented) succeeds and returns a wallet address
- [ ] The wallet appears in the Dynamic dashboard's Wallet Management page (manually confirm, or fetch it back via API)
- [ ] The wallet can sign a test payload (not necessarily a real transaction — confirm the signing mechanism works before it's used for anything real)
- [ ] The spend cap is enforced in code — write a quick test that attempts an action above the cap and confirms it's rejected before it reaches Flash or Uniswap, not just that the UI displays a cap number

## 3. Uniswap integration (Phase 2, Tier 1)

- [ ] A swap or liquidity action executes successfully on Sepolia (or Base, per whatever was confirmed with Discord)
- [ ] The resulting transaction has a real, checkable hash — paste it and confirm it resolves on the relevant testnet/mainnet explorer
- [ ] The repo is public, README points to the exact lines implementing the integration, `FEEDBACK.md` exists, and the Uniswap Developer Feedback Form has been submitted with a link to it

## 4. Definitive Flash (Phase 3) — extra care, this is live money

- [ ] `POST /quote` returns a valid quote for a trivial position size
- [ ] The quote's typed data is signed correctly by the Dynamic wallet (EIP-712) — confirm the signature verifies before submitting
- [ ] **Before the first live order:** confirm `MAX_LIVE_ORDER_USD` is implemented as an independent check, not part of the main decision logic — write a test that tries to submit an order above the cap and confirms it's blocked
- [ ] Submit exactly one live order at or under the cap. Capture: order ID, tx hash, explorer link, realized P&L once closed
- [ ] Confirm no retry loop exists that could resubmit this order multiple times on a transient error

## 5. The feed / end-to-end chain (Phase 4)

- [ ] Trigger the full flow once, start to finish, and confirm all three steps appear in the UI/log in the correct order with real evidence attached to each (not placeholder text)
- [ ] Confirm the live/testnet badges on each step accurately reflect where that step actually ran — this is a demo-credibility requirement, not cosmetic
- [ ] Reload the page/restart the app and confirm the last run's state is still visible (or note clearly if state doesn't persist and that's an accepted limitation)

## 6. Failure and edge cases

- [ ] What happens if the Dynamic wallet has insufficient balance for the authorized action? Confirm it fails gracefully with a clear message, not a silent hang or a crash
- [ ] What happens if a Flash quote expires before the order is submitted? Confirm this is handled (re-quote or clear failure), not left to error out unhandled
- [ ] What happens if the RPC call times out? Confirm a reasonable retry-or-fail behavior exists, not an infinite hang

## 7. (Optional, only if Tier 2 was attempted) V4 hook

- [ ] Hook permissions bitmap matches the deployed address (deployment doesn't revert)
- [ ] `unlock()` → `unlockCallback()` → `settle()`/`take()` flow completes without `CurrencyNotSettled`
- [ ] Foundry test suite passes, including at least one test that deliberately tries to imbalance the delta and confirms it reverts

## 8. Demo readiness

- [ ] Recorded demo exists and actually shows the real evidence (tx hashes, explorer links) on screen, not just narration
- [ ] Submission form fields are all correct: project link, repo link, demo link, tracks selected (Uniswap, Dynamic, Definitive Flash — not Blackbird)
- [ ] X post tagging @DefinitiveFi is live and linked in the submission

## If something can't be fixed in time

If a test fails and you can't resolve it before the deadline, don't hide it — note it clearly in the log with what's broken and what the workaround or honest disclosure should be in the demo (matching the "be upfront about live vs. staging/limitations" approach used throughout this build). A known, disclosed limitation is fine. A silent one discovered live during the demo is not.
