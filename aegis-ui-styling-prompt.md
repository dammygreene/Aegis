# Aegis — UI/UX Premium Styling Prompt

Paste this to your agent as a follow-up, once the functional build (Phases 1-4) is stable. This does not change any logic — styling only.

## Install both skills first

**1. UI UX Pro Max** (design system generation, industry-specific reasoning):
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**2. Taste Skill** — install the redesign variant (this is an existing UI being improved, not a greenfield build) plus the premium visual direction:
```
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"
```

## Step 1 — Generate a fintech-specific design system

Run the design system generator scoped to this product's actual category — a live trading/DeFi dashboard, not a generic app:
```
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech crypto trading agent dashboard" --design-system -f markdown
```
Use this output as the base palette/typography/effects recommendation. Cross-check it against the current screenshot (attached/described below) rather than replacing the existing direction wholesale — the current dark, data-dense trading-terminal aesthetic is correct for this product category; the goal is to elevate its execution, not change its genre.

## Step 2 — Audit the existing UI (redesign-skill)

Use `redesign-existing-projects` to audit current layout, spacing, hierarchy, and styling before changing anything. Specifically look at what's in the current screenshot:
- The top bar (AEGIS badge, status pills, spend cap gauge, safety ceiling) — currently functional but visually flat; badges and numbers compete for attention rather than forming a clear hierarchy.
- The "Trigger Scenario" control row — generic dropdown/button styling, no visual weight matching its importance (this is the primary action of the whole interface).
- The three-step causal chain cards — currently equal-weight boxes; nothing visually reinforces that these are sequential/connected, despite the product's whole pitch being "one continuous chain."
- The cycle timeline / agent reasoning log — dense, functional, but reads as a debug console rather than a premium product surface.
- The multi-venue execution cards (Uniswap/Flash) — flat dark cards with default-looking badges; no visual distinction of live vs. staged/network state beyond text color.

## Step 3 — Apply premium direction (soft-skill dials)

Set the taste-skill dials for this product:
- **DESIGN_VARIANCE: 3-4/10** — clean and structured, not experimental. This is a finance product; trust reads as restraint, not novelty.
- **MOTION_INTENSITY: 3-4/10** — subtle spring motion on state changes (cap gauge filling, cycle advancing, card entering) per the soft-skill's "spring motion" signature. Avoid anything that feels gamified or flashy — no bouncing numbers, no confetti, nothing that undercuts "real money is moving here."
- **VISUAL_DENSITY: 5-6/10** — this is a dashboard and needs to show real information (amounts, hashes, network state), but push toward more whitespace and breathing room than the current screenshot has. Group related numbers, don't just fit more into the same space.

## Step 4 — Specific improvements to make

1. **Visual hierarchy on the top bar**: the DYNAMIC SPEND CAP and SAFETY CEILING numbers are the single most important trust signal in this product (they're the whole "unsupervised overnight, but bounded" story) — give them more visual weight than the status badges next to them, not equal weight.
2. **Make the causal chain actually look causal**: connect the three "signal → execution → wallet authorization" cards with a visible line/flow indicator, not just adjacent boxes with numbers on them. This is the single highest-leverage change for making the product's pitch legible at a glance, matching the original design-prompt's instruction that this should read as "one continuous chain," not three widgets.
3. **Differentiate live vs. staged/testnet state visually, not just by badge text**: the network badges ("Live Base + Sepolia") currently rely on reading text. Use consistent color coding (e.g. a subtle green-tinted border/glow on genuinely live mainnet elements, amber-tinted on testnet elements) so the live/staged distinction is visible even at a glance — this was in the original design-prompt's instructions and should carry through the visual refresh, not get lost in a general "make it premium" pass.
4. **Typography**: apply real hierarchy — one clear display font/weight for the key numbers (spend cap, P&L), a distinct but complementary font for labels/metadata, monospace reserved specifically for hashes/addresses/raw values (already partially done — extend it consistently).
5. **Cards and depth**: replace flat dark boxes with the soft-skill's signature — subtle elevation, soft shadows, refined borders (not harsh 1px lines) — so panels feel like layered premium surfaces rather than bootstrap-style containers.
6. **The reasoning log ("Agent Thesis")**: this is actually a strong, distinctive feature (the agent explaining its reasoning in plain language) — give it more visual presence, e.g. a distinct card treatment or subtle accent, rather than burying it as one more dense text block among condition/metric numbers.

## Constraint

Do not change any functional behavior, API calls, or data while doing this pass — styling and layout only. If a visual change would require restructuring how data flows (not just how it's displayed), flag it rather than making the change silently.
