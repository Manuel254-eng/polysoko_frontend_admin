<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Market Categories</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'market-categories-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Add category
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
      </div>
      <div v-else-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        No categories yet.
      </div>
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table bordered centered"
        :pagination-options="{ enabled: true, perPage }"
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
          <span v-if="props.column.field === 'name'" class="flex items-center">
            <span
              class="w-7 h-7 rounded ltr:mr-3 rtl:ml-3 flex-none bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-base"
            >
              <Icon v-if="props.row.icon" :icon="props.row.icon" />
              <span v-else class="text-xs">—</span>
            </span>
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ props.row.name }}</span>
          </span>
          <span v-else-if="props.column.field === 'action'">
            <Dropdown classMenuItems=" w-[140px]">
              <span class="text-xl"><Icon icon="heroicons-outline:dots-vertical" /></span>
              <template v-slot:menus>
                <MenuItem v-for="(item, i) in actions" :key="i">
                  <div
                    :class="`${
                      item.name === 'delete'
                        ? 'bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white'
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
import Dropdown from "@/components/Dropdown";
import Icon from "@/components/Icon";
import Pagination from "@/components/Pagination";
import { MenuItem } from "@headlessui/vue";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

export default {
  components: { Card, InputGroup, Dropdown, Icon, Pagination, MenuItem },
  data() {
    return {
      loading: true,
      errorMessage: "",
      categories: [],
      searchTerm: "",
      current: 1,
      perPage: 10,
      perPageOptions: [
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "25", label: "25" },
      ],
      actions: [
        { name: "edit", icon: "heroicons:pencil-square" },
        { name: "delete", icon: "heroicons-outline:trash" },
      ],
      columns: [
        { label: "Name", field: "name" },
        { label: "Slug", field: "slug" },
        { label: "Action", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    rows() {
      return this.categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
      }));
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = data;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
};
</script>
