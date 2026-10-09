<template>
  <div class="grid xl:grid-cols-[minmax(0,1fr)_340px] grid-cols-1 gap-5 items-start">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">{{ isEdit ? "Edit Jackpot" : "Create Jackpot" }}</h6>
      </header>
      <div class="p-6">
        <form @submit.prevent="submit" novalidate>
          <div class="lg:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Title"
              type="text"
              placeholder="Weekend Mega Jackpot"
              name="title"
              v-model="title"
              :error="fieldErrors.title"
              classInput="h-[48px]"
            />
            <Textinput
              label="Number of markets"
              type="number"
              placeholder="13"
              name="market_count"
              v-model="marketCount"
              :error="fieldErrors.market_count"
              min="2"
              classInput="h-[48px]"
            />
            <Textinput
              label="Entry fee per ticket (KES)"
              name="entry_fee"
              v-model="entryFee"
              :error="fieldErrors.entry_fee"
              isMask
              :options="AMOUNT_MASK"
              placeholder="50"
              classInput="h-[48px]"
            />
            <Textinput
              label="Prize for every pick right (KES)"
              name="prize_amount"
              v-model="prizeAmount"
              :error="fieldErrors.prize_amount"
              isMask
              :options="AMOUNT_MASK"
              placeholder="1,000,000"
              classInput="h-[48px]"
            />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-5">
            Prizes are pools — shared equally by every winning ticket. A pool nobody wins stays with the platform.
          </p>

          <div class="mb-5 jackpot-market-select">
            <VueSelect
              label="Markets"
              name="markets"
              :error="fieldErrors.markets"
              :description="marketsDescription"
            >
              <vSelect
                v-model="selectedMarkets"
                :options="marketOptions"
                :selectable="() => selectedMarkets.length < marketCountNumber"
                label="title"
                multiple
                :loading="marketsLoading"
                :placeholder="marketsLoading ? 'Loading markets…' : 'Search and select markets'"
              >
                <template #option="market">
                  <div class="flex justify-between items-center gap-3">
                    <span>
                      {{ market.title }}
                      <span v-if="market.is_jackpot_only" class="text-xs text-warning-500 ml-1">Jackpot only</span>
                    </span>
                    <span class="text-xs text-slate-400 whitespace-nowrap">Closes {{ formatDate(market.close_at) }}</span>
                  </div>
                </template>
                <template #no-options>No eligible markets.</template>
              </vSelect>
            </VueSelect>
          </div>

          <div class="mb-5">
            <Checkbox v-model="allowPartialWins" :checked="allowPartialWins" label="Allow partial wins" name="allow_partial_wins" />
            <span class="block text-secondary-500 font-light leading-4 text-xs mt-2">
              Off means all-or-nothing. On, tickets that get some picks wrong can still win a smaller pool per tier below.
            </span>
          </div>

          <div v-if="allowPartialWins" class="mb-5">
            <label class="input-label">Prize tiers</label>
            <div v-for="(tier, index) in tiers" :key="index" class="flex items-start gap-3 mb-3">
              <div class="w-44">
                <Textinput
                  type="number"
                  placeholder="Correct picks"
                  :name="`tier_picks_${index}`"
                  v-model="tier.correct_picks"
                  min="1"
                  classInput="h-[48px]"
                />
              </div>
              <div class="flex-1">
                <Textinput
                  placeholder="Pool for this tier (KES)"
                  :name="`tier_amount_${index}`"
                  v-model="tier.prize_amount"
                  isMask
                  :options="AMOUNT_MASK"
                  classInput="h-[48px]"
                />
              </div>
              <button
                type="button"
                class="h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center rounded text-danger-500 border border-danger-500 border-opacity-30 hover:bg-danger-500 hover:bg-opacity-10"
                @click="tiers.splice(index, 1)"
              >
                <Icon icon="heroicons-outline:trash" />
              </button>
            </div>
            <div v-if="fieldErrors.tiers" class="text-danger-500 text-sm mb-3">{{ fieldErrors.tiers }}</div>
            <button
              type="button"
              class="btn btn-outline-dark btn-sm inline-flex items-center gap-1"
              @click="tiers.push({ correct_picks: '', prize_amount: '' })"
            >
              <Icon icon="heroicons-outline:plus" /> Add tier
            </button>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Each tier is for fewer correct picks than the number of markets — getting them all right pays the main prize.
            </p>
          </div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'market-jackpots' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button
              :text="isEdit ? 'Save changes' : 'Create jackpot'"
              btnClass="btn-dark"
              type="submit"
              :isDisabled="loading || jackpotLoading"
              :isLoading="loading"
            />
          </div>
        </form>
      </div>
    </Card>

    <div class="xl:sticky xl:top-24">
      <div class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium text-center mb-3">
        Player preview
      </div>
      <PhonePreview
        :title="title"
        :code="code"
        :entry-fee="entryFee"
        :prize-amount="prizeAmount"
        :market-count="marketCount"
        :allow-partial-wins="allowPartialWins"
        :tiers="tiers"
        :markets="selectedMarkets"
      />
    </div>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import Button from "@/components/Button";
