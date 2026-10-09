<template>
  <Card noborder>
    <div class="flex justify-between items-start mb-4 gap-3">
      <div>
        <h6 class="mb-1">Volume by {{ isCustom ? "choice" : "side" }}</h6>
        <span class="text-xs text-slate-400 dark:text-slate-500">Money staked on each outcome</span>
      </div>
      <div v-if="!loading && !errorMessage && total > 0" class="text-right">
        <div class="text-lg font-medium text-slate-900 dark:text-white">{{ formatKes(total) }}</div>
        <div class="text-xs text-slate-400 dark:text-slate-500">total traded</div>
      </div>
    </div>
    <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
    <div v-else-if="total === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
      No trades yet — nothing has been staked on this market.
    </div>
    <div v-else class="flex md:flex-row flex-col items-center gap-6">
      <div class="flex-1 w-full">
        <apexchart type="pie" height="280" :options="chartOptions" :series="series" />
      </div>
      <ul class="flex-1 w-full space-y-4 text-sm">
        <li v-for="(s, i) in slices" :key="s.key" class="flex justify-between items-start gap-3">
          <span class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span class="inline-flex h-[10px] w-[10px] rounded-full flex-none" :style="{ backgroundColor: colors[i] }"></span>
            {{ s.label }}
          </span>
          <span class="text-right">
            <span class="block font-medium text-slate-900 dark:text-white">
              {{ formatKes(s.volume) }} <span class="text-slate-400 font-normal">· {{ formatPercent(s.volume) }}</span>
            </span>
            <span class="block text-xs text-slate-400 dark:text-slate-500">
              {{ s.trades.toLocaleString() }} {{ s.trades === 1 ? "trade" : "trades" }}
            </span>
          </span>
        </li>
      </ul>
    </div>
  </Card>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

// Same palette as PriceHistoryChart, so a side/choice is one colour across the page.
const BINARY_COLORS = { yes: "#16a34a", no: "#ef4444" };
const CHOICE_COLORS = ["#d4a017", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#64748b"];

function formatKes(value) {
  return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default {
  components: { Card },
  props: {
    marketId: { type: [String, Number], required: true },
    isCustom: { type: Boolean, default: false },
  },
  data() {
    return {
      loading: true,
      errorMessage: "",
      total: 0,
      slices: [],
    };
  },
  computed: {
    series() {
      return this.slices.map((s) => Number(s.volume));
    },
    colors() {
      return this.slices.map((s, i) => BINARY_COLORS[s.key] || CHOICE_COLORS[i % CHOICE_COLORS.length]);
    },
    chartOptions() {
      const isDark = this.$store.themeSettingsStore.isDark;
      return {
        chart: { toolbar: { show: false }, fontFamily: "Inter" },
        labels: this.slices.map((s) => s.label),
        colors: this.colors,
        legend: { show: false },
        stroke: { colors: [isDark ? "#1e293b" : "#fff"] },
        dataLabels: {
          enabled: true,
          formatter: (percent) => `${percent.toFixed(1)}%`,
          dropShadow: { enabled: false },
        },
        tooltip: {
          theme: isDark ? "dark" : "light",
          y: { formatter: (value) => formatKes(value) },
        },
      };
    },
  },
  async mounted() {
    try {
      const { data } = await api.get(`/market/${this.marketId}/volume-breakdown/`);
      this.total = Number(data.total);
      this.slices = data.slices;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatKes,
    formatPercent(volume) {
      return this.total ? `${((Number(volume) / this.total) * 100).toFixed(1)}%` : "0%";
    },
  },
};
</script>
