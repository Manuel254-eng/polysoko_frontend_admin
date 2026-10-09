<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Players</h5>
        <div class="flex items-center gap-3">
          <select v-model="testFilter" class="input-control h-[38px] w-auto" aria-label="Filter players">
            <option value="">All players</option>
            <option value="false">Real players</option>
            <option value="true">Test accounts</option>
          </select>
          <InputGroup v-model="searchTerm" placeholder="Name, phone or email" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'testing' }" class="btn btn-outline-dark btn-sm whitespace-nowrap">
            Seed test players
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
      <template v-else>
        <div v-if="clients.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          {{ searchTerm.trim() || testFilter ? "No players match these filters." : "No players yet." }}
        </div>
        <template v-else>
          <div class="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{{ count.toLocaleString() }} players</span>
            <template v-if="selectedCount > 0">
              <span class="text-slate-300 dark:text-slate-600">|</span>
              <span class="font-medium text-slate-700 dark:text-slate-200">
                {{ allMatching && excludedIds.size === 0 ? `All ${count.toLocaleString()}` : selectedCount.toLocaleString() }} selected
              </span>
              <button
                v-if="!allMatching && pageFullySelected && count > clients.length"
                type="button"
                class="text-primary-500 hover:underline"
                @click="selectAllMatching"
              >
                Select all {{ count.toLocaleString() }} players
              </button>
              <button type="button" class="text-danger-500 hover:underline" @click="clearSelection">Clear</button>
              <span class="flex-1"></span>
              <span v-if="!selectionIsAllTest" class="text-warning-500">Only test accounts can simulate bets.</span>
              <button
                type="button"
                class="btn btn-dark btn-sm"
                :disabled="!selectionIsAllTest"
                @click="simulateBets"
              >
                Simulate bets
              </button>
            </template>
          </div>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            styleClass="vgt-table bordered centered"
            :pagination-options="{ enabled: false }"
            :search-options="{ enabled: false }"
            :select-options="{
              enabled: true,
              selectOnCheckboxOnly: true,
              disableSelectInfo: true,
            }"
            @selected-rows-change="onSelectionChange"
          >
            <template v-slot:table-row="props">
              <span v-if="props.column.field === 'name'" class="text-slate-600 dark:text-slate-300 font-medium">
                {{ props.row.name || "—" }}
                <span
                  v-if="props.row.is_test"
                  class="inline-block ltr:ml-2 rtl:mr-2 px-2 py-[1px] rounded text-[10px] font-medium uppercase text-warning-500 bg-warning-500 bg-opacity-25"
                >
                  Test
                </span>
              </span>
              <span v-else-if="props.column.field === 'is_active'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[80px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
                  :class="props.row.is_active ? 'text-success-500 bg-success-500' : 'text-slate-500 bg-slate-500'"
                >
                  {{ props.row.is_active ? "Active" : "Unverified" }}
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
import { extractError } from "@/lib/errors";
import { setSimulationSelection } from "@/lib/simulationSelection";

