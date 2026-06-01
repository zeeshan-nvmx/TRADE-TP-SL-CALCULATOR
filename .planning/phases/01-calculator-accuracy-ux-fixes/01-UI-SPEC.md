---
phase: 1
slug: calculator-accuracy-ux-fixes
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-01
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for calculator accuracy and UX fixes phase. This phase extends existing design patterns without introducing new design system values.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none |
| Icon library | emoji (no external icon package) |
| Font | Inter (TailwindCSS system stack) |

**Status:** No design system framework (shadcn not used). All changes use existing TailwindCSS utility classes and React component patterns established in TradeSetup, TakeProfitTargets, and StopLossConfig.

---

## Spacing Scale

Declared values (all multiples of 4 or inline utility values):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline spacing |
| sm | 8px | Compact element spacing (gap-1, gap-2) |
| md | 16px | Default element spacing (gap-3, p-4) |
| lg | 24px | Section padding (space-y-3) |

Exceptions: None — all spacing in Phase 1 uses existing Tailwind utilities. No new spacing tokens introduced.

**Phase 1 Usage:**
- Per-field toggle buttons use existing gap-1 / gap-2 spacing from TradeSetup pattern
- Toggle placement: inline with label, right-aligned (justify-between)
- No new section breaks or layout changes

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Label (text-xs) | 12px | 400 | 1 |
| Body (text-sm) | 14px | 400 | 1 |
| Heading (text-base) | 16px | 500 | 1 |
| Display | N/A | N/A | N/A |

**Phase 1 Usage:**
- Section headings: text-base font-medium (unchanged)
- Toggle button labels: text-xs (unchanged, matching "🔄 Auto" / "✋ Manual" pattern from TradeSetup)
- Price field labels: text-xs font-medium text-neutral-500 (unchanged)
- No new typography introduced

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | white / black (dark mode) | Background, form inputs, surfaces |
| Secondary (30%) | neutral-100 / neutral-800 (dark) | Cards, section borders |
| Accent (10%) | green-100 / blue-100 (semantic) | Active toggles (auto mode ON), info callouts |
| Destructive | red-300 / red-700 (dark) | Invalid input state only |

**Accent color reserved for:**
- Auto/manual toggle active state: green background when "Auto" is ON (matching TradeSetup pattern)
- Confirmation/info callouts: blue borders and backgrounds
- Warning states: amber/yellow for warnings

**Phase 1 Color Additions:**
- Toggle buttons (Auto mode ON): `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` (copied from TradeSetup line 165-166)
- Toggle buttons (Manual mode ON): `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400` (copied from TradeSetup line 166-167)
- No new colors introduced; Phase 1 reuses existing palette

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| TP1 toggle label | "🔄 Auto" (when enabled) / "✋ Manual" (when disabled) |
| TP2 toggle label | "🔄 Auto" (when enabled) / "✋ Manual" (when disabled) |
| TP3 toggle label | "🔄 Auto" (when enabled) / "✋ Manual" (when disabled) |
| SL toggle label | "🔄 Auto" (when enabled) / "✋ Manual" (when disabled) |
| Toggle title (tooltip) | "Auto price updates enabled" OR "Manual price mode - auto updates disabled" |
| TP price field label | "Price" (existing, no change) |
| SL price field label | "Price" (existing, no change) |
| Loading indicator | "(updating...)" appended to label when price fetch in progress |

**Copy Rationale:**
- Emoji-based toggle labels (🔄 / ✋) maintain visual consistency with existing TradeSetup entry price toggle (line 169)
- Title attributes provide tooltips on hover (matching TradeSetup pattern, line 168)
- "Auto price updates enabled" / "Manual price mode" clarifies state for accessibility
- Loading indicator "(updating...)" follows existing pattern from TradeSetup (line 159)

**Phase 1 Copywriting Changes:**
- Per-field toggles use identical copy pattern to entry price toggle (copy from TradeSetup unchanged)
- TP1 text must clarify: "TP1 auto-tracks live price on app load" (not in code, visible in UI state only)
- No new destructive actions introduced in Phase 1

---

## Component Toggle Pattern (Reference: TradeSetup)

The auto/manual toggle pattern established in TradeSetup.jsx (lines 155-180) is the template for Phase 1 TP/SL toggles:

