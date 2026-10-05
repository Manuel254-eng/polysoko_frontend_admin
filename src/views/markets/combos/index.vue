<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Combos</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'market-combos-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Create combo
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
          No combos yet.
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
              <span v-else-if="props.column.field === 'status'" class="block w-full">
                <span
                  class="inline-block px-3 min-w-[90px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
                  :class="props.row.status === 'published' ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'"
                >
                  {{ props.row.status === "published" ? "Published" : "Draft" }}
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

    <Modal ref="publishModal" title="Publish combo" labelClass="hidden" centered>
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
      combos: [],
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
        { label: "Markets", field: "items_count", type: "number" },
        { label: "Status", field: "status" },
        { label: "Created", field: "created_at" },
        { label: "Action", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    rows() {
      return this.combos.map((combo) => ({
        id: combo.id,
        code: combo.code,
        title: combo.title,
        items_count: combo.items_count,
        status: combo.status,
        created_at: new Date(combo.created_at).toLocaleString(),
      }));
    },
  },
  async mounted() {
    await this.loadPage(1);
  },
  methods: {
    // A published combo is locked — only drafts can be edited or published.
    rowActions(row) {
      const remove = { name: "delete", icon: "heroicons-outline:trash" };
      if (row.status === "published") return [remove];
      return [
        { name: "publish", icon: "heroicons-outline:check-circle" },
        { name: "edit", icon: "heroicons:pencil-square" },
        remove,
      ];
    },
    handleAction(name, row) {
      if (name === "edit") {
        this.router.push({ name: "market-combos-edit", params: { id: row.id } });
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
        const { data } = await api.post(`/market/combos/${id}/publish/`);
        const combo = this.combos.find((c) => c.id === id);
        if (combo) combo.status = data.status;
        pushSuccess("Combo published.");
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
        const { data } = await api.get("/market/combos/", { params: { page } });
        this.combos = data.results;
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
