<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Users</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link :to="{ name: 'users-create' }" class="btn btn-dark btn-sm whitespace-nowrap">
            Add user
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
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
              class="w-7 h-7 rounded-full ltr:mr-3 rtl:ml-3 flex-none bg-slate-900 text-white dark:bg-slate-700 flex items-center justify-center text-xs font-medium uppercase"
            >
              {{ props.row.initials }}
            </span>
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ props.row.name }}</span>
          </span>
          <span v-else-if="props.column.field === 'is_active'" class="block w-full">
            <span
              class="inline-block px-3 min-w-[80px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25"
              :class="props.row.is_active ? 'text-success-500 bg-success-500' : 'text-danger-500 bg-danger-500'"
            >
              {{ props.row.is_active ? "Active" : "Inactive" }}
            </span>
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
              :pageRange="pageRange"
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
import { extractError } from "@/lib/errors";

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

export default {
  components: { Card, InputGroup, Dropdown, Icon, Pagination, MenuItem },
  data() {
    return {
      loading: true,
      errorMessage: "",
      users: [],
      roles: [],
      searchTerm: "",
      current: 1,
      perPage: 10,
      pageRange: 2,
      perPageOptions: [
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "25", label: "25" },
      ],
      actions: [
        { name: "view", icon: "heroicons-outline:eye" },
        { name: "edit", icon: "heroicons:pencil-square" },
        { name: "delete", icon: "heroicons-outline:trash" },
      ],
      columns: [
        { label: "Name", field: "name" },
        { label: "Phone number", field: "phone" },
        { label: "Email", field: "email" },
        { label: "Role", field: "role" },
        { label: "Status", field: "is_active" },
        { label: "Action", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    roleNameById() {
      return Object.fromEntries(this.roles.map((role) => [role.id, role.name]));
    },
    rows() {
      return this.users.map((user) => {
        const name = [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || "—";
        return {
          id: user.id,
          name,
          initials: initialsOf(name === "—" ? user.phone_number : name),
          phone: `${user.country_code}${user.phone_number}`,
          email: user.email || "—",
          role: this.roleNameById[user.role] || "—",
          is_active: user.is_active,
        };
      });
    },
  },
  async mounted() {
    try {
      const [usersRes, rolesRes] = await Promise.all([api.get("/user/staff/"), api.get("/rbac/roles/")]);
      this.users = usersRes.data;
      this.roles = rolesRes.data;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
};
</script>
