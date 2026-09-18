# Build Prompt — Aegis (Runtime Agent Week submission)

Paste this whole document to your coding agent as the initial brief.

---

## Context

You are building "Aegis" for a hackathon with a hard deadline (~40 hours from brief start). Working software beats ambitious incomplete software. This is a **two-tier** build: Tier 1 must exist and work by the deadline no matter what. Tier 2 is a stretch you only attempt once Tier 1 is checkpointed stable. Follow phase order exactly.

**Ground rule: if you are not certain an SDK method, endpoint, or parameter exists as you're about to use it — especially anything involving fund transfers, signing, or payment — stop and verify against the actual linked docs instead of guessing.** A subtly wrong integration with real funds involved is worse than being slow.

## Unsupervised operation — hard gate on the live-money step

You (the agent) will be running overnight without a human watching in real time. This is fine for almost everything in this build — writing code, running local tests, deploying to testnet, iterating on the UI. It is **not fine for the one step that moves real money on mainnet** (Phase 3, submitting the live Flash order) without a safeguard, because if something is subtly wrong — a decimal error, a misread parameter, a bug in the signing logic — there is no one present to catch it before funds move.

**Required behavior:**
1. Build and fully test the entire Flash integration (quote → sign → submit → poll) using the smallest possible test path first — e.g. a `POST /quote` dry run, and if Flash or any sandbox exists for validating the request shape without submitting, use it. Confirm the request payload is well-formed and the signature verifies before ever calling `POST /order` for real.
2. **Do not call `POST /order` with real funds until a hard-coded, pre-authorized ceiling is in place that cannot be exceeded regardless of any upstream logic error** — e.g. an explicit constant `MAX_LIVE_ORDER_USD = 20` checked immediately before submission, independent of whatever the "agent's decision" logic computed. This is a second, dumb, unconditional check — not a smarter version of the trading logic, a backstop against it being wrong.
3. If you reach the point of being ready to submit the live order and the hard cap check passes, proceed — this was explicitly authorized in advance (see cap above). Log every field of the request and the response clearly before and after, so it's fully reviewable in the morning.
4. Never raise `MAX_LIVE_ORDER_USD`, never retry a failed live order more than once, and never place more than one live order in a single overnight run without an explicit instruction to do so.
5. If anything about the signing flow, the funder wallet, or the response is ambiguous or doesn't match the documented shape above, **stop and leave a clear note in the log rather than proceeding on a best guess** — this is exactly the situation the "verify, don't guess" ground rule exists for, and it matters most here.

## Stack

- **Frontend:** Next.js + TypeScript
- **Contracts (Tier 2 only):** Solidity, Foundry, the Uniswap `v4-template` repo, `HookMiner` for CREATE2 salt mining
- **Wallets/chain:** wagmi/viem, Dynamic SDK
- **Backend:** Next.js API routes or a small Node service

## Phase 1 — Dynamic wallet

Docs: Dynamic's Agents Overview and Agent Payments guide (linked from runtime.nyc/tracks/dynamic).

1. Set up a Dynamic dev/sandbox environment.
2. Implement the **delegated access** pattern: end user owns an embedded wallet, grants the agent limited, revocable signing rights within a spend cap.
   - If Dynamic's real docs describe a different/more specific agentic session-key mechanism when you read them directly, verify it exists as documented before using it. Do not implement against a feature name you haven't confirmed in their actual docs.
   - If delegated access is too slow to integrate, fall back to the **agent wallet** pattern — acceptable substitute, just name it in the demo.
3. Set a hard spend cap, enforced in code, not just documentation.
4. Prove one authenticated signing action end-to-end. Capture the tx hash or execution log.

**Output:** a working wallet that can sign on the agent's behalf, with an enforced spend cap.

## Phase 2 — Uniswap integration (Tier 1: do this before any hook work)

Docs: Uniswap developer documentation and Developer Platform (linked from runtime.nyc/tracks/uniswap). Confirm testnet vs mainnet expectations in Discord before starting if not already answered.

1. Get an API key via the Uniswap Developer Platform.
2. Implement a straightforward swap or liquidity add/remove through Uniswap's API/SDK against an existing pool, on testnet (Sepolia or Unichain Sepolia) unless told otherwise.
3. This alone satisfies the Uniswap track's stated requirement ("integrate Uniswap's API, automated market maker, or CCA"). Get this fully working and evidenced (tx hash on the testnet explorer) before even considering Phase 5.
4. Set up the repo requirements now, not later: public GitHub repo, README pointing to the exact integration code, `FEEDBACK.md`, and complete the Uniswap Developer Feedback Form with a link to `FEEDBACK.md`.

