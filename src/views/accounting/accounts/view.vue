<template>
  <div class="space-y-5">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Account Details</h6>
        <router-link :to="{ name: 'accounting-accounts' }" class="btn btn-outline-dark btn-sm">Back</router-link>
      </header>
      <div class="p-6">
        <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          Loading…
        </div>
        <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
          {{ errorMessage }}
        </div>
        <dl v-else class="grid md:grid-cols-4 grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Code</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ account.code }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Account</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ account.name }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Category</dt>
            <dd>
              <span
                class="inline-block px-3 min-w-[80px] text-center py-1 rounded-[999px] bg-opacity-25 capitalize"
                :class="categoryBadgeClass(account.category)"
              >
                {{ account.category }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Balance (KES)</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ formatAmount(account.balance) }}</dd>
          </div>
        </dl>
      </div>
    </Card>

    <Card v-if="!loading && !errorMessage" noborder>
      <div class="pb-6">
        <h5>Activity</h5>
      </div>

      <div v-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        No activity has touched this account yet.
      </div>
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table bordered centered"
        :pagination-options="{ enabled: true, perPage }"
      >
        <template v-slot:table-row="props">
          <span v-if="props.column.field === 'debit' || props.column.field === 'credit' || props.column.field === 'amount'" class="block w-full text-right pr-4">
            {{ formatAmount(props.row[props.column.field]) }}
          </span>
          <span v-else-if="props.column.field === 'ledger'" class="text-sm text-slate-600 dark:text-slate-300">
            {{ ledgerLabel(props.row.ledger) }}
          </span>
          <span v-else-if="props.column.field === 'type'" class="capitalize">{{ props.row.type.replace(/_/g, " ") }}</span>
          <span v-else>{{ props.formattedRow[props.column.field] }}</span>
        </template>
        <template #pagination-bottom="props">
          <div class="py-4 px-3">
            <Pagination
              :total="rows.length"
              :current="current"
              :per-page="perPage"
              :pageRange="2"
              @page-changed="current = $event"
              :pageChanged="props.pageChanged"
              :perPageChanged="props.perPageChanged"
              enableSearch
              enableSelect
              :options="perPageOptions"
            />
          </div>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (err?.response?.status === 404) return "This account could not be found.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

const CATEGORY_BADGE_CLASS = {
  asset: "text-info-500 bg-info-500",
  liability: "text-warning-500 bg-warning-500",
  equity: "text-slate-500 bg-slate-500",
  revenue: "text-success-500 bg-success-500",
  expense: "text-danger-500 bg-danger-500",
};

const LEDGER_LABELS = {
  UserWallet: "User Wallet",
  PlatformWallet: "Platform Wallet",
  MarketLiquidity: "Market Liquidity",
};

function sourceLabel(entry) {
  const source = entry.source || {};
  if (entry.ledger === "UserWallet") return source.phone || "—";
  if (entry.ledger === "MarketLiquidity") return source.market_title || "—";
  return source.created_by || "—";
}

export default {
  components: { Card, Pagination },
  data() {
    return {
      loading: true,
      errorMessage: "",
      account: {},
      activity: [],
      current: 1,
      perPage: 10,
      perPageOptions: [
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "25", label: "25" },
      ],
      columns: [
        { label: "Date", field: "created_at" },
        { label: "Ledger", field: "ledger" },
        { label: "Type", field: "type" },
        { label: "Source", field: "source_label" },
        { label: "Reference", field: "reference" },
        { label: "Debit (KES)", field: "debit", type: "number" },
        { label: "Credit (KES)", field: "credit", type: "number" },
        { label: "Amount (KES)", field: "amount", type: "number" },
      ],
    };
  },
  computed: {
    rows() {
      return this.activity.map((entry) => ({
        ...entry,
        created_at: new Date(entry.created_at).toLocaleString(),
        source_label: sourceLabel(entry),
      }));
    },
  },
  async mounted() {
    try {
      const { data } = await api.get(`/wallet/accounts/${this.$route.params.code}/`);
      this.account = data;
      this.activity = data.activity;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    categoryBadgeClass(category) {
      return CATEGORY_BADGE_CLASS[category] || "text-slate-500 bg-slate-500";
    },
    ledgerLabel(ledger) {
      return LEDGER_LABELS[ledger] || ledger;
    },
    formatAmount(value) {
      return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  },
};
</script>
