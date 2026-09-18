# Aegis — Autonomous Liquidity & Risk Management Agent

> Built for **Runtime Agent Week (2026)**  
> Tracks: **Uniswap** • **Dynamic** • **Definitive Flash**

---

## Overview

**Aegis** is an autonomous AI agent designed to protect and optimize decentralized liquidity. It senses on-chain market conditions (volatility spikes, range breakouts, DEX price divergences), makes structured hedging decisions, executes multi-venue orders across **Uniswap** and **Definitive Flash**, and authorizes all capital deployment through a **Dynamic Server Wallet** governed by a strict, non-negotiable spend cap.

In under 15 seconds, judges can observe the complete causal chain on the live feed:
$$\text{Agent Signal / Decision} \longrightarrow \text{Multi-Venue Execution (Uniswap + Flash)} \longrightarrow \text{Dynamic Wallet Authorization}$$

---

## Track Implementations & Code Pointers

As required by each sponsor track checklist, here are the exact files and lines of code implementing the integrations:

### 1. Uniswap Integration (`Uniswap Track`)
- **Integration File:** [`src/services/uniswap.ts`](src/services/uniswap.ts)
  - `UniswapService.getQuote()` (Lines 48–101): Hits the official Uniswap Trading API (`https://trade-api.gateway.uniswap.org/v1/quote`) using developer platform credentials (`x-api-key`).
  - `UniswapService.executeSwap()` (Lines 106–153): Prepares and executes automated token swaps and liquidity rebalancing on **Ethereum Sepolia** (ChainId: `11155111`), outputting real transaction hashes and explorer links to Sepolia Etherscan.
- **Developer Platform Feedback:** [`FEEDBACK.md`](FEEDBACK.md) contains full developer feedback, SDK analysis, and responses to the Uniswap Developer Feedback Form.

### 2. Dynamic Server Wallet Integration (`Dynamic Track`)
- **Integration File:** [`src/services/dynamic.ts`](src/services/dynamic.ts)
  - **Documented Pattern:** Server Wallets via `@dynamic-labs-wallet/node-evm` and `@dynamic-labs-wallet/node`.
  - `DynamicWalletService.initialize()` (Lines 38–88): Authenticates using `DynamicEvmWalletClient.authenticateApiToken()` and initializes a 2-of-2 MPC Threshold Signature account (`ThresholdSignatureScheme.TWO_OF_TWO`).
  - `DynamicWalletService.checkSpendCap()` (Lines 94–110): Hard-coded, programmatic spend cap enforcement (`MAX_AGENT_SPEND_CAP_USD = $50.00`). Completely halts execution and raises a `SPEND_CAP_EXCEEDED` exception if any requested action exceeds the limit.
  - `DynamicWalletService.signTypedData()` (Lines 148–177): Signs EIP-712 typed data payloads for Definitive Flash orders using the Dynamic MPC wallet.
  - `DynamicWalletService.signMessage()` (Lines 182–198): Cryptographic message signing for agent authorizations and machine payments.

### 3. Definitive Flash Execution (`Definitive Flash Track`)
- **Integration File:** [`src/services/flash.ts`](src/services/flash.ts)
  - **Venue & Network:** Definitive Flash REST API on **Base Mainnet** (ChainId: `8453`).
  - **Advanced Order Type:** **Bracket Order** (`orderType: "bracket"` with `attachedBracket: { takeProfit, stopLoss }`).
  - `DefinitiveFlashService.getBracketQuote()` (Lines 116–247): Requests real-time pricing and signable EIP-712 payloads from `https://flash.definitive.fi/v1/quote`.
  - `DefinitiveFlashService.executeBracketOrder()` (Lines 282–393): Signs the primary order typed data AND the attached bracket typed data using the Dynamic Server Wallet, then submits to `https://flash.definitive.fi/v1/order`.
  - **Non-Negotiable Live Money Safeguard:** Line 6 declares `MAX_LIVE_ORDER_USD = 20`, and it is enforced twice independently of any decision logic — once at Line 118 (before quoting) and again at Line 284 (before submission). This dumb, unconditional safety assertion stops any order larger than $20 before real capital moves on mainnet.

### 4. Machine Payments (x402 Tier 2 Flourish)
- **Integration Files:** [`src/services/x402.ts`](src/services/x402.ts) & [`src/app/api/oracle/volatility/route.ts`](src/app/api/oracle/volatility/route.ts)
  - Implements the HTTP 402 Payment Required flow. Unauthenticated oracle requests return `402 Payment Required` with a `PAYMENT-REQUIRED` challenge. The agent catches this, signs a $0.05 USDC micro-payment through the Dynamic wallet, and resubmits with a `PAYMENT-SIGNATURE` header to unlock high-frequency volatility metrics.

---

## Architecture & Causal Flow

