<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">{{ isEdit ? "Edit Combo" : "Create Combo" }}</h6>
      </header>
      <div class="p-6">
        <form @submit.prevent="submit" novalidate>
          <div class="mb-5">
            <Textinput
              label="Title"
              type="text"
              placeholder="Weekend Football Treble"
              name="title"
              v-model="title"
              :error="fieldErrors.title"
              classInput="h-[48px]"
            />
          </div>

          <div class="mb-5 combo-market-select">
            <VueSelect
              label="Markets"
              name="markets"
              :error="fieldErrors.markets"
              description="Only published, open markets that haven't passed their closing date are listed."
            >
              <vSelect
                v-model="selectedMarkets"
                :options="marketOptions"
                label="title"
                multiple
                :loading="marketsLoading"
                :placeholder="marketsLoading ? 'Loading markets…' : 'Search and select markets'"
              >
                <template #option="market">
                  <div class="flex justify-between items-center gap-3">
                    <span>{{ market.title }}</span>
                    <span class="text-xs text-slate-400 whitespace-nowrap">Closes {{ formatDate(market.close_at) }}</span>
                  </div>
                </template>
                <template #no-options>No eligible markets.</template>
              </vSelect>
            </VueSelect>
          </div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'market-combos' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button
              :text="isEdit ? 'Save changes' : 'Create combo'"
              btnClass="btn-dark"
              type="submit"
              :isDisabled="loading || comboLoading"
              :isLoading="loading"
            />
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import Button from "@/components/Button";
import VueSelect from "@/components/Select/VueSelect";
import vSelect from "vue-select";
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError, extractFieldErrors, extractGeneralError } from "@/lib/errors";

export default {
  components: { Card, Textinput, Button, VueSelect, vSelect },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      title: "",
      selectedMarkets: [],
      marketOptions: [],
      marketsLoading: true,
      comboLoading: false,
      // What the server already has. Saving diffs the form against these, so a
      // failed save can be retried without creating a duplicate combo or re-adding
      // markets that already went through — and edit mode only sends what changed.
      comboId: null,
      savedTitle: "",
      savedMarketIds: [],
      loading: false,
      fieldErrors: {},
    };
  },
  computed: {
    isEdit() {
      return this.$route.name === "market-combos-edit";
    },
  },
  watch: {
    title() {
      this.clearFieldError("title");
    },
    selectedMarkets() {
      this.clearFieldError("markets");
    },
  },
  async mounted() {
    if (this.isEdit) this.loadCombo();
    try {
      const { data } = await api.get("/market/combos/eligible-markets/");
      this.marketOptions = data;
    } catch (err) {
      pushError(extractError(err));
    } finally {
      this.marketsLoading = false;
    }
  },
  methods: {
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
    clearFieldError(name) {
      if (this.fieldErrors[name]) {
        delete this.fieldErrors[name];
      }
    },
    async loadCombo() {
      this.comboLoading = true;
      try {
        const { data } = await api.get(`/market/combos/${this.$route.params.id}/`);
        if (data.status !== "draft") {
          pushError("Published combos can no longer be edited.");
          this.router.replace({ name: "market-combos" });
          return;
        }
        this.comboId = data.id;
        this.title = data.title;
        this.savedTitle = data.title;
        // Shaped like the eligible-market options so the picker treats them the same
        // (a leg that has since closed still shows, so it can be removed).
        this.selectedMarkets = data.items.map((item) => ({ id: item.market, title: item.market_title }));
        this.savedMarketIds = data.items.map((item) => item.market);
      } catch (err) {
        pushError(extractGeneralError(err) || "Could not load this combo.");
        this.router.replace({ name: "market-combos" });
      } finally {
        this.comboLoading = false;
      }
    },
    validateRequired() {
      const errors = {};
      if (!this.title.trim()) errors.title = "This field is required.";
      if (this.selectedMarkets.length === 0) errors.markets = "Select at least one market.";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      if (!this.validateRequired()) return;

      const title = this.title.trim();
      const selectedIds = this.selectedMarkets.map((market) => market.id);
      this.loading = true;
      try {
        if (!this.comboId) {
          const { data } = await api.post("/market/combos/", { title });
          this.comboId = data.id;
          this.savedTitle = data.title;
        } else if (title !== this.savedTitle) {
          await api.patch(`/market/combos/${this.comboId}/`, { title });
          this.savedTitle = title;
        }

        const added = selectedIds.filter((id) => !this.savedMarketIds.includes(id));
        if (added.length > 0) {
          await api.post(`/market/combos/${this.comboId}/items/`, { markets: added });
          this.savedMarketIds = [...this.savedMarketIds, ...added];
        }
        for (const id of this.savedMarketIds.filter((saved) => !selectedIds.includes(saved))) {
          await api.delete(`/market/combos/${this.comboId}/items/${id}/`);
          this.savedMarketIds = this.savedMarketIds.filter((saved) => saved !== id);
        }

        pushSuccess(this.isEdit ? "Combo updated successfully." : "Combo created successfully.");
        this.router.push({ name: "market-combos" });
      } catch (err) {
        this.fieldErrors = extractFieldErrors(err);
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
// VueSelect capitalizes every option/chip, which would rewrite market titles.
.combo-market-select :deep(.vs__dropdown-menu li),
.combo-market-select :deep(.vs__selected-options) {
  text-transform: none;
}
</style>
