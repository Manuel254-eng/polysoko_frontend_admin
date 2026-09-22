<template>
  <div>
    <Breadcrumb />
    <div class="grid grid-cols-12 gap-5 mb-5">
      <div class="2xl:col-span-3 lg:col-span-4 col-span-12">
        <div
          class="bg-no-repeat bg-cover bg-center p-4 rounded-[6px] relative"
          :style="{
            backgroundImage:
              'url('+ widget1 +')',
          }"
        >
          <div class="max-w-[169px]">
            <div class="text-xl font-medium text-slate-900 mb-2">
              Date
            </div>
            <p class="text-sm text-slate-800">{{ currentDate }}</p>
            <p class="text-sm text-slate-800 font-medium mt-1">{{ currentTime }}</p>
          </div>
          <div
            class="absolute top-1/2 -translate-y-1/2 ltr:right-6 rtl:left-6 mt-2 h-12 w-12 bg-white text-slate-900 rounded-full text-xs font-medium flex flex-col items-center justify-center"
          >
            Now
          </div>
        </div>
      </div>
      <div class="2xl:col-span-9 lg:col-span-8 col-span-12">
        <Card bodyClass="p-4">
          <div class="grid md:grid-cols-3 col-span-1 gap-4">
            <div
              class="py-[18px] px-4 rounded-[6px]"
              v-for="(item, i) in statistics"
              :class="item.bg"
              :key="i"
            >
              <div class="flex items-center space-x-6 rtl:space-x-reverse">
                <div class="flex-none">
                  <apexchart
                    v-if="item.chart"
                    type="area"
                    height="48"
                    width="48"
                    :options="item.chart.chartOptions"
                    :series="item.chart.series"
                  />
                  <div
                    v-else
                    class="h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg"
                    :class="item.iconClass"
                  >
                    <Icon :icon="item.icon" />
                  </div>
                </div>
                <div class="flex-1">
                  <div
                    class="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium"
                  >
                    {{ item.title }}
                  </div>
                  <div
                    class="text-slate-900 dark:text-white text-lg font-medium"
                  >
                    {{ loading ? "…" : item.count }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
    <div class="grid grid-cols-12 gap-5">
      <div class="lg:col-span-8 col-span-12">
        <Card>
          <div class="legend-ring">
            <apexchart
              type="bar"
              height="400"
              :options="revenueReportChart.chartOptions"
              :series="revenueReportChart.series"
            />
          </div>
        </Card>
      </div>
      <div class="lg:col-span-4 col-span-12">
        <Card title="Markets by status">
          <template #header>
            <DropEvent />
          </template>
          <apexchart
            type="radialBar"
            :height="window.width > 768 ? 350 : 250"
            :options="marketStatusChart.chartOptions"
            :series="marketStatusChart.series"
          />
        </Card>
      </div>
      <div class="lg:col-span-8 col-span-12">
        <Card title="Top markets by volume" noborder>
          <template #header>
            <DropEvent />
          </template>
          <div class="-mx-6 -mb-6 overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-slate-100 dark:border-slate-700">
                  <th class="text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-6 py-3">Market</th>
                  <th class="text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-6 py-3">Category</th>
                  <th class="text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-6 py-3">Trades</th>
                  <th class="text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-6 py-3">Volume</th>
                  <th class="text-start text-xs font-medium text-slate-500 dark:text-slate-400 uppercase px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="market in topMarkets"
                  :key="market.id"
                  class="border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                >
                  <td class="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-[220px] truncate">{{ market.title }}</td>
                  <td class="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{{ market.category }}</td>
                  <td class="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{{ market.trades }}</td>
                  <td class="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">KES {{ Number(market.volume).toLocaleString() }}</td>
                  <td class="px-6 py-3 text-sm">
                    <span
                      class="px-2 py-1 rounded text-xs capitalize"
                      :class="statusBadgeClass(market.status)"
                    >{{ market.status }}</span>
                  </td>
                </tr>
                <tr v-if="!loading && topMarkets.length === 0">
                  <td colspan="5" class="px-6 py-6 text-sm text-center text-slate-400">No trades yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <div class="lg:col-span-4 col-span-12">
        <Card title="Recent bets">
          <template #header>
            <DropEvent />
          </template>
          <ul class="list-item space-y-3 h-full overflow-x-auto">
            <li
              class="flex items-center space-x-3 rtl:space-x-reverse border-b border-slate-100 dark:border-slate-700 last:border-b-0 pb-3 last:pb-0"
              v-for="(item, i) in recentBets"
              :key="i"
            >
              <div>
                <div
                  class="w-8 h-8 rounded-[100%] bg-primary-500 text-white flex items-center justify-center text-sm font-medium flex-none"
                >
                  {{ (item.user || "?").charAt(0).toUpperCase() }}
                </div>
              </div>
              <div
                class="text-start overflow-hidden text-ellipsis whitespace-nowrap max-w-[63%]"
              >
                <div
                  class="text-sm text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {{ item.user }} placed KES {{ Number(item.amount).toLocaleString() }} on {{ item.market_title }}
                </div>
              </div>
              <div class="flex-1 ltr:text-right rtl:text-left">
                <div
                  class="text-sm font-light text-slate-400 dark:text-slate-400"
                >
                  {{ timeAgo(item.created_at) }}
                </div>
              </div>
            </li>
            <li v-if="!loading && recentBets.length === 0" class="text-sm text-slate-400 text-center py-6">
              No bets placed yet.
            </li>
          </ul>
        </Card>
      </div>
      <div class="lg:col-span-8 col-span-12">
        <Card title="Volume by category">
          <div class="md:flex items-center">
            <div class="flex-none md:w-[220px]">
              <h4
                class="text-slate-600 dark:text-slate-200 text-sm font-normal mb-[6px]"
              >
                Total revenue
              </h4>
              <div class="tetx-lg font-medium mb-[6px] dark:text-white text-slate-900">
                KES {{ loading ? "…" : Number(kpis.total_revenue || 0).toLocaleString() }}
              </div>
              <div class="text-xs font-light dark:text-slate-200">
                <span :class="revenueGrowthClass">{{ revenueGrowthLabel }}</span> from last week
              </div>
              <ul
                class="bg-slate-50 dark:bg-slate-900 rounded p-4 min-w-[184px] space-y-3 mt-4"
              >
                <li
                  v-for="(item, i) in categoryVolume"
                  :key="i"
                  class="flex justify-between text-xs text-slate-600 dark:text-slate-300"
                >
                  <span class="flex space-x-2 rtl:space-x-reverse items-center">
                    <span
                      class="inline-flex h-[6px] w-[6px] ring-opacity-25 rounded-full ring-4"
                      :style="{ backgroundColor: categoryColor(i), boxShadow: `0 0 0 4px ${categoryColor(i)}40` }"
                    ></span>
                    <span>{{ item.category }}</span></span
                  >
                  <span>KES {{ Number(item.volume).toLocaleString() }}</span>
                </li>
                <li v-if="!loading && categoryVolume.length === 0" class="text-slate-400">No trades yet.</li>
              </ul>
            </div>
            <div class="flex-1">
              <apexchart
                type="donut"
                height="260"
                :options="categoryDonutChart.chartOptions"
                :series="categoryDonutChart.series"
              />
            </div>
          </div>
        </Card>
      </div>
      <div class="lg:col-span-4 col-span-12">
        <Card title="Reserve health">
          <apexchart
            type="radialBar"
            height="300"
            :options="winRateChart.chartOptions"
            :series="winRateChart.series"
          />
          <div
            class="bg-slate-50 dark:bg-slate-900 rounded p-4 mt-8 flex justify-between flex-wrap"
          >
            <div class="space-y-1">
              <h4 class="text-slate-600 dark:text-slate-200 text-xs font-normal">
                Reserve balance
              </h4>
              <div class="tetx-sm font-medium text-slate-900 dark:text-white">
                KES {{ loading ? "…" : Number(reserve.reserve_balance || 0).toLocaleString() }}
              </div>
            </div>
            <div class="space-y-1">
              <h4 class="text-slate-600 dark:text-slate-200 text-xs font-normal">
                Resolved markets
              </h4>
              <div class="tetx-sm font-medium text-slate-900 dark:text-white">
                {{ loading ? "…" : reserve.resolved_markets_count || 0 }}
              </div>
            </div>
            <div class="space-y-1">
              <h4 class="text-slate-600 dark:text-slate-200 text-xs font-normal">
                Volume this month
              </h4>
              <div class="tetx-sm font-medium text-slate-900 dark:text-white">
                KES {{ loading ? "…" : Number(reserve.volume_this_month || 0).toLocaleString() }}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import api from "@/lib/api";
import DropEvent from "./Analytics-Component/DropEvent";
import Breadcrumb from "./Analytics-Component/Breadcrumbs";
import window from "@/mixins/window";

import widget1 from "@/assets/images/all-img/widget-bg-1.png"

const CATEGORY_COLORS = ["#4669FA", "#FA916B", "#50C793", "#0CE7FA", "#F1595C", "#A3A1FB"];
const STATUS_COLORS = ["#4669FA", "#FA916B", "#0CE7FA", "#50C793", "#F1595C"];
const STATUS_BADGE_CLASSES = {
  open: "bg-[#E5FFE9] text-success-600",
  closed: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  resolving: "bg-[#FFEDE5] text-warning-600",
  resolved: "bg-[#E5F9FF] text-sky-600",
  cancelled: "bg-[#FFE5E5] text-danger-600",
};

function sparkline(data, color) {
  return {
    series: [{ data }],
    chartOptions: {
      chart: {
        toolbar: { autoSelected: "pan", show: false },
        offsetX: 0,
        offsetY: 0,
        zoom: { enabled: false },
        sparkline: { enabled: true },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      colors: [color],
      tooltip: { theme: "light" },
      grid: { show: false, padding: { left: 0, right: 0 } },
      yaxis: { show: false },
      fill: { type: "solid", opacity: [0.1] },
      legend: { show: false },
      xaxis: { show: false, labels: { show: false }, axisBorder: { show: false } },
    },
  };
}

// Avoids Date-string TZ parsing pitfalls for the handful of relative-time
// buckets this needs — no need to pull in a date library for that.
function timeAgo(isoString) {
  const seconds = Math.max(0, (Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default {
  mixins: [window],
  components: {
    Card,
    Icon,
    DropEvent,
    Breadcrumb,
  },
  data() {
    return {
      widget1,
      loading: true,
      currentDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      currentTime: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
      clockTimer: null,
      kpis: {
        total_revenue: 0,
        total_bets: 0,
        revenue_growth_pct: "0",
        revenue_sparkline: [],
        bets_sparkline: [],
      },
      monthlyRevenue: { months: [], revenue: [], loss: [], net: [] },
      marketStatusBreakdown: { labels: [], counts: [] },
      topMarkets: [],
      recentBets: [],
      categoryVolume: [],
      reserve: {
        reserve_balance: 0,
        win_rate_pct: "0",
        resolved_markets_count: 0,
        volume_this_month: 0,
      },
    };
  },
  computed: {
    statistics() {
      return [
        {
          title: "Total revenue",
          count: `KES ${Number(this.kpis.total_revenue || 0).toLocaleString()}`,
          chart: sparkline(this.kpis.revenue_sparkline.map(Number), "#00EBFF"),
          bg: "bg-[#E5F9FF] dark:bg-slate-900",
        },
        {
          title: "Bets placed",
          count: Number(this.kpis.total_bets || 0).toLocaleString(),
          chart: sparkline(this.kpis.bets_sparkline.map(Number), "#FA916B"),
          bg: "bg-[#FFEDE5] dark:bg-slate-900",
        },
        {
          title: "Growth vs last week",
          count: this.revenueGrowthLabel,
          icon: Number(this.kpis.revenue_growth_pct) >= 0 ? "heroicons:arrow-trending-up" : "heroicons:arrow-trending-down",
          iconClass: Number(this.kpis.revenue_growth_pct) >= 0 ? "text-success-500" : "text-danger-500",
          bg: "bg-[#EAE5FF] dark:bg-slate-900",
        },
      ];
    },
    revenueGrowthLabel() {
      const pct = Number(this.kpis.revenue_growth_pct || 0);
      return `${pct >= 0 ? "+" : ""}${pct}%`;
    },
    revenueGrowthClass() {
      return Number(this.kpis.revenue_growth_pct) >= 0 ? "text-primary-500" : "text-danger-500";
    },
    revenueReportChart() {
      const isDark = this.$store.themeSettingsStore.isDark;
      const labelColor = isDark ? "#CBD5E1" : "#475569";
      return {
        series: [
          { name: "Revenue", data: this.monthlyRevenue.revenue.map(Number) },
          { name: "Loss", data: this.monthlyRevenue.loss.map(Number) },
          { name: "Net", data: this.monthlyRevenue.net.map(Number) },
        ],
        chartOptions: {
          chart: { toolbar: { show: false } },
          plotOptions: {
            bar: { horizontal: false, endingShape: "rounded", columnWidth: "45%" },
          },
          legend: {
            show: true,
            position: "top",
            horizontalAlign: "right",
            fontSize: "12px",
            fontFamily: "Inter",
            offsetY: -30,
            markers: { width: 8, height: 8, offsetY: -1, offsetX: -5, radius: 12 },
            labels: { colors: labelColor },
            itemMargin: { horizontal: 18, vertical: 0 },
          },
          title: {
            text: "Revenue Report",
            align: "left",
            offsetX: this.$store.themeSettingsStore.direction ? "0%" : 0,
            offsetY: 13,
            floating: false,
            style: {
              fontSize: "20px",
              fontWeight: "500",
              fontFamily: "Inter",
              color: isDark ? "#fff" : "#0f172a",
            },
          },
          dataLabels: { enabled: false },
          stroke: { show: true, width: 2, colors: ["transparent"] },
          yaxis: {
            opposite: this.$store.themeSettingsStore.direction ? true : false,
            labels: { style: { colors: labelColor, fontFamily: "Inter" } },
          },
          xaxis: {
            categories: this.monthlyRevenue.months,
            labels: { style: { colors: labelColor, fontFamily: "Inter" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          fill: { opacity: 1 },
          tooltip: {
            y: { formatter: (val) => `KES ${Number(val).toLocaleString()}` },
          },
          colors: ["#4669FA", "#F1595C", "#50C793"],
          grid: {
            show: true,
            borderColor: isDark ? "#334155" : "#E2E8F0",
            strokeDashArray: 10,
            position: "back",
          },
          responsive: [
            {
              breakpoint: 600,
              options: {
                legend: { position: "bottom", offsetY: 8, horizontalAlign: "center" },
                plotOptions: { bar: { columnWidth: "80%" } },
              },
            },
          ],
        },
      };
    },
    marketStatusChart() {
      const isDark = this.$store.themeSettingsStore.isDark;
      const textColor = isDark ? "#E2E8F0" : "#475569";
      const total = this.marketStatusBreakdown.counts.reduce((sum, n) => sum + n, 0);
      return {
        series: this.marketStatusBreakdown.counts,
        chartOptions: {
          chart: { toolbar: { show: false } },
          plotOptions: {
            radialBar: {
              dataLabels: {
                name: { fontSize: "14px", color: textColor },
                value: { fontSize: "16px", color: textColor },
                total: {
                  show: true,
                  label: "Total",
                  color: textColor,
                  formatter: () => total,
                },
              },
            },
          },
          labels: this.marketStatusBreakdown.labels,
          colors: STATUS_COLORS,
        },
      };
    },
    winRateChart() {
      const isDark = this.$store.themeSettingsStore.isDark;
      const textColor = isDark ? "#E2E8F0" : "#475569";
      return {
        series: [Number(this.reserve.win_rate_pct || 0)],
        chartOptions: {
          chart: { toolbar: { show: false } },
          plotOptions: {
            radialBar: {
              startAngle: -135,
              endAngle: 135,
              dataLabels: {
                name: { fontSize: "16px", color: textColor, offsetY: -10 },
                value: { fontSize: "22px", color: textColor, formatter: (val) => `${val}%` },
              },
            },
          },
          fill: {
            type: "gradient",
            gradient: {
              shade: "dark",
              shadeIntensity: 0.15,
              inverseColors: false,
              opacityFrom: 1,
              opacityTo: 1,
              stops: [0, 50, 65, 91],
            },
          },
          stroke: { dashArray: 4 },
          labels: ["Win rate"],
          colors: ["#4669FA"],
        },
      };
    },
    categoryDonutChart() {
      const isDark = this.$store.themeSettingsStore.isDark;
      return {
        series: this.categoryVolume.map((item) => Number(item.volume)),
        chartOptions: {
          chart: { toolbar: { show: false } },
          labels: this.categoryVolume.map((item) => item.category),
          colors: CATEGORY_COLORS,
          legend: { show: false },
          dataLabels: { enabled: false },
          tooltip: {
            theme: isDark ? "dark" : "light",
            y: { formatter: (val) => `KES ${Number(val).toLocaleString()}` },
          },
        },
      };
    },
  },
  async mounted() {
    this.clockTimer = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }, 1000);
    await this.loadOverview();
  },
  beforeUnmount() {
    clearInterval(this.clockTimer);
  },
  methods: {
    timeAgo,
    categoryColor(index) {
      return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    },
    statusBadgeClass(status) {
      return STATUS_BADGE_CLASSES[status] || "bg-slate-100 text-slate-600";
    },
    async loadOverview() {
      this.loading = true;
      try {
        const { data } = await api.get("/market/admin/dashboard-overview/");
        this.kpis = data.kpis;
        this.monthlyRevenue = data.monthly_revenue;
        this.marketStatusBreakdown = data.market_status_breakdown;
        this.topMarkets = data.top_markets;
        this.recentBets = data.recent_bets;
        this.categoryVolume = data.category_volume;
        this.reserve = data.reserve;
      } catch {
        // leave the zeroed-out defaults in place
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
<style lang=""></style>
