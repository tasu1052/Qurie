# ChartLegend

The shared element every chart carries OUTSIDE its plot area: a legend row of
color-swatch boxes + series names.

Rules (lint-enforced):
- Never write color words in copy ("ink: 서울 2반", "indigo: 서울 1반"). The swatch
  carries the color; the text carries only the series name.
- Every `LineChart` and `BarChart` sits in a card with the legend row directly below
  the plot. `DonutChart` is exempt — its side legend is built in (same swatch style).
- Legend order matches series/data order. The indigo swatch (`accent: true`) marks
  the single highlighted series; everything else follows the ink/grey palette.
- Swatch: 10×10px, 3px radius. Text: 12px `--text-secondary`.

```jsx
<LineChart series={series} labels={labels} />
<ChartLegend items={[{label:'서울 2반'},{label:'서울 1반',accent:true}]} />
```

## Per-chart conventions
- **LineChart** — max 2–3 series; one indigo accent series, rest ink/grey. Dots only
  when points are annotated/hoverable. 3 horizontal gridlines, no vertical grid.
- **BarChart** — single series, ink bars; at most ONE indigo `highlight` bar (current
  entity or best/worst callout). Value labels only when ≤ 8 bars.
- **DonutChart** — one indigo accent segment, rest grayscale, in data order; center
  value + label required; built-in legend shows label + %.
- Common to all: flat token colors only (no gradients), `tabular-nums` for values,
  uppercase 11px section label at the card top, legend outside the plot.
