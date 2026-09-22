<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Accounts</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
      </div>
      <div v-else-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        No accounts yet.
      </div>
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table bordered centered"
        :pagination-options="{ enabled: true, perPage }"
        :search-options="{ enabled: true, externalQuery: searchTerm }"
      >
        <template v-slot:table-row="props">
          <span v-if="props.column.field === 'category'" class="block w-full">
            <span
              class="inline-block px-3 min-w-[80px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 capitalize"
              :class="categoryBadgeClass(props.row.category)"
            >
              {{ props.row.category }}
            </span>
          </span>
          <span v-else-if="props.column.field === 'balance'" class="block w-full text-right pr-4">
            {{ formatBalance(props.row.balance) }}
          </span>
          <span v-else-if="props.column.field === 'action'">
            <router-link
              :to="{ name: 'accounting-account-detail', params: { code: props.row.code } }"
              class="text-xl text-slate-500 hover:text-primary-500"
              title="View"
            >
              <Icon icon="heroicons-outline:eye" />
            </router-link>
          </span>
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
import InputGroup from "@/components/InputGroup";
import Icon from "@/components/Icon";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
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

export default {
  components: { Card, InputGroup, Icon, Pagination },
  data() {
    return {
      loading: true,
      errorMessage: "",
      accounts: [],
      searchTerm: "",
      current: 1,
      perPage: 10,
      perPageOptions: [
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "25", label: "25" },
      ],
      columns: [
        { label: "Code", field: "code" },
        { label: "Account", field: "name" },
        { label: "Category", field: "category" },
        { label: "Balance (KES)", field: "balance", type: "number" },
        { label: "", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    rows() {
      return this.accounts.map((account) => ({
        code: account.code,
        name: account.name,
        category: account.category,
        balance: account.balance,
      }));
    },
  },
  methods: {
    categoryBadgeClass(category) {
      return CATEGORY_BADGE_CLASS[category] || "text-slate-500 bg-slate-500";
    },
    formatBalance(balance) {
      return Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/wallet/accounts/");
      this.accounts = data;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
};
</script>
