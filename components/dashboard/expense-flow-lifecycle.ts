import type { EChartsCoreOption, EChartsType } from "echarts/core";

export type ExpenseFlowStatus = "loading" | "ready" | "error" | "compact";
export const EXPENSE_FLOW_MEDIA = "(min-width: 768px)"; // Tailwind md.
export const EXPENSE_FLOW_MIN_WIDTH = 600;

// Isolated lifecycle so viewport transitions, import races and disposal are testable without a DOM renderer.
export function mountExpenseFlow(
  container: HTMLElement,
  surface: HTMLElement,
  option: EChartsCoreOption,
  onStatus: (status: ExpenseFlowStatus) => void,
  loadRuntime = () => import("./expense-flow-runtime"),
) {
  let active = true;
  let generation = 0;
  let pending = false;
  let failed = false;
  let chart: EChartsType | null = null;
  const media = window.matchMedia(EXPENSE_FLOW_MEDIA);
  const eligible = () => media.matches && container.clientWidth >= EXPENSE_FLOW_MIN_WIDTH;
  const release = () => { chart?.dispose(); chart = null; };
  async function update() {
    if (!active) return;
    if (!eligible()) {
      generation++;
      pending = false;
      failed = false;
      release();
      onStatus("compact");
      return;
    }
    if (chart) {
      try { chart.resize(); } catch { release(); failed = true; onStatus("error"); }
      return;
    }
    if (pending || failed) return;
    pending = true;
    const current = ++generation;
    onStatus("loading");
    try {
      const runtime = await loadRuntime();
      if (!active || generation !== current || !eligible()) return;
      chart = runtime.init(surface, undefined, { renderer: "svg", width: container.clientWidth, height: Number.parseFloat(surface.style.height) });
      chart.setOption(option, { notMerge: true });
      onStatus("ready");
    } catch {
      if (active && generation === current) {
        release();
        failed = true;
        onStatus("error");
      }
    } finally {
      if (generation === current) pending = false;
    }
  }
  const observer = new ResizeObserver(() => { void update(); });
  observer.observe(container);
  const onChange = () => { void update(); };
  media.addEventListener("change", onChange);
  void update();
  return () => {
    active = false;
    generation++;
    observer.disconnect();
    media.removeEventListener("change", onChange);
    release();
  };
}
