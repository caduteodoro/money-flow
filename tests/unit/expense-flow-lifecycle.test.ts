import { afterEach, describe, expect, it, vi } from "vitest";
import { mountExpenseFlow } from "@/components/dashboard/expense-flow-lifecycle";

afterEach(() => vi.unstubAllGlobals());
function environment(width = 800, wide = true) {
  const media = { matches: wide, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  const observer = { observe: vi.fn(), disconnect: vi.fn() };
  let onResize: () => void = () => {};
  vi.stubGlobal("window", { matchMedia: vi.fn(() => media) });
  vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { onResize = callback; } observe = observer.observe; disconnect = observer.disconnect; });
  const container = { clientWidth: width };
  const surface = { style: { height: "400px" } };
  const chart = { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
  const init = vi.fn(() => chart);
  const load = vi.fn(async () => ({ init }));
  const status = vi.fn();
  const mount = (loader = load) => mountExpenseFlow(container as HTMLElement, surface as HTMLElement, {}, status, loader as unknown as Parameters<typeof mountExpenseFlow>[4]);
  return { media, observer, container, chart, init, load, status, mount, resize: () => onResize() };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

describe("expense flow responsive lifecycle", () => {
  it("does not import or initialize ECharts in portrait mobile", async () => {
    const env = environment(390, false); const cleanup = env.mount(); await flush();
    expect(env.load).not.toHaveBeenCalled(); expect(env.init).not.toHaveBeenCalled();
    expect(env.status).toHaveBeenLastCalledWith("compact"); cleanup();
    expect(env.observer.disconnect).toHaveBeenCalledOnce();
    expect(env.media.removeEventListener).toHaveBeenCalledWith("change", env.media.addEventListener.mock.calls[0][1]);
  });
  it("also respects available container width on narrow desktop and zoom", async () => {
    const env = environment(550, true); const cleanup = env.mount(); await flush();
    expect(env.load).not.toHaveBeenCalled(); cleanup();
  });
  it("mounts once, resizes, releases on compact transition and remounts without accumulating listeners", async () => {
    const env = environment(); const cleanup = env.mount(); await flush();
    expect(env.init).toHaveBeenCalledOnce(); expect(env.chart.setOption).toHaveBeenCalledOnce();
    expect(env.status).toHaveBeenLastCalledWith("ready");
    env.resize(); await flush(); expect(env.chart.resize).toHaveBeenCalledOnce();
    env.media.matches = false; env.resize(); await flush(); expect(env.chart.dispose).toHaveBeenCalledOnce();
    env.media.matches = true; env.resize(); await flush(); expect(env.init).toHaveBeenCalledTimes(2);
    cleanup(); expect(env.chart.dispose).toHaveBeenCalledTimes(2);
    expect(env.media.addEventListener).toHaveBeenCalledOnce(); expect(env.media.removeEventListener).toHaveBeenCalledOnce();
    expect(env.observer.disconnect).toHaveBeenCalledOnce();
  });
  it("does not initialize after unmount while the runtime import is pending", async () => {
    const env = environment(); let resolve!: (value: { init: typeof env.init }) => void;
    const loader = vi.fn(() => new Promise<{ init: typeof env.init }>(done => { resolve = done; }));
    const cleanup = env.mount(loader); cleanup(); resolve({ init: env.init }); await flush();
    expect(env.init).not.toHaveBeenCalled(); expect(env.status).not.toHaveBeenCalledWith("ready");
  });
  it("ignores a stale import after a mobile transition", async () => {
    const env = environment(); let resolve!: (value: { init: typeof env.init }) => void;
    const loader = vi.fn(() => new Promise<{ init: typeof env.init }>(done => { resolve = done; }));
    const cleanup = env.mount(loader); env.media.matches = false; env.resize(); resolve({ init: env.init }); await flush();
    expect(env.init).not.toHaveBeenCalled(); cleanup();
  });
  it("isolates renderer failure, disposes partial initialization and avoids retry loops", async () => {
    const env = environment(); env.chart.setOption.mockImplementation(() => { throw new Error("Synthetic rendering failure"); });
    const cleanup = env.mount(); await flush();
    expect(env.status).toHaveBeenLastCalledWith("error"); expect(env.chart.dispose).toHaveBeenCalledOnce();
    env.resize(); await flush(); expect(env.init).toHaveBeenCalledOnce(); cleanup();
  });
  it("handles runtime loading failure without logging a payload", async () => {
    const env = environment(); env.load.mockRejectedValue(new Error("Synthetic load failure"));
    const cleanup = env.mount(); await flush(); expect(env.status).toHaveBeenLastCalledWith("error");
    expect(env.init).not.toHaveBeenCalled(); cleanup();
  });
  it("isolates resize failures and releases the instance", async () => {
    const env = environment(); const cleanup = env.mount(); await flush();
    env.chart.resize.mockImplementation(() => { throw new Error("Synthetic resize failure"); });
    env.resize(); await flush(); expect(env.status).toHaveBeenLastCalledWith("error");
    expect(env.chart.dispose).toHaveBeenCalledOnce(); cleanup();
  });
});