```
+-------------------------------------------------------------------+
|                           AEGIS AGENT                             |
|                                                                   |
|  [Step 1: Signal & Decision]                                      |
|    - Monitored: Realized Volatility / Price Tick Discrepancy      |
|    - Reasoning: "Volatility rising, rebalancing LP + hedge"       |
|                                                                   |
|  [Step 3: Dynamic Wallet Authorization]                           |
|    - Pattern: Server Wallet (2-of-2 MPC)                          |
|    - Spend Cap Policy: $50.00 Limit (Action: $14.00)              |
|    - Check: Action approved -> Signs EIP-712 Payloads             |
|                                                                   |
|  [Step 2: Multi-Venue Execution]                                  |
|    +-----------------------------+ +---------------------------+  |
|    |      Uniswap (Sepolia)      | |   Definitive Flash (Base) |  |
|    |  Liquidity Rebalance Swap   | |   Bracket Order (TP + SL) |  |
|    |  0.005 WETH -> 13.25 USDC   | |   14.00 USDC -> 0.0053 ETH|  |
|    |  Tx: 0x9c4f...f3a2          | |   Tx: 0x3a7e...4619       |  |
|    +-----------------------------+ +---------------------------+  |
|                                                                   |
|  [Step 4: Machine Payment (Tier 2 Flourish)]                      |
|    - HTTP 402 Payment Required -> Dynamic Signs $0.05 USDC        |
|    - Resubmits with PAYMENT-SIGNATURE -> Oracle Data Unlocked     |
+-------------------------------------------------------------------+
```

---

## Visual Design & UX Highlights

Built to `aegis-design-prompt.md`, then elevated by the premium styling pass in
`aegis-ui-styling-prompt.md` (dials: DESIGN_VARIANCE 3-4 · MOTION_INTENSITY 3-4 ·
VISUAL_DENSITY 5-6 — styling and layout only, no behavior change):

- **One continuous causal chain:** the three steps sit on a single visible rail with
  directional flow indicators — a horizontal rail with chevrons in the orientation
  strip, a vertical rail with numbered nodes inside each cycle. The chain reads as
  one flow, not three widgets.
- **Trust numbers lead the hierarchy:** `DYNAMIC SPEND CAP` and `SAFETY CEILING` use
  the display face at 3xl with tabular figures; status chips are deliberately quiet
  beneath them.
- **Live vs staged is visible without reading text:** consistent color coding on
  borders, glows, dots and badges — 🟢 **Base Mainnet (live)** for the Definitive
  Flash leg, 🟡 **Ethereum Sepolia (staged)** for the Uniswap leg.
- **Typography with a real hierarchy:** one display face for key numbers (spend cap,
  amounts, metric vs threshold), Inter for labels/prose, and monospace reserved for
  hashes, addresses and raw values.
- **Layered surfaces instead of flat boxes:** soft elevation, hairline borders,
  recessed metric wells, and subtle spring transitions on state changes
  (`cubic-bezier(0.16, 1, 0.3, 1)`), all disabled under `prefers-reduced-motion`.
- **Agent Thesis gets real presence:** the plain-language reasoning is a quoted,
  accent-edged card rather than one more dense text block.
- **Deep inspection:** expandable cryptographic drawer displaying raw EIP-712 typed
  data payloads, domains, messages, and ECDSA signatures.

Design tokens live in `tailwind.config.ts`; shared surface/typography utilities in
`src/app/globals.css`.

---

## Testing & Verification

The checklist in [`test.md`](test.md) is implemented as an executable suite plus an
evidence log. Run it with:

```bash
npm test          # single run, used in CI
npm run test:watch
```

| Suite | Covers |
|---|---|
| `tests/credentials.test.ts` | §1.6 no committed secrets, placeholder-only `.env.example`, env-only credential reads |
| `tests/dynamic-wallet.test.ts` | §2.1–2.4 wallet init, signature recovery/verification, spend-cap enforcement |
| `tests/flash-safety.test.ts` | §4.1/§4.3/§4.5 + §6.2 live-order ceiling, no retry/resubmit, quote-expiry handling |
| `tests/agent-chain.test.ts` | §5.1/§5.2/§6.1 full chain per scenario, network-label accuracy, graceful over-cap abort |
| `tests/x402-payment.test.ts` | machine-payment flow and the HTTP 402 oracle contract |
| `tests/api-routes.test.ts` | route contract for the feed UI, safeguard error path, RPC probe |
| `tests/rpc.test.ts` | §1.4/§1.5/§6.3 `eth_blockNumber` probe, bounded retries, timeout instead of hang |
| `tests/repo-artifacts.test.ts` | §3.3 submission artifacts and doc-link integrity |

**[`TEST_LOG.md`](TEST_LOG.md)** records the actual result of every checklist item,
including the items that cannot be run from a sandbox with no outbound egress, and
what was fixed when a test failed. Items requiring live mainnet capital, a browser,
or an external API key are marked BLOCKED there rather than claimed as passing.

> **Security note:** all credentials are read from the environment only. Earlier
> revisions of this repo contained literal API keys as fallback defaults; they were
> removed on 2026-09-18 and those keys must be treated as compromised and rotated.
> `tests/credentials.test.ts` fails the build if a real credential is committed again.

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/dammygreene/Aegis.git
cd Aegis
npm install
```

### 2. Environment Configuration

Create `.env.local` based on `.env.example`:

```bash
# Dynamic
DYNAMIC_AUTH_TOKEN=dyn_your_token_here
DYNAMIC_ENVIRONMENT_ID=your_env_id_here

# Definitive Flash
DEFINITIVE_FLASH_API_KEY=dpka_your_flash_key_here

# Uniswap
UNISWAP_API_KEY=your_uniswap_key_here

# Alchemy
ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/your_key
ALCHEMY_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key

# Safety Ceilings
MAX_LIVE_ORDER_USD=20
MAX_AGENT_SPEND_CAP_USD=50
```

### 3. Build & Run

```bash
# Build production bundle
npm run build

# Start server
npm start
```

Open `http://localhost:3000` to interact with the Aegis dashboard.

---

## License

MIT License.
