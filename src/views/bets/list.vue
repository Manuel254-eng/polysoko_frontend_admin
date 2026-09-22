<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Bets</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
        </div>
      </div>

      <div class="tabs mb-5 flex gap-2">
        <button
          type="button"
          class="btn btn-sm"
          :class="activeTab === 'binary' ? 'btn-dark' : 'btn-outline-dark'"
          @click="switchTab('binary')"
        >
          Binary markets
        </button>
        <button
          type="button"
          class="btn btn-sm"
          :class="activeTab === 'custom' ? 'btn-dark' : 'btn-outline-dark'"
          @click="switchTab('custom')"
        >
          Custom markets
        </button>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
      </div>
      <template v-else>
        <div v-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          No bets placed yet.
        </div>
        <template v-else>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            styleClass="vgt-table bordered centered"
            :pagination-options="{ enabled: false }"
            :search-options="{ enabled: true, externalQuery: searchTerm }"
          >
            <template v-slot:table-row="props">
              <router-link
                v-if="props.column.field === 'market_title'"
                :to="{ name: 'market-details', params: { id: props.row.market_id } }"
                class="text-slate-600 dark:text-slate-300 font-medium hover:underline"
              >
                {{ props.row.market_title }}
              </router-link>
              <span v-else-if="props.column.field === 'side'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[60px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 uppercase"
                  :class="props.row.side === 'yes' ? 'text-success-500 bg-success-500' : 'text-danger-500 bg-danger-500'"
                >
                  {{ props.row.side }}
                </span>
              </span>
              <span v-else-if="props.column.field === 'result'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[80px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 capitalize"
                  :class="resultBadgeClass(props.row.result)"
                >
                  {{ props.row.result || "Pending" }}
                </span>
              </span>
              <span v-else>{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </vue-good-table>

          <div class="py-4 px-3" v-if="count > perPage">
            <Pagination :total="count" :current="page" :per-page="perPage" :pageRange="2" @page-changed="loadPage" />
          </div>
        </template>
      </template>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import InputGroup from "@/components/InputGroup";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

const BINARY_COLUMNS = [
  { label: "User", field: "phone_number" },
  { label: "Market", field: "market_title" },
  { label: "Side", field: "side" },
  { label: "Shares", field: "shares" },
  { label: "Price / share", field: "price_per_share" },
  { label: "Odds", field: "odds" },
  { label: "Amount (KES)", field: "amount_kes" },
  { label: "Placed at", field: "created_at" },
  { label: "Status", field: "market_status" },
  { label: "Result", field: "result", sortable: false },
];

const CUSTOM_COLUMNS = [
  { label: "User", field: "phone_number" },
  { label: "Market", field: "market_title" },
  { label: "Choice", field: "choice_label" },
  { label: "Shares", field: "shares" },
  { label: "Price / share", field: "price_per_share" },
  { label: "Amount (KES)", field: "amount_kes" },
  { label: "Placed at", field: "created_at" },
  { label: "Status", field: "market_status" },
  { label: "Result", field: "result", sortable: false },
];

const RESULT_BADGE_CLASS = {
  win: "text-success-500 bg-success-500",
  loss: "text-danger-500 bg-danger-500",
  cancelled: "text-warning-500 bg-warning-500",
};

export default {
  components: { Card, InputGroup, Pagination },
  data() {
    return {
      loading: true,
      errorMessage: "",
      activeTab: "binary",
      trades: [],
      searchTerm: "",
      count: 0,
      page: 1,
      // matches MarketPagination.page_size on the backend
      perPage: 20,
    };
  },
  computed: {
    columns() {
      return this.activeTab === "binary" ? BINARY_COLUMNS : CUSTOM_COLUMNS;
    },
    rows() {
      return this.trades.map((trade) => ({
        ...trade,
        price_per_share: Number(trade.price_per_share).toFixed(this.activeTab === "binary" ? 2 : 4),
        amount_kes: Number(trade.amount_kes).toLocaleString(),
        odds: trade.odds != null ? `${Number(trade.odds).toFixed(2)}x` : "—",
        created_at: new Date(trade.created_at).toLocaleString(),
        market_status: trade.market_status.charAt(0).toUpperCase() + trade.market_status.slice(1),
        // Left as the raw value (win/loss/cancelled/null) — rendered as a
        // badge in the table-row slot, "Pending" for a market not resolved yet.
        result: trade.result,
      }));
    },
  },
  async mounted() {
    await this.loadPage(1);
  },
  methods: {
    resultBadgeClass(result) {
      return RESULT_BADGE_CLASS[result] || "text-slate-500 bg-slate-500";
    },
    switchTab(tab) {
      if (this.activeTab === tab) return;
      this.activeTab = tab;
      this.loadPage(1);
    },
    async loadPage(page) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const endpoint = this.activeTab === "binary" ? "/market/admin/trades/" : "/market/admin/choice-trades/";
        const { data } = await api.get(endpoint, { params: { page } });
        this.trades = data.results;
        this.count = data.count;
        this.page = page;
      } catch (err) {
        this.errorMessage = extractError(err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
