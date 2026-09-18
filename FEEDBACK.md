# Uniswap Developer Platform Feedback — Aegis Integration

**Project:** Aegis (Autonomous Liquidity & Risk Management Agent)  
**Hackathon:** Runtime Agent Week (2026)  
**Integration Type:** Uniswap Trading API (`https://trade-api.gateway.uniswap.org/v1/quote` & `/v1/swap`), AMM execution, and Router settlement.  
**Network:** Ethereum Sepolia (ChainId: 11155111)  
**Integration Files:**
- `src/services/uniswap.ts` (Lines 1–110)
- `src/services/agent.ts` (Multi-venue execution orchestration)

---

## 1. What was built with Uniswap?

Aegis is an autonomous AI agent that monitors on-chain volatility and price divergence across pools. When a threshold condition triggers (e.g. 30-day realized volatility exceeding 50% or pool range breakout):
1. **Dynamic Wallet** enforces an authorized spend cap.
2. **Uniswap Integration** executes automated liquidity rebalancing and token swaps on Ethereum Sepolia.
3. **Definitive Flash** executes risk-hedging Bracket orders with take-profit and stop-loss bounds on Base Mainnet.

## 2. API & SDK Developer Experience

### Positives
1. **Unified Routing Speed:** The `/v1/quote` endpoint returns optimized routes across Uniswap V2, V3, and V4 pools quickly, reducing manual pathfinding logic.
2. **Standardized JSON Schema:** The payload structure (`tokenIn`, `tokenOut`, `amount`, `swapper`, `slippageTolerance`) is clean, predictable, and simple to consume in both TypeScript backend services and autonomous agent scripts.
3. **Multi-Chain Asset Coverage:** Good support for testnet tokens on Sepolia (WETH `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`, USDC `0x1c7d4b196cb0c7b01d743fbc6116a902379c7238`).

### Friction Points & Constructive Feedback

1. **Permit2 Error Messaging & Gasless Fallback:**
   - When calling `/quote` with low testnet token balances or unapproved tokens, the response can return a generic 404 `"No quotes available"` rather than indicating specifically whether the issue is lack of pool liquidity, insufficient token balance, or missing allowance.
   - *Recommendation:* Return an actionable error code (e.g. `INSUFFICIENT_POOL_LIQUIDITY` vs `MISSING_PERMIT2_ALLOWANCE`).

2. **Testnet Rate Limiting & Gateway Headers:**
   - In sandboxed or ephemeral CI/CD environments where egress proxies or strict firewalls exist, the gateway can terminate keep-alive connections abruptly.
   - *Recommendation:* Provide clearer documentation on recommended retry policies and exponential backoff constants for agentic runtimes.

3. **Agent-Native SDK Tooling:**
   - Autonomous agents benefit greatly from standard function-calling definitions (JSON Schema / Model Context Protocol MCP tools) for Uniswap actions.
   - *Recommendation:* Ship official `@uniswap/agent-tools` or `@uniswap/mcp` providing ready-made LangChain/Vercel AI SDK/MCP tool definitions for quoting, swapping, and checking positions.

---

## 3. Uniswap Developer Feedback Form Responses

- **Organization / Developer:** Aegis Team
- **Project URL:** https://github.com/dammygreene/Aegis
- **Documentation Rating:** 4.5 / 5
- **Ease of Integration:** 4.5 / 5
- **Likelihood to recommend Uniswap Developer Platform:** 10 / 10
