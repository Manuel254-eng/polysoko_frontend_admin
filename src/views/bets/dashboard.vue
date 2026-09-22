<template>
  <div>
    <Card bodyClass="p-4" noborder>
      <div class="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
        <div class="py-[18px] px-4 rounded-[6px]" v-for="(item, i) in cards" :class="item.bg" :key="i">
          <div class="flex items-center space-x-4 rtl:space-x-reverse">
            <div
              class="flex-none h-10 w-10 rounded-full bg-white flex items-center justify-center text-lg"
              :class="item.iconClass"
            >
              <Icon :icon="item.icon" />
            </div>
            <div class="flex-1">
              <div class="text-slate-800 dark:text-slate-300 text-sm mb-1 font-medium">{{ item.title }}</div>
              <div class="text-slate-900 dark:text-white text-lg font-medium">
                {{ loading ? "…" : `KES ${item.value.toLocaleString()}` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card noborder class="mt-5">
      <h5 class="mb-6">Bets Dashboard</h5>
      <div class="legend-ring">
        <apexchart
          type="bar"
          height="400"
          :options="dailyChart.chartOptions"
          :series="dailyChart.series"
        />
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Icon from "@/components/Icon";
import api from "@/lib/api";
import { subscribeToAdminBetsSummary } from "@/lib/adminSocket";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Avoids `new Date("2026-09-16")`, which JS parses as UTC midnight and can
// render as the previous day in negative-offset timezones.
function formatDay(isoDate) {
  const [, month, day] = isoDate.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}`;
}

export default {
  components: { Card, Icon },
  data() {
    return {
      loading: true,
      summary: {
        total_placed: 0,
        total_open: 0,
        total_wins: 0,
        total_losses: 0,
      },
      daily: {
        days: [],
        placed: [],
        wins: [],
        losses: [],
      },
      unsubscribeSummary: null,
    };
  },
  computed: {
    dailyChart() {
      const isDark = this.$store.themeSettingsStore.isDark;
      const labelColor = isDark ? "#CBD5E1" : "#475569";
      return {
        series: [
          { name: "Placed", data: this.daily.placed.map(Number) },
          { name: "Wins", data: this.daily.wins.map(Number) },
          { name: "Losses", data: this.daily.losses.map(Number) },
        ],
        chartOptions: {
          chart: {
            toolbar: { show: false },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              endingShape: "rounded",
              columnWidth: "45%",
            },
          },
          legend: {
            show: true,
            position: "top",
            horizontalAlign: "right",
            fontSize: "12px",
            fontFamily: "Inter",
            offsetY: -30,
            markers: {
              width: 8,
              height: 8,
              offsetY: -1,
              offsetX: -5,
              radius: 12,
            },
            labels: { colors: labelColor },
            itemMargin: { horizontal: 18, vertical: 0 },
          },
          title: {
            text: "Bets Trend (Last 7 Days)",
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
          stroke: {
            show: true,
            width: 2,
            colors: ["transparent"],
          },
          yaxis: {
            opposite: this.$store.themeSettingsStore.direction ? true : false,
            labels: {
              style: { colors: labelColor, fontFamily: "Inter" },
            },
          },
          xaxis: {
            categories: this.daily.days.map(formatDay),
            labels: {
              style: { colors: labelColor, fontFamily: "Inter" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          fill: { opacity: 1 },
          tooltip: {
            y: {
              formatter: (val) => `KES ${Number(val).toLocaleString()}`,
            },
          },
          colors: ["#4669FA", "#50C793", "#F1595C"],
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
                legend: {
                  position: "bottom",
                  offsetY: 8,
                  horizontalAlign: "center",
                },
                plotOptions: {
                  bar: { columnWidth: "80%" },
                },
              },
            },
          ],
        },
      };
    },
    cards() {
      return [
        {
          title: "Total placed in bets",
          value: Number(this.summary.total_placed),
          icon: "heroicons-outline:banknotes",
          bg: "bg-[#E5F9FF] dark:bg-slate-900",
          iconClass: "text-sky-500",
        },
        {
          title: "Total in open positions",
          value: Number(this.summary.total_open),
          icon: "heroicons-outline:clock",
          bg: "bg-[#FFEDE5] dark:bg-slate-900",
          iconClass: "text-warning-500",
        },
        {
          title: "Total user wins",
          value: Number(this.summary.total_wins),
          icon: "heroicons-outline:check-circle",
          bg: "bg-[#E5FFE9] dark:bg-slate-900",
          iconClass: "text-success-500",
        },
        {
          title: "Total user losses",
          value: Number(this.summary.total_losses),
          icon: "heroicons-outline:x-circle",
          bg: "bg-[#FFE5E5] dark:bg-slate-900",
          iconClass: "text-danger-500",
        },
      ];
    },
  },
  async mounted() {
    await Promise.all([this.loadSummary(), this.loadDaily()]);
    // Refetch whenever a bet is placed or a market settles anywhere on the
    // platform, instead of only ever seeing fresh numbers on a manual reload.
    this.unsubscribeSummary = subscribeToAdminBetsSummary(() => {
      this.loadSummary();
      this.loadDaily();
    });
  },
  beforeUnmount() {
    if (this.unsubscribeSummary) this.unsubscribeSummary();
  },
  methods: {
    async loadSummary() {
      this.loading = true;
      try {
        const { data } = await api.get("/market/admin/bets-summary/");
        this.summary = data;
      } catch {
        // leave the zeroed-out summary in place
      } finally {
        this.loading = false;
      }
    },
    async loadDaily() {
      try {
        const { data } = await api.get("/market/admin/bets-summary/daily/");
        this.daily = data;
      } catch {
        // leave the last-known daily series in place
      }
    },
  },
};
</script>