```jsx
// Pattern from TradeSetup (entry price toggle):
<div className='flex justify-between items-center mb-1'>
  <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
    Entry Price
    {isLoadingPrice && <span className='text-blue-500 ml-1'>(updating...)</span>}
  </label>
  <button
    onClick={() => setAutoPriceUpdate(!autoPriceUpdate)}
    className={`text-xs px-2 py-1 rounded transition-colors ${
      autoPriceUpdate
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}
    title={autoPriceUpdate ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
    {autoPriceUpdate ? '🔄 Auto' : '✋ Manual'}
  </button>
</div>
```

**Phase 1 Application:**
- TP1, TP2, TP3 toggles: Adapt this pattern inside TakeProfitTargets.jsx (one toggle per TP above the price input)
- SL toggle: Adapt this pattern inside StopLossConfig.jsx (one toggle above the SL price input)
- All styling and copy must match TradeSetup exactly for visual consistency

**Placement Rules:**
- Toggle button always right-aligned (justify-between on parent)
- Positioned above the price input field (in the label row)
- Active state (Auto ON): green background, green text
- Inactive state (Manual OFF): gray background, gray text

---

## Position Sizing Presets

**Updated FIXED_USDT_PRESETS array (constants/presets.js):**

```
Before: [100, 200, 250, 300, 400, 500, ...]
After:  [20, 50, 100, 200, 250, 300, 400, 500, ...]
```

**Preset Button Styling:** Unchanged from existing PositionSizing.jsx (lines 65-78)
- Active preset: `bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium`
- Inactive preset: `border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300`

**Default Margin Input Value:**
- Change from: "100" USDT
- Change to: "50" USDT
- This is a state initialization change only (useCalculator.js); no visual change

---

## Visual Changes Summary (Phase 1)

| Change | Location | Type | Details |
|--------|----------|------|---------|
| TP1 auto/manual toggle | TakeProfitTargets.jsx | New button | Above TP1 price field; uses TradeSetup pattern |
| TP2 auto/manual toggle | TakeProfitTargets.jsx | New button | Above TP2 price field; uses TradeSetup pattern |
| TP3 auto/manual toggle | TakeProfitTargets.jsx | New button | Above TP3 price field; uses TradeSetup pattern |
| SL auto/manual toggle | StopLossConfig.jsx | New button | Above SL price field; uses TradeSetup pattern |
| Preset buttons (20, 50) | PositionSizing.jsx | Updated list | Prepend [20, 50] to existing buttons; no style change |
| Default margin value | PositionSizing input | State change | "100" → "50" on app load; no visual change |

---

## Interaction & State Contract

**Default Toggle State (App Load):**
- Entry price: OFF (manual mode, no auto-tracking)
- TP1 price: ON (auto-tracking live price)
- TP2 price: OFF (manual mode)
- TP3 price: OFF (manual mode)
- SL price: OFF (manual mode)

**Toggle Behavior:**
- Clicking toggle button flips the state (ON ↔ OFF)
- State persists across form changes (not reset when user edits other fields)
- When ON (auto mode): Button shows "🔄 Auto" with green background
- When OFF (manual mode): Button shows "✋ Manual" with gray background
- When price is being fetched: Label shows "(updating...)" in blue text (existing pattern from TradeSetup)

**Price Update Logic (BinanceFuturesCalculatorNew.jsx):**
- If toggle is ON and new price arrives from API: Update the field immediately
- If toggle is OFF and new price arrives: Ignore it; field value unchanged
- Per-field independence: TP1 can be auto while TP2 is manual (no forced linking)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | N/A | not applicable |
| React (native) | useState, useEffect, useCallback | not required (internal React) |
| TailwindCSS | Utility classes only | not required (existing project) |

**No third-party component registries used. Phase 1 adds only React state and TailwindCSS classes.**

---

## Constraints & Dependencies

**Stack Lock (from CLAUDE.md):**
- React 19.0.0 + Vite + TailwindCSS 3.4.17 (no changes)
- No new external packages
- No TypeScript (plain JavaScript/JSX only)

**API Constraint:**
- Binance Futures API endpoint unchanged: `https://fapi.binance.com/fapi/v1/ticker/price`
- Polling interval unchanged: 3 seconds
- No modifications to API call structure or response handling

**Component Dependencies:**
- TradeSetup: No changes required (serves as pattern reference only)
- TakeProfitTargets: Add 3 toggle buttons (one per TP)
- StopLossConfig: Add 1 toggle button (for SL price)
- PositionSizing: Update FIXED_USDT_PRESETS constant
- BinanceFuturesCalculatorNew: Add useEffect for per-field toggle logic (new state passed down)
- useCalculator hook: Add state for tpAutoPriceUpdate (array of 3), slAutoPriceUpdate (boolean), and handlers

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
