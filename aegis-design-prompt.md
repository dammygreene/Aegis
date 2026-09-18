# Design Prompt — Aegis feed screen

Paste this to your agent once Phase 4 in aegis-build-prompt.md is reached.

## What this screen has to do

Judges should understand the whole system in under 15 seconds without narration. The job is to make the causal chain obvious: **agent detected a condition → decided an action → executed it through Uniswap and/or Flash → authorized it through Dynamic.** One visible chain, not four disconnected widgets.

## Layout

A single vertical timeline/feed. Each step is a card, most recent at top or bottom — pick one and stay consistent.

**Step 1 — Signal / decision**
- What triggered the agent (price threshold crossed, manual trigger, timer, whatever you implemented)
- One plain-language line of the agent's reasoning ("Volatility rising, rebalancing toward tighter range" or similar, matched to whatever you actually built)
- Timestamp

**Step 2 — Execution (Uniswap and/or Flash)**
- Which venue executed it, order/action type (e.g. "Bracket Order" or "Uniswap swap")
- Amounts, tx hash truncated and linked to the explorer
- **Network badge** — testnet vs mainnet, small but unmissable (this matters more here than in a single-chain product, since your legs run on different networks)

**Step 3 — Wallet authorization**
- Wallet pattern used (e.g. "Delegated Access"), shown as a label
- Spend cap shown explicitly ("Authorized up to $X — this action: $Y")
- Execution log line or tx hash

**(If Tier 2 shipped) Step 4 — Data purchase (x402)**
- What was paid for, amount, `PAYMENT-SIGNATURE` confirmation
- Keep this visually secondary to the core three steps — it's a flourish, not the headline

## Visual direction

- Dark, trading-terminal feel — monospace for numbers/hashes/addresses, clean sans for labels.
- One accent color for the connecting thread between steps, reinforcing this is one flow.
- Network badges: a consistent color code (e.g. green = mainnet/live, amber = testnet) reused everywhere a badge appears — critical here since you're deliberately running different legs on different networks and need to be transparent about that, not confusing.
- One screen, no required scrolling for the core chain. Raw logs/full tx data behind a "details" expand.

## What to avoid

- Don't build a multi-page app — one focused screen beats a full product shell for a hackathon demo.
- Don't bury which network each step ran on — that honesty is part of the pitch.
- Don't let Tier 2 elements (the hook mechanics, x402) visually dominate over the core three-step story — the chain is the pitch, the hook is proof of depth for anyone who asks follow-up questions.
