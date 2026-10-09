<template>
  <Card noborder>
    <div class="flex justify-between items-start mb-4 gap-3">
      <div>
        <h6 class="mb-1">Liquidity</h6>
        <span class="text-xs text-slate-400 dark:text-slate-500">Money in this market's pool over time</span>
      </div>
      <div v-if="!loading && !errorMessage && points.length" class="text-right">
        <div class="text-lg font-medium text-slate-900 dark:text-white">{{ formatKes(current) }}</div>
        <div class="text-xs" :class="change >= 0 ? 'text-success-500' : 'text-danger-500'">
          {{ change >= 0 ? "+" : "−" }}{{ formatKes(Math.abs(change)) }} vs {{ formatKes(seeded) }} seeded
        </div>
      </div>
    </div>
    <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
    <div v-else-if="points.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
      No liquidity yet — this market hasn't been seeded.
    </div>
    <apexchart v-else type="area" height="320" :options="chartOptions" :series="series" />
  </Card>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

function formatKes(value) {
  return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default {
  components: { Card },
  props: {
    marketId: { type: [String, Number], required: true },
  },
  data() {
    return {
      loading: true,
      errorMessage: "",
      current: 0,
      seeded: 0,
      points: [],
    };
  },
  computed: {
    change() {
      return Number(this.current) - Number(this.seeded);
    },
    series() {
      return [
        {
          name: "Pool balance",
          data: this.points.map((p) => ({ x: new Date(p.t).getTime(), y: Number(p.balance) })),
        },
      ];
    },
    chartOptions() {
      const points = this.points;
      return {
        chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "Inter" },
        colors: ["#d4a017"],
        stroke: { curve: "stepline", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
        markers: { size: 0, hover: { size: 4 } },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: { type: "datetime", labels: { datetimeUTC: false } },
        yaxis: {
          min: 0,
          labels: { formatter: (value) => `KES ${Math.round(value).toLocaleString()}` },
        },
        tooltip: {
          x: { format: "dd MMM yyyy, HH:mm" },
          // The ledger row behind each step: what moved the pool, and by how much.
          y: {
            formatter: (value, { dataPointIndex }) => {
              const point = points[dataPointIndex];
              if (!point || !point.type) return formatKes(value);
              const change = Number(point.change);
              return `${formatKes(value)} (${point.type_label} ${change >= 0 ? "+" : "−"}${formatKes(Math.abs(change))})`;
            },
          },
        },
        grid: { strokeDashArray: 4 },
      };
    },
  },
  async mounted() {
    try {
      const { data } = await api.get(`/market/${this.marketId}/liquidity-history/`);
      this.current = data.current;
      this.seeded = data.seeded;
      this.points = data.points;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatKes,
  },
};
</script>
