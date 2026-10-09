<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Markets</h5>
        <div class="flex items-center gap-3">
          <select v-model="promotionFilter" class="input-control h-[38px] w-auto" aria-label="Filter markets">
            <option value="">All markets</option>
            <option value="is_featured">Featured</option>
            <option value="is_pinned">Pinned</option>
          </select>
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'markets-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Add market
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
      </div>
      <template v-else>
        <div v-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          {{
            searchTerm.trim() || promotionFilter ? "No markets match these filters." : "No published markets yet."
          }}
        </div>
        <template v-else>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            styleClass="vgt-table bordered centered"
            :pagination-options="{ enabled: false }"
            :search-options="{ enabled: false }"
            :select-options="{
              enabled: true,
              selectOnCheckboxOnly: true,
              selectionInfoClass: 'custom-class',
              selectionText: 'rows selected',
              clearSelectionText: 'clear',
              disableSelectInfo: true,
            }"
          >
            <template v-slot:table-row="props">
              <span v-if="props.column.field === 'title'" class="text-slate-600 dark:text-slate-300 font-medium">
                {{ props.row.title }}
                <Icon
                  v-if="props.row.is_featured"
                  icon="heroicons-solid:star"
                  class="inline text-warning-500 ltr:ml-1 rtl:mr-1"
                  title="Featured"
                />
                <Icon
                  v-if="props.row.is_pinned"
                  icon="heroicons-outline:arrow-up"
                  class="inline text-info-500 ltr:ml-1 rtl:mr-1"
                  title="Pinned"
                />
              </span>
              <span v-else-if="props.column.field === 'is_published'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
                  :class="props.row.is_published ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'"
                >
                  {{ props.row.is_published ? "Published" : "Draft" }}
                </span>
              </span>
              <span v-else-if="props.column.field === 'status'" class="capitalize">{{ props.row.status }}</span>
              <span v-else-if="props.column.field === 'action'">
                <Dropdown classMenuItems=" w-[140px]">
                  <span class="text-xl"><Icon icon="heroicons-outline:dots-vertical" /></span>
                  <template v-slot:menus>
                    <MenuItem v-for="(item, i) in rowActions(props.row)" :key="i">
                      <div
                        @click="handleAction(item.name, props.row)"
                        :class="`${
                          item.name === 'delete'
                            ? 'bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white'
                            : item.name === 'publish'
                            ? 'bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white'
                            : 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50'
                        } w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse`"
                      >
                        <span class="text-base"><Icon :icon="item.icon" /></span>
                        <span>{{ item.name }}</span>
                      </div>
                    </MenuItem>
                  </template>
                </Dropdown>
              </span>
              <span v-else>{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </vue-good-table>

          <div class="py-4 px-3" v-if="count > perPage">
            <Pagination
              :total="count"
              :current="page"
              :per-page="perPage"
              :pageRange="2"
              @page-changed="loadPage"
            />
          </div>
        </template>
      </template>
    </Card>

    <Modal ref="publishModal" title="Publish market" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-base text-slate-600 dark:text-slate-300">
        Publishing "<strong>{{ pendingPublish?.title }}</strong>" makes it visible to everyone. This can't be undone
        from here.
      </div>
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.publishModal.closeModal()" />
        <Button
          text="Publish"
          btnClass="btn-dark"
          :isLoading="publishingId === pendingPublish?.id"
          @click="confirmPublish"
        />
      </template>
    </Modal>
  </div>
</template>
<script>
import Card from "@/components/Card";
import InputGroup from "@/components/InputGroup";
import Dropdown from "@/components/Dropdown";
import Icon from "@/components/Icon";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button";
import { MenuItem } from "@headlessui/vue";
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

export default {
  components: { Card, InputGroup, Dropdown, Icon, Pagination, Modal, Button, MenuItem },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      loading: true,
      errorMessage: "",
      markets: [],
      categories: [],
      searchTerm: "",
      // "" | "is_featured" | "is_pinned" — sent as ?<field>=true, server-side like search.
      promotionFilter: "",
      count: 0,
      next: null,
      previous: null,
      page: 1,
      // matches MarketPagination.page_size on the backend
      perPage: 20,
      publishingId: null,
      pendingPublish: null,
      baseActions: [
        { name: "view", icon: "heroicons-outline:eye" },
        { name: "edit", icon: "heroicons:pencil-square" },
        { name: "delete", icon: "heroicons-outline:trash" },
      ],
      columns: [
        { label: "Title", field: "title" },
        { label: "Category", field: "category" },
        { label: "Status", field: "status" },
        { label: "Published", field: "is_published" },
        { label: "Resolution date", field: "resolution_date" },
        { label: "Action", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    categoryNameById() {
      return Object.fromEntries(this.categories.map((category) => [category.id, category.name]));
    },
    rows() {
      return this.markets.map((market) => ({
        id: market.id,
        title: market.title,
        category: this.categoryNameById[market.category] || "—",
        status: market.status,
        is_published: market.is_published,
        is_featured: market.is_featured,
        is_pinned: market.is_pinned,
        resolution_date: new Date(market.resolution_date).toLocaleString(),
      }));
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = data;
    } catch {
      // categories are only used for display — a failed lookup just falls back to "—"
    }
    await this.loadPage(1);
  },
  watch: {
    // Search runs against the whole table server-side (title or category), so
    // it restarts from page 1 — debounced so typing doesn't fire a request per key.
    searchTerm() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.loadPage(1), 300);
    },
    promotionFilter() {
      this.loadPage(1);
    },
  },
  beforeUnmount() {
    clearTimeout(this.searchTimer);
  },
  methods: {
    // "Publish" and "edit" only make sense for a draft — a published market is locked.
    // Featuring and pinning stay available after publishing — they only change
    // how the market is promoted on the home page, not what's being bet on.
    rowActions(row) {
      const [view, edit, ...rest] = this.baseActions;
      const liquidity = row.status === "open" ? [{ name: "add liquidity", icon: "heroicons-outline:plus-circle" }] : [];
      const promotion = [
        row.is_featured
          ? { name: "unfeature", icon: "heroicons-outline:star" }
          : { name: "feature", icon: "heroicons-outline:star" },
        row.is_pinned
          ? { name: "unpin", icon: "heroicons-outline:arrow-down" }
          : { name: "pin", icon: "heroicons-outline:arrow-up" },
      ];
      if (row.is_published) return [view, ...liquidity, ...promotion, ...rest];
      return [view, { name: "publish", icon: "heroicons-outline:check-circle" }, edit, ...liquidity, ...promotion, ...rest];
    },
    async setPromotion(row, field, value, message) {
      try {
        const { data } = await api.patch(`/market/${row.id}/`, { [field]: value });
        const market = this.markets.find((m) => m.id === row.id);
        if (market) market[field] = data[field];
        pushSuccess(message);
      } catch (err) {
        pushError(extractError(err));
      }
    },
    handleAction(name, row) {
      if (name === "view") {
        this.router.push({ name: "market-details", params: { id: row.id } });
        return;
      }
      if (name === "edit") {
        this.router.push({ name: "markets-edit", params: { id: row.id } });
        return;
      }
      if (name === "add liquidity") {
        this.router.push({ name: "market-details", params: { id: row.id }, query: { addLiquidity: 1 } });
        return;
      }
      if (name === "publish") {
        this.pendingPublish = row;
        this.$refs.publishModal.openModal();
        return;
      }
      if (name === "feature" || name === "unfeature") {
        const featuring = name === "feature";
        this.setPromotion(row, "is_featured", featuring, featuring ? "Market featured." : "Market unfeatured.");
        return;
      }
      if (name === "pin" || name === "unpin") {
        const pinning = name === "pin";
        this.setPromotion(row, "is_pinned", pinning, pinning ? "Market pinned." : "Market unpinned.");
        return;
      }
      // delete is not wired yet
    },
    async confirmPublish() {
      if (!this.pendingPublish) return;
      await this.publishMarket(this.pendingPublish.id);
      this.$refs.publishModal.closeModal();
    },
    async publishMarket(id) {
      if (this.publishingId) return;
      this.publishingId = id;
      try {
        const { data } = await api.patch(`/market/${id}/`, { is_published: true });
        const market = this.markets.find((m) => m.id === id);
        if (market) market.is_published = data.is_published;
        pushSuccess("Market published.");
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.publishingId = null;
      }
    },
    async loadPage(page) {
      // Only the latest request may update the table — an earlier, slower
      // search response must not overwrite the results of a newer one.
      const requestId = (this.latestRequestId = (this.latestRequestId || 0) + 1);
      this.loading = true;
      this.errorMessage = "";
      try {
        const search = this.searchTerm.trim();
        const params = { page, search: search || undefined };
        if (this.promotionFilter) params[this.promotionFilter] = true;
        const { data } = await api.get("/market/", { params });
        if (requestId !== this.latestRequestId) return;
        this.markets = data.results;
        this.count = data.count;
        this.next = data.next;
        this.previous = data.previous;
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
