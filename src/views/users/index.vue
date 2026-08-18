<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Users</h5>
        <router-link :to="{ name: 'users-create' }" class="btn btn-dark btn-sm">
          Add user
        </router-link>
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
        styleClass="vgt-table bordered"
        :sort-options="{ enabled: false }"
      >
        <template v-slot:table-row="props">
          <span v-if="props.column.field === 'is_active'" class="block w-full">
            <span
              class="inline-block px-3 min-w-[80px] text-center py-1 rounded-[999px] bg-opacity-25"
              :class="props.row.is_active ? 'text-success-500 bg-success-500' : 'text-danger-500 bg-danger-500'"
            >
              {{ props.row.is_active ? "Active" : "Inactive" }}
            </span>
          </span>
          <span v-else>{{ props.formattedRow[props.column.field] }}</span>
        </template>
      </vue-good-table>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

export default {
  components: { Card },
  data() {
    return {
      loading: true,
      errorMessage: "",
      users: [],
      roles: [],
      columns: [
        { label: "Name", field: "name" },
        { label: "Phone number", field: "phone" },
        { label: "Email", field: "email" },
        { label: "Role", field: "role" },
        { label: "Status", field: "is_active" },
      ],
    };
  },
  computed: {
    roleNameById() {
      return Object.fromEntries(this.roles.map((role) => [role.id, role.name]));
    },
    rows() {
      return this.users.map((user) => ({
        id: user.id,
        name: [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ") || "—",
        phone: `${user.country_code}${user.phone_number}`,
        email: user.email || "—",
        role: this.roleNameById[user.role] || "—",
        is_active: user.is_active,
      }));
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
