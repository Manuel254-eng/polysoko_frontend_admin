<template>
  <Card noborder>
    <div class="flex justify-between items-center mb-4">
      <h6 class="mb-0">Price history</h6>
      <span class="text-xs text-slate-400 dark:text-slate-500">Implied probability of each side</span>
    </div>
    <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
    <div v-else-if="series.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
      No prices yet — this market hasn't been seeded with liquidity.
    </div>
    <apexchart v-else type="line" height="320" :options="chartOptions" :series="series" />
  </Card>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

// Yes in green, No in red; custom choices take the rest in order.
const BINARY_COLORS = { yes: "#16a34a", no: "#ef4444" };
const CHOICE_COLORS = ["#d4a017", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#64748b"];

export default {
  components: { Card },
  props: {
    marketId: { type: [String, Number], required: true },
  },
  data() {
    return {
      loading: true,
      errorMessage: "",
      raw: [],
    };
  },
  computed: {
    // Each side as % over time. Steps, not curves — a price holds until the
    // next trade moves it.
    series() {
      return this.raw.map((s) => ({
        name: s.label,
        data: s.points.map((p) => ({ x: new Date(p.t).getTime(), y: Math.round(Number(p.price) * 10000) / 100 })),
      }));
    },
    colors() {
      return this.raw.map((s, i) => BINARY_COLORS[s.key] || CHOICE_COLORS[i % CHOICE_COLORS.length]);
    },
    chartOptions() {
      return {
        chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "Inter" },
        colors: this.colors,
        stroke: { curve: "stepline", width: 2 },
        markers: { size: 0, hover: { size: 4 } },
        dataLabels: { enabled: false },
        legend: { position: "top", horizontalAlign: "right", fontSize: "12px" },
        xaxis: { type: "datetime", labels: { datetimeUTC: false } },
        yaxis: {
          min: 0,
          max: 100,
          tickAmount: 5,
          labels: { formatter: (value) => `${Math.round(value)}%` },
        },
        tooltip: {
          x: { format: "dd MMM yyyy, HH:mm" },
          y: { formatter: (value) => `${value.toFixed(2)}%` },
        },
        grid: { strokeDashArray: 4 },
      };
    },
  },
  async mounted() {
    try {
      const { data } = await api.get(`/market/${this.marketId}/price-history/`);
      this.raw = data.series;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
};
</script>
