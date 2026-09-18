# Aegis — Runtime Agent Week Build Plan

**Deadline:** Saturday, Sept 19, 4:00 PM EDT (submission) / 5:00 PM EDT (demos begin)
**Runway:** roughly 40 hours from now — the hard constraint on everything below.

## 0. Non-negotiable constraints

- **Definitive Flash requires live mainnet execution** — no testnets for that leg. Keep position size trivial (tens of USD, not hundreds). This is your only confirmed real-money requirement.
- **Uniswap does NOT have a confirmed mainnet-only requirement.** Their track asks you to "integrate Uniswap's API, AMM, or CCA" — nothing on the track page mandates mainnet. Uniswap's own infrastructure supports testnets (Sepolia, Unichain Sepolia). **Default to testnet for the hook/pool** unless Discord confirms otherwise — this keeps your real capital exposure limited to the Flash leg only, matching your budget intent.
- **Dynamic**: no confirmed mainnet requirement either. Use a dev/sandbox environment for the wallet unless real funds are structurally required by whatever it's connected to.
- Ask in Runtime Discord in the first 30 minutes: *"For the Uniswap track specifically — is testnet acceptable for the hook/pool, or does the AMM integration need to be on mainnet?"*
- Every submission is auto-eligible for the Bankr grand prize. Sponsor tracks are opt-in and stackable.

## 1. What we're building — two-tier scope

Aegis targets three tracks with one architecture: an AI agent that manages liquidity positions around a Uniswap V4 pool, executes trades through Definitive Flash, and holds/authorizes funds through a Dynamic wallet. x402 is an optional narrative layer, not a track requirement.

Given the real timeline, this plan has **two tiers**. Tier 1 is what must exist by the deadline. Tier 2 is the ambitious version you attempt only after Tier 1 is checkpointed safe.

### Tier 1 (safe floor — guarantees a submission)

- **Uniswap leg:** a direct swap or liquidity add/remove through Uniswap's official API/SDK against an existing pool (testnet). This alone satisfies the Uniswap track's literal requirement ("integrate Uniswap's API, AMM, or CCA") without writing a custom hook.
- **Dynamic leg:** delegated-access or agent-wallet pattern (per their actual documented patterns — server wallet / agent wallet / delegated access) authorizing the Uniswap and Flash actions.
- **Flash leg:** one live mainnet Bracket or Take Profit order, trivial size, real tx hash.
- **The story:** agent monitors a condition → decides to rebalance/trade → executes through Uniswap and/or Flash → wallet authorizes it within a spend cap. One feed view shows the chain with evidence for each step.

### Tier 2 (stretch — only if Tier 1 is done early)

- **Custom Uniswap V4 hook** on testnet: `beforeSwap`/`afterSwap`/`beforeAddLiquidity`/`beforeRemoveLiquidity` permissions, CREATE2 salt-mined deployment address, JIT liquidity concentration logic via the `v4-template` repo and `HookMiner`.
- **x402 machine-to-machine payment:** agent hits a (real or mocked) premium data endpoint, receives HTTP 402, pays via the Dynamic wallet using x402 (Dynamic's docs confirm they support x402/MPP payment flows — this part has real grounding), resubmits with proof, uses the data to inform its rebalance decision.

**Do not start Tier 2 until Tier 1 is confirmed working end to end.** A working Tier 1 submission beats an unfinished Tier 2 every time — judges score what runs, not what was attempted.

## 2. On the unverified API claim

Earlier research surfaced the term "x-agentic-access execution contracts" for Dynamic. This was **not confirmed** against Dynamic's actual docs (which describe server wallets, agent wallets, and delegated access as the named patterns, plus x402/MPP for payments). Build against the confirmed pattern names. If your agent encounters "x-agentic-access" in Dynamic's real docs during Phase 1, great — verify it live and proceed. If it doesn't exist, use delegated access instead; the functional story (scoped, revocable agent signing authority within a spend cap) is the same either way.

## 3. Cost breakdown (corrected)

Infrastructure and gas cost effectively round to zero if you stay disciplined about where things run:

- **Local dev/testing (Anvil + Foundry):** free, no gas, no risk. Use this for all hook iteration.
- **Testnet deployment (Uniswap hook/pool, if not required on mainnet):** free or near-free (testnet ETH from a faucet).
- **Dynamic, Flash API keys (dev/sandbox tier):** standard hackathon practice, typically free — verify exact tier limits directly with each sponsor's docs/Discord rather than assuming a specific number (e.g. MAU caps, support duration) without a source.
- **Gas on Base (or another L2) for anything that needs to be live/public for evidence:** sub-cent to a few cents per transaction.

**Not free, and not optional:** the Definitive Flash leg is confirmed live-mainnet-only. Placing a real Bracket/Take Profit order requires actual capital funding that position — this capital isn't "spent" (you get it back, adjusted by the trade's P&L), but it must be genuinely at market risk for the trade's duration. Budget roughly $10–30 in position size for this leg specifically. This is the one number in the whole build that doesn't round to zero.

