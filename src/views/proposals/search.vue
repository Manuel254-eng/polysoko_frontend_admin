<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <div>
          <h5>Search markets</h5>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every published market, open or finished — check what's already covered before proposing.
          </p>
        </div>
        <router-link :to="{ name: 'proposals-create' }" class="btn btn-dark btn-sm">Propose a market</router-link>
      </div>

      <div class="mb-5 max-w-xl">
        <InputGroup v-model="query" placeholder="Team, event, keyword or category…" type="text" prependIcon="heroicons-outline:search" merged />
      </div>

      <div v-if="!query.trim()" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Type to search titles and categories.
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
      <div v-else-if="loading && !markets.length" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Searching…</div>
      <div v-else-if="!markets.length" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        No published market matches "{{ query.trim() }}" — it may be a good one to propose.
      </div>

      <template v-else>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">{{ total.toLocaleString() }} {{ total === 1 ? "market" : "markets" }}</p>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-slate-400">
                <th class="py-2 ltr:pr-4 rtl:pl-4">Market</th>
                <th class="py-2 ltr:pr-4 rtl:pl-4">Category</th>
                <th class="py-2 ltr:pr-4 rtl:pl-4">Status</th>
                <th class="py-2">Betting closes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-for="m in markets" :key="m.id" class="text-slate-700 dark:text-slate-200">
                <td class="py-3 ltr:pr-4 rtl:pl-4 font-medium">{{ m.title }}</td>
                <td class="py-3 ltr:pr-4 rtl:pl-4">{{ categoryName(m.category) }}</td>
                <td class="py-3 ltr:pr-4 rtl:pl-4 capitalize">{{ m.status }}</td>
                <td class="py-3 whitespace-nowrap">{{ formatDateTime(m.close_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="hasMore" class="text-center mt-5">
          <Button text="Load more" btnClass="btn-outline-dark btn-sm" :isLoading="loading" @click="loadPage" />
        </div>
      </template>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Button from "@/components/Button";
import InputGroup from "@/components/InputGroup";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";
import { formatDateTime } from "./shared";

const PAGE_SIZE = 25;
const DEBOUNCE_MS = 350;

export default {
  components: { Card, Button, InputGroup },
  data() {
    return {
      query: "",
      markets: [],
      categories: {},
      total: 0,
      page: 0,
      hasMore: false,
      loading: false,
      errorMessage: "",
      timer: null,
      // Bumped per new search so a slow reply to an older query is dropped.
      generation: 0,
    };
  },
  watch: {
    query() {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.restart, DEBOUNCE_MS);
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = Object.fromEntries(data.map((c) => [c.id, c.name]));
    } catch {
      // Category names are a nicety — the search still works without them.
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer);
  },
  methods: {
    formatDateTime,
    categoryName(id) {
      return this.categories[id] || "—";
    },
    restart() {
      this.generation += 1;
      this.markets = [];
      this.total = 0;
      this.page = 0;
      this.hasMore = false;
      this.errorMessage = "";
      if (this.query.trim()) this.loadPage();
    },
    async loadPage() {
      const generation = this.generation;
      this.loading = true;
      try {
        const { data } = await api.get("/market/", {
          params: { search: this.query.trim(), page: this.page + 1, page_size: PAGE_SIZE },
        });
        if (generation !== this.generation) return;
        this.markets.push(...data.results);
        this.total = data.count;
        this.page += 1;
        this.hasMore = Boolean(data.next);
      } catch (err) {
        if (generation === this.generation) this.errorMessage = extractError(err);
      } finally {
        if (generation === this.generation) this.loading = false;
      }
    },
  },
};
</script>
