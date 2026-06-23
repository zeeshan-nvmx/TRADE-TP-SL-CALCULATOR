---
phase: quick-260623-cee
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ResultsPanel.jsx
autonomous: true
requirements:
  - MOBILE-RESULTS-REORDER
must_haves:
  truths:
    - "On mobile (< md), ResultsPanel sections render in order: Position Sizing, Profit Scenarios, Loss Scenario, Trade Analysis, Binance Fees, Liquidation Analysis, then Trailing Stop Scenario"
    - "On desktop (>= md), ResultsPanel section order is unchanged (Trade Analysis, Binance Fees, Position Sizing, Profit Scenarios, Loss Scenario, Trailing Stop Scenario, Liquidation Analysis)"
    - "npm run build completes without errors"
  artifacts:
    - path: "src/components/ResultsPanel.jsx"
      provides: "Responsive order utilities on each section; root container is flex flex-col gap-4"
  key_links: []
---

<objective>
Reorder the ResultsPanel sections on mobile browsers only. Desktop layout must remain pixel-identical.

Current mobile order (grid is single-column on mobile, so the left column stacks above ResultsPanel):
Trade Setup > Take Profit Targets > Stop Loss > [Trade Analysis > Binance Fees > Position Sizing > Profit Scenarios > Loss Scenario > Trailing Stop Scenario > Liquidation Analysis]

Desired mobile order:
Trade Setup > Take Profit Targets > Stop Loss > Position Sizing > Profit Scenarios > Loss Scenario > Trade Analysis > Binance Fees > Liquidation Analysis (> Trailing Stop Scenario)

Purpose: On mobile, place Position Sizing and the P/L scenarios directly under the inputs where they are most actionable; push the analytical/fee sections lower.
Output: ResultsPanel.jsx edited with responsive `order` utilities; build passing; commit recorded.
</objective>

<context>
@.planning/STATE.md
</context>

<approach>
Position Sizing already lives inside ResultsPanel (it is not in the left column). The grid stacks the left column above ResultsPanel on mobile, so the entire reorder is internal to ResultsPanel — no orchestrator change is needed.

Because desktop and mobile need DIFFERENT orders within the same panel, use responsive Tailwind `order` utilities:
- Default (`order-N`): mobile order.
- `md:order-N`: restores the exact current desktop DOM order, so desktop is untouched.

The root container changes from `space-y-4` to `flex flex-col gap-4` (CSS `order` only applies inside a flex/grid container; `gap-4` == `space-y-4` spacing; block children render identically in a flex column).
</approach>

<order_map>
| Section                | mobile order | desktop md:order |
|------------------------|--------------|------------------|
| Trade Analysis         | order-4      | md:order-1       |
| Binance Fees           | order-5      | md:order-2       |
| Position Sizing        | order-1      | md:order-3       |
| Profit Scenarios       | order-2      | md:order-4       |
| Loss Scenario          | order-3      | md:order-5       |
| Trailing Stop Scenario | order-7      | md:order-6       |
| Liquidation Analysis   | order-6      | md:order-7       |
</order_map>

<tasks>

<task type="auto">
  <name>Task 1: Apply responsive order utilities, verify build, commit</name>
  <files>src/components/ResultsPanel.jsx</files>
  <action>
    1. Change root container `className='space-y-4'` to `className='flex flex-col gap-4'`.
    2. Add the `order` / `md:order` classes per the order_map to each section's opening div. Wrap the bare `<PositionSizing/>` element in `<div className='order-1 md:order-3'>...</div>`.
    3. Run `npm run build` — must pass with no errors.
    4. Commit the code change atomically (ResultsPanel.jsx only).
  </action>
  <verify>npm run build passes; desktop DOM order is reproduced by the md:order values, so desktop is visually unchanged.</verify>
  <done>Build green, commit recorded, desktop visually unchanged, mobile reordered to the desired flow.</done>
</task>

</tasks>
