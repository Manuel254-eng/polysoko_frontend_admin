<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3"><button class="btn btn-outline-dark btn-sm" @click="$router.push({ name: 'market-campuses' })">← Campuses</button><h5 class="mb-0">Campus details</h5></div>
    <div v-if="loading" class="text-slate-500 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
    <template v-else>
      <Card noborder><div class="flex flex-col md:flex-row gap-5 items-start"><img v-if="campus.logo" :src="campus.logo" :alt="`${campus.name} logo`" class="w-28 h-28 object-contain rounded border border-slate-200 dark:border-slate-700" /><div class="flex-1"><div class="flex flex-wrap items-center gap-3"><h4 class="text-xl font-semibold text-slate-900 dark:text-white">{{ campus.name }}</h4><span class="px-3 py-1 rounded-full text-xs" :class="campus.is_active ? 'text-success-500 bg-success-500 bg-opacity-25' : 'text-warning-500 bg-warning-500 bg-opacity-25'">{{ campus.is_active ? 'Active' : 'Inactive' }}</span></div><p class="text-sm text-slate-500 mt-2">{{ campus.location || 'Location not set' }} · /{{ campus.slug }}</p><p v-if="campus.description" class="text-sm text-slate-600 dark:text-slate-300 mt-4 whitespace-pre-line">{{ campus.description }}</p></div><router-link :to="{ name: 'markets-create' }" class="btn btn-dark btn-sm whitespace-nowrap">Create market</router-link></div></Card>
      <Card noborder><div class="flex justify-between items-center pb-5"><h5>Campus markets</h5><span class="text-sm text-slate-500">{{ markets.length }} markets</span></div><div v-if="markets.length === 0" class="text-slate-500 text-sm py-8 text-center">No markets belong to this campus yet.</div><vue-good-table v-else :columns="columns" :rows="marketRows" styleClass="vgt-table bordered centered" :pagination-options="{ enabled: true, perPage: 10 }"><template #table-row="props"><span v-if="props.column.field === 'title'" class="text-slate-600 dark:text-slate-300 font-medium">{{ props.row.title }}</span><span v-else-if="props.column.field === 'status'" class="capitalize">{{ props.row.status }}</span><span v-else-if="props.column.field === 'is_published'" :class="props.row.is_published ? 'text-success-500' : 'text-warning-500'">{{ props.row.is_published ? 'Published' : 'Draft' }}</span><router-link v-else-if="props.column.field === 'action'" :to="{ name: 'market-details', params: { id: props.row.id } }" class="text-primary-500 hover:underline">View market</router-link><span v-else>{{ props.formattedRow[props.column.field] || '—' }}</span></template></vue-good-table></Card>
    </template>
  </div>
</template>

<script>
import Card from "@/components/Card";
import api from "@/lib/api";
import { extractGeneralError } from "@/lib/errors";
export default {
  components: { Card },
  data: () => ({ campus: null, markets: [], categoryNames: {}, loading: true, errorMessage: "", columns: [{ label: "Title", field: "title" }, { label: "Category", field: "category" }, { label: "Status", field: "status" }, { label: "Published", field: "is_published" }, { label: "Resolution date", field: "resolution_date" }, { label: "Action", field: "action", sortable: false }] }),
  computed: { marketRows() { return this.markets.map((market) => ({ ...market, category: this.categoryNames[market.category] || "—", resolution_date: new Date(market.resolution_date).toLocaleString() })); } },
  async mounted() { try { const [{ data: campus }, { data: marketData }, { data: categories }] = await Promise.all([api.get(`/market/campuses/${this.$route.params.slug}/`), api.get("/market/", { params: { campus: this.$route.params.slug, page_size: 100 } }), api.get("/market/categories/")]); this.campus = campus; this.markets = marketData.results || marketData; this.categoryNames = Object.fromEntries(categories.map((item) => [item.id, item.name])); } catch (err) { this.errorMessage = extractGeneralError(err) || "Could not load campus details."; } finally { this.loading = false; } },
};
</script>