**Output:** a working, evidenced Uniswap integration and the required repo artifacts — this is your Tier 1 Uniswap deliverable, complete and submittable on its own.

## Phase 3 — Definitive Flash execution

Docs: flash.definitive.fi/docs (getting-started, placing-orders, for-agents, flash-mcp).

**Auth:** single header `x-definitive-api-key: <key>` on every request. Store the key in an env var, never client-side, never committed.

**Confirmed request sequence (do not deviate — this is the actual API shape, not an assumption):**
1. `POST /quote` — get pricing and the typed data payload to sign.
2. **Sign the returned data with the funder wallet** — this is the Dynamic wallet from Phase 1, not a separate keypair. On EVM: EIP-712 signature over `evm.orderTypedData`, passed as `userSignature`, with `evmOrderTypedData` echoed back. If the quote includes `evm.permitTypedData`, sign that too and pass as `evmPermitSignature` / `evmPermitTypedData`.
3. `POST /order` with `quoteId`, the signature fields above, and order params (`targetChain`, `contraChain`, `targetAsset`, `contraAsset`, `side`, `qty`, `orderType`, `funderAddress`). Use `orderType: "bracket"` or `"take-profit"` for the advanced order type requirement — for a bracket, also supply the `attachedBracket` block (takeProfit/stopLoss legs) with its own signed typed data, per the quote response.
4. Response returns `orderId`. Poll or listen for fill/close status.

**This leg is live mainnet, real funds, by explicit requirement.** Use the smallest position size that still produces a meaningful result (tens of USD notional).

On order close, capture: realized P&L, tx hash, explorer link.

**Output:** a real, verifiable closed trade with hard evidence.

## Phase 4 — Tie it together + feed (Tier 1 complete)

1. Wire the agent's decision loop: some triggering condition (can be simple — a price threshold, a manual trigger, a timer) leads the agent to choose an action, execute it via Uniswap and/or Flash, and authorize it through the Dynamic wallet.
2. Build the feed view per design-prompt.md — or if time is short, a clean log output showing the chain in order with evidence per step.
3. **This is your safe floor.** At this point you have a submittable project across three tracks. Do not proceed to Phase 5 unless this has been stable for a few hours with real time to spare.

## Phase 5 — Tier 2 stretch: custom Uniswap V4 hook (optional, hard-gated)

Only start this if Phase 4 is done early and stable.

1. Clone the `v4-template` repo.
2. Define `getHookPermissions()` — for JIT liquidity, you'll need `beforeSwap`, `afterSwap`, `beforeAddLiquidity`, `beforeRemoveLiquidity` set to true.
3. Use `HookMiner` to find a CREATE2 salt producing a deployment address whose bit-flags match your permissions struct.
4. Implement the `unlock()` → `unlockCallback()` flow: remove out-of-range liquidity, rebalance, add concentrated liquidity, and ensure `settle()`/`take()` zero out the `BalanceDelta` before the callback returns. Test exhaustively with Foundry — the `CurrencyNotSettled` revert is the most likely failure mode and is hard to debug under time pressure, which is exactly why this is gated behind a stable Tier 1.
5. Deploy and test on testnet only, per the constraint above.
6. **Hard cutoff:** if this isn't passing tests by hour 32 (see plan.md), abandon it and submit Tier 1. Do not let this risk the whole submission.

## Phase 6 — Tier 2 stretch: x402 (optional, only after Phase 5 or instead of it)

1. Stand up a small endpoint (mock is fine) that returns HTTP 402 with a `PAYMENT-REQUIRED` header for unauthenticated requests.
2. Agent catches the 402, decodes the header, signs a small USDC payment via the Phase 1 Dynamic wallet, resubmits with a `PAYMENT-SIGNATURE` header.
3. Use the returned data to inform the Phase 2/3/5 decision. This is Dynamic's own documented territory (their track page confirms x402/MPP payment support) — ground your implementation in their actual docs, not assumptions.

## What NOT to build

- Nothing outside the phases above without explicit sign-off first.
- No mainnet capital in the Uniswap/hook leg unless Discord confirms it's required — keep that on testnet.

## Definition of done

**Tier 1 (must-have):**
- [ ] Working Uniswap integration (swap or liquidity action), evidenced, with repo artifacts (`FEEDBACK.md`, feedback form, README pointing to code)
- [ ] Dynamic wallet action with enforced spend cap, pattern named
- [ ] One real mainnet Flash trade with tx hash
- [ ] One feed/log showing the full chain with evidence
- [ ] Recorded demo

**Tier 2 (nice-to-have, hard-gated by time):**
- [ ] Custom V4 hook passing tests on testnet
- [ ] x402 payment loop informing the agent's decision