import Checkbox from "@/components/Checkbox";
import Icon from "@/components/Icon";
import VueSelect from "@/components/Select/VueSelect";
import PhonePreview from "./PhonePreview.vue";
import vSelect from "vue-select";
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError, extractFieldErrors, extractGeneralError } from "@/lib/errors";
import { AMOUNT_MASK } from "@/constant/masks";

// The details a jackpot is saved with — compared against what the server
// already has so an edit only sends what changed.
function detailsPayload(form) {
  return {
    title: form.title.trim(),
    market_count: Number(form.marketCount),
    entry_fee: form.entryFee,
    prize_amount: form.prizeAmount,
    allow_partial_wins: form.allowPartialWins,
  };
}

function tiersPayload(tiers) {
  return tiers
    .map((tier) => ({ correct_picks: Number(tier.correct_picks), prize_amount: String(tier.prize_amount) }))
    .sort((a, b) => b.correct_picks - a.correct_picks);
}

export default {
  components: { Card, Textinput, Button, Checkbox, Icon, VueSelect, vSelect, PhonePreview },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      AMOUNT_MASK,
      title: "",
      // Only known once saved — the preview shows a placeholder until then.
      code: "",
      marketCount: "",
      entryFee: "",
      prizeAmount: "",
      allowPartialWins: false,
      tiers: [],
      selectedMarkets: [],
      marketOptions: [],
      marketsLoading: true,
      jackpotLoading: false,
      // What the server already has. Saving diffs the form against these, so a
      // failed save can be retried without creating a duplicate jackpot, and
      // an edit only sends what changed.
      jackpotId: null,
      savedDetails: null,
      savedTiers: [],
      savedMarketIds: [],
      loading: false,
      fieldErrors: {},
    };
  },
  computed: {
    isEdit() {
      return this.$route.name === "market-jackpots-edit";
    },
    marketCountNumber() {
      return Number(this.marketCount) || 0;
    },
    marketsDescription() {
      const count = this.marketCountNumber;
      if (!count) return "Set the number of markets first. Only published, open, non-combo-only markets are listed.";
      return `${this.selectedMarkets.length} of ${count} selected. Only published, open, non-combo-only markets are listed.`;
    },
  },
  watch: {
    title() {
      this.clearFieldError("title");
    },
    marketCount() {
      this.clearFieldError("market_count");
    },
    entryFee() {
      this.clearFieldError("entry_fee");
    },
    prizeAmount() {
      this.clearFieldError("prize_amount");
    },
    selectedMarkets() {
      this.clearFieldError("markets");
    },
    tiers: {
      deep: true,
      handler() {
        this.clearFieldError("tiers");
      },
    },
  },
  async mounted() {
    if (this.isEdit) this.loadJackpot();
    try {
      const { data } = await api.get("/market/jackpots/eligible-markets/");
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
    async loadJackpot() {
      this.jackpotLoading = true;
      try {
        const { data } = await api.get(`/market/jackpots/${this.$route.params.id}/`);
        if (data.status !== "draft") {
          pushError("Published jackpots can no longer be edited.");
          this.router.replace({ name: "market-jackpots" });
          return;
        }
        this.jackpotId = data.id;
        this.code = data.code;
        this.title = data.title;
        this.marketCount = String(data.market_count);
        this.entryFee = String(Number(data.entry_fee));
        this.prizeAmount = String(Number(data.prize_amount));
        this.allowPartialWins = data.allow_partial_wins;
        this.tiers = data.prize_tiers.map((tier) => ({
          correct_picks: String(tier.correct_picks),
          prize_amount: String(Number(tier.prize_amount)),
        }));
        // Shaped like the eligible-market options so the picker treats them the
        // same (a market that has since closed still shows, so it can be removed).
        this.selectedMarkets = data.items.map((item) => ({
          id: item.market,
          title: item.market_title,
          category_name: item.market_category_name,
          is_jackpot_only: item.market_is_jackpot_only,
          is_custom: item.market_is_custom,
          choice_labels: item.market_choice_labels,
          close_at: item.market_close_at,
        }));
        this.savedMarketIds = data.items.map((item) => item.market);
        this.savedDetails = detailsPayload(this);
        this.savedTiers = tiersPayload(this.tiers);
      } catch (err) {
        pushError(extractGeneralError(err) || "Could not load this jackpot.");
        this.router.replace({ name: "market-jackpots" });
      } finally {
        this.jackpotLoading = false;
      }
    },
    validate() {
      const errors = {};
      if (!this.title.trim()) errors.title = "This field is required.";
      if (!Number.isInteger(Number(this.marketCount)) || Number(this.marketCount) < 2) {
        errors.market_count = "A jackpot needs at least 2 markets.";
      }
      if (!(Number(this.entryFee) >= 1)) errors.entry_fee = "Enter an entry fee of at least KES 1.";
      if (!(Number(this.prizeAmount) >= 1)) errors.prize_amount = "Enter a prize of at least KES 1.";
      if (this.selectedMarkets.length > this.marketCountNumber) {
        errors.markets = `Select at most ${this.marketCountNumber} markets, or raise the number of markets.`;
      }
      if (this.allowPartialWins) {
        const picks = this.tiers.map((tier) => Number(tier.correct_picks));
        if (this.tiers.some((tier) => !(Number(tier.prize_amount) >= 1))) {
          errors.tiers = "Every tier needs a pool of at least KES 1.";
        } else if (picks.some((p) => !Number.isInteger(p) || p < 1 || p >= this.marketCountNumber)) {
          errors.tiers = `Correct picks must be between 1 and ${this.marketCountNumber - 1}.`;
        } else if (new Set(picks).size !== picks.length) {
          errors.tiers = "Each number of correct picks can only have one tier.";
        }
      }
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    async saveDetails(details) {
      const changed = Object.fromEntries(
        Object.entries(details).filter(([key, value]) => String(value) !== String(this.savedDetails[key])),
      );
      if (Object.keys(changed).length === 0) return;
      await api.patch(`/market/jackpots/${this.jackpotId}/`, changed);
      this.savedDetails = details;
    },
    async saveTiers(tiers) {
      if (JSON.stringify(tiers) === JSON.stringify(this.savedTiers)) return;
      await api.put(`/market/jackpots/${this.jackpotId}/prize-tiers/`, { tiers });
      this.savedTiers = tiers;
    },
    async submit() {
      if (!this.validate()) return;

      const details = detailsPayload(this);
      // With partial wins off the tiers aren't used, so they're left as they are.
      const tiers = this.allowPartialWins ? tiersPayload(this.tiers) : this.savedTiers;
      const selectedIds = this.selectedMarkets.map((market) => market.id);
      this.loading = true;
      try {
        if (!this.jackpotId) {
          const { data } = await api.post("/market/jackpots/", details);
          this.jackpotId = data.id;
          this.code = data.code;
          this.savedDetails = details;
        }

        // Removals first, and tiers before details when the count is going
        // down — the backend won't lower market_count below the markets or
        // tiers a jackpot still has.
        for (const id of this.savedMarketIds.filter((saved) => !selectedIds.includes(saved))) {
          await api.delete(`/market/jackpots/${this.jackpotId}/items/${id}/`);
          this.savedMarketIds = this.savedMarketIds.filter((saved) => saved !== id);
        }
        if (details.market_count < this.savedDetails.market_count) {
          await this.saveTiers(tiers);
          await this.saveDetails(details);
        } else {
          await this.saveDetails(details);
          await this.saveTiers(tiers);
        }

        const added = selectedIds.filter((id) => !this.savedMarketIds.includes(id));
        if (added.length > 0) {
          await api.post(`/market/jackpots/${this.jackpotId}/items/`, { markets: added });
          this.savedMarketIds = [...this.savedMarketIds, ...added];
        }

        pushSuccess(this.isEdit ? "Jackpot updated successfully." : "Jackpot created successfully.");
        this.router.push({ name: "market-jackpots-view", params: { id: this.jackpotId } });
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
.jackpot-market-select :deep(.vs__dropdown-menu li),
.jackpot-market-select :deep(.vs__selected-options) {
  text-transform: none;
}
</style>
