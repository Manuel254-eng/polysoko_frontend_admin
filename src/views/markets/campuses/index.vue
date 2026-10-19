<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Campuses</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search campuses" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'market-campuses-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Create campus
          </router-link>
        </div>
      </div>
      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
      <div v-else-if="!campuses.length" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">No campuses yet.</div>
      <vue-good-table v-else :columns="columns" :rows="campuses" styleClass="vgt-table bordered centered"
        :pagination-options="{ enabled: true, perPage: 10 }"
        :search-options="{ enabled: true, externalQuery: searchTerm }">
        <template #table-row="props">
          <span v-if="props.column.field === 'name'" class="flex items-center gap-3">
            <img v-if="props.row.logo" :src="props.row.logo" :alt="props.row.name + ' logo'" class="w-10 h-10 object-contain flex-none" />
            <span v-else class="w-10 h-10 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-none">—</span>
            <span class="text-slate-600 dark:text-slate-300 font-medium">{{ props.row.name }}</span>
          </span>
          <span v-else-if="props.column.field === 'is_active'"
            class="inline-block px-3 py-1 rounded-full bg-opacity-25"
            :class="props.row.is_active ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'">
            {{ props.row.is_active ? 'Active' : 'Inactive' }}
          </span>


          <span v-else-if="props.column.field === 'action'">
            <Dropdown classMenuItems="w-[140px]">
              <span class="text-xl">
                <Icon icon="heroicons-outline:dots-vertical" />
              </span>

              <template v-slot:menus>
                <MenuItem
                  v-for="(item, i) in rowActions(props.row)"
                  :key="i"
                  :disabled="updatingIds.includes(props.row.id)"
                >
                  <div
                    @click="handleAction(item.name, props.row)"
                    :class="`${
                      item.name === 'delete'
                        ? 'bg-danger-500 text-danger-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white'
                        : item.name === 'activate'
                        ? 'bg-success-500 text-success-500 bg-opacity-30 hover:bg-opacity-100 hover:text-white'
                        : 'hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 dark:hover:bg-opacity-50'
                    } w-full border-b border-b-gray-500 border-opacity-10 px-4 py-2 text-sm last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse ${
                      updatingIds.includes(props.row.id)
                        ? 'opacity-50 pointer-events-none'
                        : ''
                    }`"
                  >
                    <span class="text-base">
                      <Icon :icon="item.icon" />
                    </span>
                    <span class="capitalize">{{ item.name }}</span>
                  </div>
                </MenuItem>
              </template>
            </Dropdown>
          </span>
          <span v-else>{{ props.formattedRow[props.column.field] || '—' }}</span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>

<script>
import Card from "@/components/Card";
import InputGroup from "@/components/InputGroup";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";
import Icon from "@/components/Icon";
import { MenuItem } from "@headlessui/vue";
import { pushError, pushSuccess } from "@/lib/alerts";
import { extractGeneralError } from "@/lib/errors";

export default {
  components: { Card, InputGroup, Dropdown, Icon, MenuItem },
  data: () => ({
    campuses: [], loading: true, errorMessage: "", searchTerm: "", updatingIds: [],
    columns: [
      { label: "Campus", field: "name" },
      { label: "Slug", field: "slug" },
      { label: "Location", field: "location" },
      { label: "Markets", field: "market_count", type: "number" },
      { label: "Status", field: "is_active", type: "boolean" },
      { label: "Action", field: "action", sortable: false },
    ],
  }),
  async mounted() {
    try { this.campuses = (await api.get("/market/campuses/")).data; }
    catch (err) { this.errorMessage = extractGeneralError(err) || "Could not load campuses."; }
    finally { this.loading = false; }
  },

  methods: {
    rowActions(row) {
      return [
        {
          name: "view",
          icon: "heroicons-outline:eye",
        },
        {
          name: "edit",
          icon: "heroicons:pencil-square",
        },
        {
          name: row.is_active ? "deactivate" : "activate",
          icon: row.is_active
            ? "heroicons-outline:eye-off"
            : "heroicons-outline:check-circle",
        },
      ];
    },

    handleAction(name, row) {
      if (this.updatingIds.includes(row.id)) return;

      switch (name) {
        case "view":
          this.$router.push({
          name: "market-campuses-view",
          params: { slug: row.slug },
        });
          break;
        case "edit":
          this.$router.push({
            name: "market-campuses-edit",
            params: { slug: row.slug },
          });
          break;

        case "activate":
        case "deactivate":
          this.toggleCampus(row);
          break;
      }
    },

    async toggleCampus(row) {
      if (this.updatingIds.includes(row.id)) return;

      this.updatingIds.push(row.id);

      try {
        const { data } = await api.patch(
          `/market/campuses/${row.slug}/`,
          { is_active: !row.is_active }
        );

        const campus = this.campuses.find(
          (item) => item.id === row.id
        );

        if (campus) {
          Object.assign(campus, data);
        }

        pushSuccess(
          `Campus ${data.is_active ? "activated" : "deactivated"}.`
        );
      } catch (err) {
        pushError(
          extractGeneralError(err) || "Could not update campus."
        );
      } finally {
        this.updatingIds = this.updatingIds.filter(
          (id) => id !== row.id
        );
      }
    },
  },

};
</script>
