<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Jackpots</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'market-jackpots-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Create jackpot
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
          No jackpots yet.
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
                <router-link :to="{ name: 'market-jackpots-view', params: { id: props.row.id } }" class="hover:underline">
                  {{ props.row.title }}
                </router-link>
              </span>
              <span v-else-if="props.column.field === 'status'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
                  :class="statusClass(props.row.status)"
                >
                  {{ statusLabel(props.row.status) }}
                </span>
              </span>
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

    <Modal ref="publishModal" title="Publish jackpot" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-base text-slate-600 dark:text-slate-300">
        Publishing "<strong>{{ pendingPublish?.title }}</strong>" makes it visible to everyone, and it can't be edited
        afterwards.
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
      jackpots: [],
      searchTerm: "",
      count: 0,
      page: 1,
      // matches MarketPagination.page_size on the backend
      perPage: 20,
      publishingId: null,
      pendingPublish: null,
      columns: [
        { label: "Code", field: "code" },
        { label: "Title", field: "title" },
        { label: "Markets", field: "markets" },
        { label: "Entry fee", field: "entry_fee" },
        { label: "Prize", field: "prize_amount" },
        { label: "Partial wins", field: "allow_partial_wins" },
        { label: "Status", field: "status" },
        { label: "Created", field: "created_at" },
        { label: "Action", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    rows() {
      return this.jackpots.map((jackpot) => ({
        id: jackpot.id,
        code: jackpot.code,
        title: jackpot.title,
        // markets added so far out of the count it's set to
        markets: `${jackpot.items_count} / ${jackpot.market_count}`,
        entry_fee: this.formatKes(jackpot.entry_fee),
        prize_amount: this.formatKes(jackpot.prize_amount),
        allow_partial_wins: jackpot.allow_partial_wins ? "Yes" : "No",
        status: jackpot.status,
        created_at: new Date(jackpot.created_at).toLocaleString(),
      }));
    },
  },
  async mounted() {
    await this.loadPage(1);
  },
  methods: {
    statusLabel(status) {
      return { draft: "Draft", published: "Published", settled: "Settled" }[status] || status;
    },
    statusClass(status) {
      return {
        draft: "text-warning-500 bg-warning-500",
        published: "text-success-500 bg-success-500",
        settled: "text-info-500 bg-info-500",
      }[status];
    },
    formatKes(value) {
      return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    },
    // A published jackpot is locked — only drafts can be edited or published.
    rowActions(row) {
      const view = { name: "view", icon: "heroicons-outline:eye" };
      const remove = { name: "delete", icon: "heroicons-outline:trash" };
      if (row.status === "published") return [view, remove];
      return [
        view,
        { name: "publish", icon: "heroicons-outline:check-circle" },
        { name: "edit", icon: "heroicons:pencil-square" },
        remove,
      ];
    },
    handleAction(name, row) {
      if (name === "view") {
        this.router.push({ name: "market-jackpots-view", params: { id: row.id } });
        return;
      }
      if (name === "edit") {
        this.router.push({ name: "market-jackpots-edit", params: { id: row.id } });
        return;
      }
      if (name === "publish") {
        this.pendingPublish = row;
        this.$refs.publishModal.openModal();
        return;
      }
      // delete is not wired yet
    },
    async confirmPublish() {
      if (!this.pendingPublish || this.publishingId) return;
      const { id } = this.pendingPublish;
      this.publishingId = id;
      try {
        const { data } = await api.post(`/market/jackpots/${id}/publish/`);
        const jackpot = this.jackpots.find((j) => j.id === id);
        if (jackpot) jackpot.status = data.status;
        pushSuccess("Jackpot published.");
        this.$refs.publishModal.closeModal();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.publishingId = null;
      }
    },
    async loadPage(page) {
      this.loading = true;
      this.errorMessage = "";
      try {
        const { data } = await api.get("/market/jackpots/", { params: { page } });
        this.jackpots = data.results;
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
