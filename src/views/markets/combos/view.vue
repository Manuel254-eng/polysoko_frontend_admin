<template>
  <div class="space-y-5">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Combo Details</h6>
        <div class="flex items-center gap-3">
          <router-link
            v-if="combo && combo.status === 'draft'"
            :to="{ name: 'market-combos-edit', params: { id: combo.id } }"
            class="btn btn-outline-dark btn-sm"
          >
            Edit
          </router-link>
          <router-link :to="{ name: 'market-combos' }" class="btn btn-outline-dark btn-sm">Back</router-link>
        </div>
      </header>
      <div class="p-6">
        <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
        <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
        <dl v-else class="grid md:grid-cols-3 grid-cols-1 gap-x-8 gap-y-5">
          <div class="md:col-span-2">
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Title</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ combo.title }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Status</dt>
            <dd>
              <span
                class="inline-block px-3 min-w-[90px] text-center py-1 rounded-[999px] bg-opacity-25"
                :class="combo.status === 'published' ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'"
              >
                {{ combo.status === "published" ? "Published" : "Draft" }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Code</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-mono">{{ combo.code }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Created</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(combo.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Last updated</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(combo.updated_at) }}</dd>
          </div>
        </dl>
      </div>
    </Card>

    <Card v-if="combo" noborder>
      <h6 class="mb-4">Markets ({{ combo.items.length }})</h6>
      <div v-if="combo.items.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
        No markets in this combo yet.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <th class="py-2 pr-4 font-medium">Market</th>
              <th class="py-2 pr-4 font-medium">Status</th>
              <th class="py-2 pr-4 font-medium">Published</th>
              <th class="py-2 pr-4 font-medium">Closes</th>
              <th class="py-2 font-medium">Resolves</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in combo.items"
              :key="item.id"
              class="border-b border-slate-100 dark:border-slate-700 last:border-0 text-slate-600 dark:text-slate-300"
            >
              <td class="py-3 pr-4">
                <router-link
                  :to="{ name: 'market-details', params: { id: item.market } }"
                  class="font-medium hover:underline"
                >
                  {{ item.market_title }}
                </router-link>
              </td>
              <td class="py-3 pr-4 capitalize">{{ item.market_status }}</td>
              <td class="py-3 pr-4">{{ item.market_is_published ? "Yes" : "No" }}</td>
              <td class="py-3 pr-4 whitespace-nowrap">{{ formatDate(item.market_close_at) }}</td>
              <td class="py-3 whitespace-nowrap">{{ formatDate(item.market_resolution_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Card v-if="combo" noborder>
      <h6 class="mb-4">Bets</h6>
      <div v-if="betsLoading" class="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">Loading bets…</div>
      <div v-else-if="betsError" class="text-danger-500 text-sm py-6 text-center">{{ betsError }}</div>
      <template v-else>
        <div class="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4 mb-5">
          <div v-for="tile in summaryTiles" :key="tile.label" class="rounded-[6px] p-4 bg-slate-50 dark:bg-slate-900">
            <div class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">{{ tile.label }}</div>
            <div class="text-lg font-medium" :class="tile.cls || 'text-slate-900 dark:text-white'">{{ tile.value }}</div>
            <div v-if="tile.sub" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ tile.sub }}</div>
          </div>
        </div>

        <div v-if="bets.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
          No one has bet on this combo yet.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                <th class="py-2 pr-4 font-medium">Reference</th>
                <th class="py-2 pr-4 font-medium">User</th>
                <th class="py-2 pr-4 font-medium text-right">Stake</th>
                <th class="py-2 pr-4 font-medium text-right">Odds</th>
                <th class="py-2 pr-4 font-medium text-right">Possible win</th>
                <th class="py-2 pr-4 font-medium text-right">Paid out</th>
                <th class="py-2 pr-4 font-medium">Picks</th>
                <th class="py-2 pr-4 font-medium">Status</th>
                <th class="py-2 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="bet in bets"
                :key="bet.id"
                class="border-b border-slate-100 dark:border-slate-700 last:border-0 text-slate-600 dark:text-slate-300 align-top"
              >
                <td class="py-3 pr-4 font-mono text-xs whitespace-nowrap">{{ bet.reference }}</td>
                <td class="py-3 pr-4 whitespace-nowrap">{{ bet.user_phone }}</td>
                <td class="py-3 pr-4 text-right whitespace-nowrap">{{ formatKes(bet.stake) }}</td>
                <td class="py-3 pr-4 text-right">{{ Number(bet.total_odds).toFixed(2) }}x</td>
                <td class="py-3 pr-4 text-right whitespace-nowrap">{{ formatKes(bet.potential_payout) }}</td>
                <td class="py-3 pr-4 text-right whitespace-nowrap">{{ bet.payout != null ? formatKes(bet.payout) : "—" }}</td>
                <td class="py-3 pr-4">
                  <div v-for="leg in bet.legs" :key="leg.id" class="whitespace-nowrap text-xs">
                    <span :class="legClass(leg.status)">●</span>
                    {{ leg.choice_label || (leg.side || "").toUpperCase() }} @ {{ Number(leg.odds).toFixed(2) }}x
                    <span class="text-slate-400">· {{ leg.market_title }}</span>
                  </div>
                </td>
                <td class="py-3 pr-4">
                  <span
                    class="inline-block px-2 py-[2px] rounded text-xs font-medium bg-opacity-25 capitalize"
                    :class="statusClass(bet.status)"
                  >
                    {{ bet.status }}
                  </span>
                </td>
                <td class="py-3 whitespace-nowrap">{{ formatDate(bet.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

const NOT_FOUND = { notFoundMessage: "This combo could not be found." };

const STATUS_CLASSES = {
  pending: "text-warning-500 bg-warning-500",
  won: "text-success-500 bg-success-500",
  lost: "text-danger-500 bg-danger-500",
};

const LEG_CLASSES = {
  pending: "text-warning-500",
  won: "text-success-500",
  lost: "text-danger-500",
  void: "text-slate-400",
};

export default {
  components: { Card },
  data() {
    return {
      loading: true,
      errorMessage: "",
      combo: null,
      betsLoading: true,
      betsError: "",
      bets: [],
      summary: null,
    };
  },
  computed: {
    summaryTiles() {
      const s = this.summary;
      if (!s) return [];
      return [
        {
          label: "Bets placed",
          value: s.bets_count.toLocaleString(),
          sub: `${s.pending_count} pending · ${s.won_count} won · ${s.lost_count} lost`,
        },
        { label: "Total staked", value: this.formatKes(s.total_staked) },
        {
          label: "Pending exposure",
          value: this.formatKes(s.pending_exposure),
          sub: "Paid out if every pending bet wins",
          cls: "text-warning-500",
        },
        { label: "Paid out", value: this.formatKes(s.total_paid_out), cls: "text-success-500" },
      ];
    },
  },
  async mounted() {
    const id = this.$route.params.id;
    try {
      const { data } = await api.get(`/market/combos/${id}/`);
      this.combo = data;
    } catch (err) {
      this.errorMessage = extractError(err, NOT_FOUND);
      this.loading = false;
      return;
    }
    this.loading = false;

    try {
      const { data } = await api.get(`/market/combos/${id}/bets/`);
      this.bets = data.bets;
      this.summary = data.summary;
    } catch (err) {
      this.betsError = extractError(err);
    } finally {
      this.betsLoading = false;
    }
  },
  methods: {
    formatDate(value) {
      return value ? new Date(value).toLocaleString() : "—";
    },
    formatKes(value) {
      return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    },
    statusClass(status) {
      return STATUS_CLASSES[status] || "text-slate-500 bg-slate-500";
    },
    legClass(status) {
      return LEG_CLASSES[status] || "text-slate-400";
    },
  },
};
</script>