**Also note:** a purely local Anvil demo produces no public explorer link, so it can't satisfy the tx hash / explorer link / execution log evidence both the Dynamic and Uniswap tracks ask for. Local is fine for development; testnet (still ~free) is the minimum needed for anything you actually submit as evidence.

## 4. Checkpoint schedule

| Hour | Checkpoint | If missed |
|---|---|---|
| H+1 | Discord questions sent (Uniswap testnet policy, Dynamic API surface); all API keys/access requested | Proceed on the assumption of testnet-everywhere except Flash |
| H+5 | Dynamic wallet provisioned, one authenticated action executed | Fall back to simplest pattern (server wallet) |
| H+9 | Uniswap Tier 1 swap/liquidity action working on testnet | If blocked, this becomes the priority — it's a track requirement, not optional |
| H+13 | Flash: one live mainnet Bracket/TP order placed successfully, gated by a hard-coded `MAX_LIVE_ORDER_USD` cap checked independently of the trading logic (see build-prompt.md — required since this build runs unsupervised overnight) | Escalate in Discord immediately if blocked — no substitute for this leg |
| H+16 | **TIER 1 CHECKPOINT.** Full chain wired: agent decision → Uniswap and/or Flash execution → Dynamic authorization, at least once | If not working, stop here. Stabilize Tier 1 only for the remaining time — do not start the V4 hook. |
| H+20 | Feed/log UI showing the chain with evidence per step | Fallback: clean log output is acceptable |
| **H+22** | **Decision point: attempt Tier 2 or not.** Only proceed to the custom hook if Tier 1 has been stable for several hours | If any doubt, stay on Tier 1 and use remaining time to polish the demo instead |
| H+22–32 | (If attempting) V4 hook: permissions bitmap, salt mining, `unlock()`/`settle()`/`take()` accounting, tested on testnet via Foundry | Hard cutoff at H+32 regardless of progress — revert to Tier 1 if not passing tests |
| H+34 | Demo recording done | Non-negotiable for online entries |
| H+38 | Submission form filled: links, tracks selected, evidence attached | Leave buffer, don't do this at H+40 |
| H+40 | Deadline. Submit. | — |

## 5. Per-track requirements checklist

**Uniswap**
- [ ] Integrated Uniswap's API, AMM, or CCA (Tier 1 swap/liquidity action satisfies this on its own — hook is bonus depth, not a requirement)
- [ ] Public GitHub repo, open source
- [ ] README points to the exact contracts/lines implementing the integration
- [ ] `FEEDBACK.md` in the repo
- [ ] Uniswap Developer Feedback Form completed, link to `FEEDBACK.md` included
- [ ] Submissions are audited before winners are finalized — don't skip the feedback form

**Dynamic**
- [ ] Documented wallet pattern used (server / agent / delegated access), named explicitly in the demo
- [ ] Evidence: tx hash / explorer link / execution log
- [ ] Spend cap or equivalent policy demonstrated

**Definitive Flash**
- [ ] At least one advanced order type used (Bracket or Take Profit recommended)
- [ ] Live mainnet, real tx hash
- [ ] X post tagging @DefinitiveFi, linked in submission form

## 6. Risk register

| Risk | Mitigation |
|---|---|
| V4 hook accounting bug (`CurrencyNotSettled` or worse) eats remaining time | Hard H+32 cutoff, Tier 1 already submittable regardless |
| Agent invents API surface that doesn't exist | Ground every integration in the linked docs; verify before wiring, especially anything payment- or fund-related |
| Uniswap track's audit-before-winners process penalizes rushed feedback form | Fill out `FEEDBACK.md` and the Developer Feedback Form as part of Tier 1, not as an afterthought |
| Real funds lost on Flash leg | Trivial position size only, plus hard-coded `MAX_LIVE_ORDER_USD` cap independent of trading logic |
| Build running unsupervised overnight, no one present to catch a live-money mistake in real time | Hard spend cap as a second, dumb check before any live order; agent stops and logs rather than guessing on ambiguous signing/response shapes; full request/response logging for morning review |
| Running out of time mid-hook | Tier system exists precisely so this doesn't cost you the submission |
