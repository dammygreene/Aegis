# Aegis — Start Building

Paste this to your agent now, along with `aegis-plan.md`, `aegis-build-prompt.md`, and `aegis-design-prompt.md` (attach or paste all three files first, then this message).

---

## Scope confirmation

Three tracks only: **Uniswap, Dynamic, Definitive Flash.** Blackbird/Flynet is dropped — do not build a Flynet integration or reference it in the demo. This is final, not a "for now."

Read `aegis-plan.md` for the checkpoint schedule and deadline math, `aegis-build-prompt.md` for the phased technical spec, and `aegis-design-prompt.md` for the feed UI once you reach Phase 4. Follow phase order. Do not skip ahead to Phase 5 (V4 hook) or Phase 6 (x402) until Phase 4 is checkpointed stable — this is a hard rule, not a suggestion.

## Credentials available now

Fill in the actual values before sending — do not commit any of these to the repo, env vars only:

```
# Dynamic
DYNAMIC_AUTH_TOKEN=<secret from New API Key modal — scopes: waas.authenticate, environment.users.write, environment.users.read>
DYNAMIC_ENVIRONMENT_ID=<your environment id>

# Definitive Flash
DEFINITIVE_FLASH_API_KEY=<secret from Portfolio access, Write scope>

# Alchemy — you need up to three separate apps/URLs:
ALCHEMY_SEPOLIA_RPC_URL=<for Uniswap Tier 1 testnet leg>
ALCHEMY_BASE_MAINNET_RPC_URL=<for cheap-gas live transactions if the Uniswap leg or anything else needs to be live>
# (an eth-mainnet URL may also exist from earlier setup — only use it if something specifically requires Ethereum L1 reads; default to Base for anything live)
```

If any of these aren't in hand yet, say so before proceeding on that phase rather than stubbing in a placeholder and continuing — per the ground rule, don't guess.

## Immediate first actions

1. Confirm you can authenticate against all three services above with a trivial read-only call each (e.g. fetch Dynamic environment info, fetch a Flash quote without submitting, hit a Uniswap read endpoint). Report back pass/fail on each before writing any further code.
2. Start Phase 1 (Dynamic wallet) per `aegis-build-prompt.md`. Use the Server Wallets pattern (`@dynamic-labs-wallet/node-evm`, `authenticateApiToken`, `createWalletAccount`) — this is confirmed and documented, not the earlier "Direct pathway" guess.
3. Proceed through Phases 2–4 in order. Hit every checkpoint in `aegis-plan.md`'s schedule — if you miss one, follow the plan's stated fallback for that row rather than pushing forward regardless.
4. Remember: you're running unsupervised overnight from here. The hard spend cap (`MAX_LIVE_ORDER_USD`) on the live Flash order is non-negotiable — implement it before the first real order, not after. If anything about the Flash signing flow doesn't match the documented shape, stop and log it clearly rather than guessing.

## Reporting

Keep a running log (plain markdown or console output is fine) of: what's done, what's blocked, what was skipped and why, and any place you deviated from the plan and had to make a judgment call. This is what gets reviewed in the morning — make it easy to see the state of things at a glance without reading every line of code.

Start now with step 1 above.
