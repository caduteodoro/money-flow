"use client";

import { useEffect, useRef, useState } from "react";
import type { EChartsType } from "echarts/core";

import type {
  DashboardCategoryDestinationModel,
  DashboardEvolutionChartModel,
} from "@/lib/dashboard/dashboard-types";
import {
  buildCategoryDestinationOption,
  buildFinancialEvolutionOption,
} from "@/lib/dashboard/dashboard-visualization";

type EChartsClientProps =
  | {
      kind: "evolution";
      model: DashboardEvolutionChartModel;
      links?: never;
      ariaLabel: string;
      className?: string;
    }
  | {
      kind: "categories";
      model: DashboardCategoryDestinationModel;
      links: Array<string | null>;
      ariaLabel: string;
      className?: string;
    };

type ChartStatus = "loading" | "ready" | "error";

export function EChartsClient(props: EChartsClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ChartStatus>("loading");
  const chartKind = props.kind;
  const model = props.model;
  const categoryLinks = props.kind === "categories" ? props.links : undefined;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let chart: EChartsType | null = null;
    let updateOption: (() => void) | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let resizeObserver: ResizeObserver | null = null;
    setStatus("loading");

    async function mountChart() {
      try {
        const runtime = await import("@/components/dashboard/echarts-runtime");
        if (!active || !containerRef.current) return;

        chart = runtime.init(containerRef.current, undefined, { renderer: "svg" });
        updateOption = () => {
          const option =
            chartKind === "evolution"
              ? buildFinancialEvolutionOption(model as DashboardEvolutionChartModel, !reducedMotion.matches)
              : buildCategoryDestinationOption(model as DashboardCategoryDestinationModel, !reducedMotion.matches);
          chart?.setOption(option, { notMerge: true });
        };

        updateOption();

        if (chartKind === "categories") {
          chart.on("click", (event) => {
            const dataIndex = typeof event.dataIndex === "number" ? event.dataIndex : -1;
            const href = categoryLinks?.[dataIndex];
            if (href) window.location.assign(href);
          });
        }

        resizeObserver = new ResizeObserver(() => chart?.resize());
        resizeObserver.observe(containerRef.current);
        reducedMotion.addEventListener("change", updateOption);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    }

    void mountChart();

    return () => {
      active = false;
      resizeObserver?.disconnect();
      if (updateOption) reducedMotion.removeEventListener("change", updateOption);
      chart?.dispose();
    };
  }, [categoryLinks, chartKind, model]);

  return (
    <div className={`relative min-w-0 ${props.className ?? ""}`}>
      <div
        ref={containerRef}
        aria-label={props.ariaLabel}
        className={`h-full w-full transition-opacity ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      />
      {status === "loading" ? (
        <div
          aria-label="Carregando visualização"
          className="absolute inset-0 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none"
          role="status"
        />
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 grid place-items-center rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm font-semibold text-amber-900" role="alert">
            A visualização não pôde ser carregada. Os mesmos dados estão disponíveis na tabela abaixo.
          </p>
        </div>
      ) : null}
    </div>
  );
}
