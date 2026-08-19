<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Market Details</h6>
        <router-link :to="{ name: 'markets' }" class="btn btn-outline-dark btn-sm">Back</router-link>
      </header>
      <div class="p-6">
        <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          Loading…
        </div>
        <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
          {{ errorMessage }}
        </div>
        <dl v-else class="grid md:grid-cols-2 grid-cols-1 gap-x-8 gap-y-5">
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Title</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ market.title }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Category</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ categoryName }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Status</dt>
            <dd class="text-slate-700 dark:text-slate-200 capitalize">{{ market.status }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Published</dt>
            <dd>
              <span
                class="inline-block px-3 min-w-[90px] text-center py-1 rounded-[999px] bg-opacity-25"
                :class="market.is_published ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'"
              >
                {{ market.is_published ? "Published" : "Draft" }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Resolution date</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.resolution_date) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Opens at</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.open_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Closes at</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.close_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Last updated</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.updated_at) }}</dd>
          </div>
          <div class="md:col-span-2">
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Description</dt>
            <dd class="text-slate-700 dark:text-slate-200 whitespace-pre-line">{{ market.description || "—" }}</dd>
          </div>
        </dl>
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (err?.response?.status === 404) return "This market could not be found.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

export default {
  components: { Card },
  data() {
    return {
      loading: true,
      errorMessage: "",
      market: {},
      categories: [],
    };
  },
  computed: {
    categoryName() {
      return this.categories.find((c) => c.id === this.market.category)?.name || "—";
    },
  },
  async mounted() {
    try {
      const [marketRes, categoriesRes] = await Promise.all([
        api.get(`/market/${this.$route.params.id}/`),
        api.get("/market/categories/"),
      ]);
      this.market = marketRes.data;
      this.categories = categoriesRes.data;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(value) {
      return value ? new Date(value).toLocaleString() : "—";
    },
  },
};
</script>
