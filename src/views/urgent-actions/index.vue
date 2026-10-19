<template>
  <Card noborder>
    <div class="flex justify-between items-center pb-6">
      <div><h5>Urgent actions</h5><p class="text-sm text-slate-500 mt-1">Markets due for resolution within 24 hours or already overdue.</p></div>
      <button class="btn btn-outline-dark btn-sm" :disabled="loading" @click="loadMarkets">Refresh</button>
    </div>
    <div v-if="loading" class="text-slate-500 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
    <div v-else-if="!markets.length" class="text-slate-500 text-sm py-10 text-center">No markets need resolution attention.</div>
    <vue-good-table v-else :columns="columns" :rows="rows" styleClass="vgt-table bordered centered">
      <template #table-row="props">
        <span v-if="props.column.field === 'status'" class="capitalize">{{ props.row.status }}</span>
        <span v-else-if="props.column.field === 'resolution_date'" :class="props.row.overdue ? 'text-danger-500 font-medium' : ''">{{ props.row.resolution_date }}</span>
        <router-link v-else-if="props.column.field === 'action'" :to="{ name: 'market-details', params: { id: props.row.id } }" class="text-primary-500 hover:underline">Review market</router-link>
        <span v-else>{{ props.formattedRow[props.column.field] || '—' }}</span>
      </template>
    </vue-good-table>
  </Card>
</template>

<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractGeneralError } from "@/lib/errors";

export default {
  components: { Card },
  data: () => ({ markets: [], loading: true, errorMessage: "", columns: [
    { label: "Market", field: "title" }, { label: "Campus", field: "campus" },
    { label: "Status", field: "status" }, { label: "Resolution date", field: "resolution_date" },
    { label: "Action", field: "action", sortable: false },
  ]}),
  computed: {
    rows() { return this.markets.map((market) => ({ ...market, campus: market.campus_name || "General", resolution_date: new Date(market.resolution_date).toLocaleString(), overdue: new Date(market.resolution_date) < new Date() })); },
  },
  async mounted() { await this.loadMarkets(); },
  methods: {
    async loadMarkets() {
      this.loading = true; this.errorMessage = "";
      try { const { data } = await api.get("/market/", { params: { urgent_resolution: true, page_size: 100 } }); this.markets = data.results || data; }
      catch (err) { this.errorMessage = extractGeneralError(err) || "Could not load urgent markets."; }
      finally { this.loading = false; }
    },
  },
};
</script>
