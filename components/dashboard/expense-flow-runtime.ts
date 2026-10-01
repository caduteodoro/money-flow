import { SankeyChart } from "echarts/charts";
import { TooltipComponent } from "echarts/components";
import { LabelLayout } from "echarts/features";
import { init, use as registerEChartsModules } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

registerEChartsModules([SankeyChart, TooltipComponent, LabelLayout, SVGRenderer]);
export { init };