export default {
  components: { Card, InputGroup, Pagination },
  data() {
    return {
      loading: true,
      errorMessage: "",
      clients: [],
      searchTerm: "",
      // "" | "true" | "false" — sent as ?is_test=, server-side like search.
      testFilter: this.$route.query.is_test || "",
      count: 0,
      page: 1,
      // Ids ticked so far, kept across pages. allMatching means "every client
      // matching the current filters", not just the ticked ones.
      selectedIds: new Set(),
      // id -> is_test for every ticked player, so the Simulate bets action can
      // tell whether the selection is all test accounts across pages.
      selectedTest: new Map(),
      allMatching: false,
      // In "all matching" mode: the ones unticked since — everyone else stays selected.
      excludedIds: new Set(),
      // matches ClientPagination.page_size on the backend
      perPage: 20,
      columns: [
        { label: "Name", field: "name" },
        { label: "Phone", field: "phone" },
        { label: "Email", field: "email" },
        { label: "Balance", field: "balance" },
        { label: "Status", field: "is_active" },
        { label: "Joined", field: "created_at" },
      ],
    };
  },
  computed: {
    rows() {
      return this.clients.map((client) => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email || "—",
        balance: `KES ${Number(client.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
        is_active: client.is_active,
        is_test: client.is_test,
        created_at: client.created_at ? new Date(client.created_at).toLocaleString() : "—",
        // vue-good-table re-ticks rows already chosen on another visit to this page.
        vgtSelected: this.allMatching ? !this.excludedIds.has(client.id) : this.selectedIds.has(client.id),
      }));
    },
    selectedCount() {
      return this.allMatching ? this.count - this.excludedIds.size : this.selectedIds.size;
    },
    selectionIsAllTest() {
      if (this.allMatching) return this.testFilter === "true";
      return this.selectedIds.size > 0 && [...this.selectedIds].every((id) => this.selectedTest.get(id));
    },
    pageFullySelected() {
      return this.clients.length > 0 && this.clients.every((client) => this.selectedIds.has(client.id));
    },
    // What a bulk action would act on: { all: true, filters, exclude } for every
    // player matching the filters bar the unticked ones, or { ids } for the ticked.
    selection() {
      if (this.allMatching) {
        return {
          all: true,
          filters: { search: this.searchTerm.trim() || undefined, is_test: this.testFilter || undefined },
          exclude: [...this.excludedIds],
        };
      }
      return { ids: [...this.selectedIds] };
    },
  },
  watch: {
    // Search runs server-side across every client, so it restarts from page 1 —
    // debounced so typing doesn't fire a request per key.
    searchTerm() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        // A selection only makes sense for the filters it was made under.
        this.clearSelection();
        this.loadPage(1);
      }, 300);
    },
    testFilter() {
      this.clearSelection();
      this.loadPage(1);
    },
  },
  async mounted() {
    await this.loadPage(1);
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer);
  },
  methods: {
    // vue-good-table-next emits "selected-rows-change" (no "on-" prefix, unlike
    // the Vue 2 library's docs) with the ticked rows on the current page only — swap
    // this page's ids in the kept-across-pages set for what's ticked now.
    onSelectionChange({ selectedRows }) {
      if (this.allMatching) {
        // Stay in "all matching" mode — just track who on this page is unticked.
        const ticked = new Set(selectedRows.map((row) => row.id));
        const excluded = new Set(this.excludedIds);
        for (const client of this.clients) {
          if (ticked.has(client.id)) excluded.delete(client.id);
          else excluded.add(client.id);
        }
        this.excludedIds = excluded;
        if (excluded.size >= this.count) this.clearSelection();
        return;
      }
      const next = new Set(this.selectedIds);
      const tests = new Map(this.selectedTest);
      for (const client of this.clients) {
        next.delete(client.id);
        tests.delete(client.id);
      }
      for (const row of selectedRows) {
        next.add(row.id);
        tests.set(row.id, row.is_test);
      }
      this.selectedIds = next;
      this.selectedTest = tests;
    },
    selectAllMatching() {
      this.allMatching = true;
      this.excludedIds = new Set();
    },
    clearSelection() {
      this.selectedIds = new Set();
      this.selectedTest = new Map();
      this.allMatching = false;
      this.excludedIds = new Set();
    },
    simulateBets() {
      if (!this.selectionIsAllTest) return;
      setSimulationSelection(this.selection, this.selectedCount);
      this.$router.push({ name: "testing-simulate-bets" });
    },
    async loadPage(page) {
      // Only the latest request may update the table.
      const requestId = (this.latestRequestId = (this.latestRequestId || 0) + 1);
      this.loading = true;
      this.errorMessage = "";
      try {
        const search = this.searchTerm.trim();
        const params = { page, search: search || undefined, is_test: this.testFilter || undefined };
        const { data } = await api.get("/user/clients/", { params });
        if (requestId !== this.latestRequestId) return;
        this.clients = data.results;
        this.count = data.count;
        this.page = page;
      } catch (err) {
        if (requestId !== this.latestRequestId) return;
        this.errorMessage = extractError(err);
      } finally {
        if (requestId === this.latestRequestId) this.loading = false;
      }
    },
  },
};
</script>
