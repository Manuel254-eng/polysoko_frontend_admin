<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Markets</h5>
        <div class="flex items-center gap-3">
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
          No published markets yet.
        </div>
        <template v-else>
          <vue-good-table
            :columns="columns"
            :rows="rows"
            styleClass="vgt-table bordered centered"
            :pagination-options="{ enabled: false }"
            :search-options="{ enabled: true, externalQuery: searchTerm }"
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
import { useToast } from "vue-toastification";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

export default {
  components: { Card, InputGroup, Dropdown, Icon, Pagination, Modal, Button, MenuItem },
  setup() {
    const router = useRouter();
    const toast = useToast();
    return { router, toast };
  },
  data() {
    return {
      loading: true,
      errorMessage: "",
      markets: [],
      categories: [],
      searchTerm: "",
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
  methods: {
    // "Publish" only makes sense for a row that isn't published yet.
    rowActions(row) {
      if (row.is_published) return this.baseActions;
      const [view, ...rest] = this.baseActions;
      return [view, { name: "publish", icon: "heroicons-outline:check-circle" }, ...rest];
    },
    handleAction(name, row) {
      if (name === "view") {
        this.router.push({ name: "market-details", params: { id: row.id } });
        return;
      }
      if (name === "publish") {
        this.pendingPublish = row;
        this.$refs.publishModal.openModal();
        return;
      }
      // edit/delete are not wired yet
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
        this.toast.success("Market published", { timeout: 2000 });
      } catch (err) {
        this.toast.error(extractError(err), { timeout: 3000 });
      } finally {
        this.publishingId = null;
      }
    },
    async loadPage(page) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const { data } = await api.get("/market/", { params: { page } });
        this.markets = data.results;
        this.count = data.count;
        this.next = data.next;
        this.previous = data.previous;
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
