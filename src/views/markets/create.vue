<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Add Market</h6>
      </header>
      <div class="px-6 pt-6">
        <div class="flex items-center max-w-xs mx-auto mb-2">
          <div class="flex flex-col items-center">
            <div
              class="h-10 w-10 rounded-full flex items-center justify-center text-base font-medium ring-1 ring-slate-900 dark:ring-slate-700"
              :class="step >= 1 ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-300'"
            >
              <span v-if="step > 1" class="text-xl"><Icon icon="bx:check-double" /></span>
              <span v-else>1</span>
            </div>
            <span class="text-sm mt-1 text-slate-600 dark:text-slate-300">Market</span>
          </div>
          <div class="flex-1 h-[2px] mx-3 mb-6" :class="step > 1 ? 'bg-slate-900 dark:bg-slate-900' : 'bg-[#E0EAFF] dark:bg-slate-600'"></div>
          <div class="flex flex-col items-center">
            <div
              class="h-10 w-10 rounded-full flex items-center justify-center text-base font-medium ring-1 ring-slate-900 ring-opacity-70 dark:ring-slate-700"
              :class="step >= 2 ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-300'"
            >
              2
            </div>
            <span class="text-sm mt-1 text-slate-600 dark:text-slate-300">Details</span>
          </div>
        </div>
      </div>

      <div class="p-6">
        <form v-if="step === 1" @submit.prevent="submitMarket" novalidate>
          <div class="lg:grid-cols-3 md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Title"
              type="text"
              placeholder="Will it rain tomorrow?"
              name="title"
              v-model="title"
              :error="fieldErrors.title"
              classInput="h-[48px]"
            />
            <div>
              <label class="input-label" for="category">Category</label>
              <select
                id="category"
                v-model="category"
                class="input-control w-full h-[48px]"
                :class="fieldErrors.category ? 'border-danger-500' : ''"
              >
                <option value="" disabled>Select a category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <div v-if="fieldErrors.category" class="text-danger-500 text-sm mt-1">{{ fieldErrors.category }}</div>
            </div>
            <Textinput
              label="Opens at"
              type="datetime-local"
              name="open_at"
              v-model="openAt"
              :min="minDateTime"
              :error="fieldErrors.open_at"
              classInput="h-[48px]"
              @click="clearFieldError('open_at')"
            />
            <Textinput
              label="Closes at"
              type="datetime-local"
              name="close_at"
              v-model="closeAt"
              :min="openAt || minDateTime"
              :error="fieldErrors.close_at"
              classInput="h-[48px]"
              @click="clearFieldError('close_at')"
            />
            <Textinput
              label="Resolution date"
              type="datetime-local"
              name="resolution_date"
              v-model="resolutionDate"
              :min="closeAt || openAt || minDateTime"
              :error="fieldErrors.resolution_date"
              classInput="h-[48px]"
              @click="clearFieldError('resolution_date')"
            />
          </div>

          <div class="mb-5">
            <Textarea
              label="Description"
              name="description"
              placeholder="What resolves this market, and how?"
              v-model="description"
              :error="fieldErrors.description"
              :rows="4"
            />
          </div>

          <div v-if="errorMessage" class="text-danger-500 text-sm mb-5">{{ errorMessage }}</div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'markets' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button text="Next" btnClass="btn-dark" type="submit" :isDisabled="loading" :isLoading="loading" />
          </div>
        </form>

        <form v-else @submit.prevent="submitDetails" novalidate>
          <div class="lg:grid-cols-3 md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Yes probability (0–1)"
              type="number"
              name="yes_probability"
              v-model="yesProbability"
              :error="detailErrors.yes_probability"
              step="0.0001"
              min="0"
              max="1"
              classInput="h-[48px]"
            />
            <Textinput
              label="No probability"
              type="text"
              name="no_probability"
              :modelValue="noProbabilityPreview"
              disabled
              classInput="h-[48px]"
            />
            <Textinput
              label="Contract payout (KES)"
              type="number"
              name="contract_payout"
              v-model="contractPayout"
              :error="detailErrors.contract_payout"
              step="0.01"
              min="0"
              classInput="h-[48px]"
            />
            <Textinput
              label="Liquidity (KES)"
              type="number"
              name="liquidity"
              v-model="liquidity"
              :error="detailErrors.liquidity"
              step="0.01"
              min="0.01"
              classInput="h-[48px]"
            />
          </div>

          <div v-if="detailsErrorMessage" class="text-danger-500 text-sm mb-5">{{ detailsErrorMessage }}</div>

          <div class="flex justify-between">
            <Button
              text="Back"
              btnClass="btn-outline-dark"
              type="button"
              :isDisabled="backLoading"
              :isLoading="backLoading"
              @click="goBack"
            />
            <div>
              <a href="#" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3" @click.prevent="skipDetails">Skip</a>
              <Button text="Finish" btnClass="btn-dark" type="submit" :isDisabled="detailsLoading" :isLoading="detailsLoading" />
            </div>
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import Textarea from "@/components/Textarea";
import Button from "@/components/Button";
import Icon from "@/components/Icon";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/lib/api";

function extractFieldErrors(err) {
  const data = err?.response?.data;
  if (!data || typeof data !== "object") return {};
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "non_field_errors" || key === "detail") continue;
    fields[key] = Array.isArray(value) ? value.join(" ") : String(value);
  }
  return fields;
}

function extractGeneralError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.non_field_errors) return data.non_field_errors.join(" ");
  if (data.detail) return data.detail;
  return "";
}

// Format a Date as the "YYYY-MM-DDTHH:mm" string datetime-local inputs expect
// for their value/min/max attributes (local time, not UTC).
function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default {
  components: { Card, Textinput, Textarea, Button, Icon },
  setup() {
    const toast = useToast();
    const router = useRouter();
    return { toast, router };
  },
  data() {
    return {
      step: 1,
      createdMarketId: null,

      title: "",
      description: "",
      category: "",
      resolutionDate: "",
      openAt: "",
      closeAt: "",
      // fixed at component creation — good enough for a form that's filled out in one sitting
      minDateTime: toDateTimeLocal(new Date()),
      categories: [],
      loading: false,
      backLoading: false,
      errorMessage: "",
      fieldErrors: {},

      yesProbability: "0.5",
      contractPayout: "1.00",
      liquidity: "",
      detailsLoading: false,
      detailsErrorMessage: "",
      detailErrors: {},
    };
  },
  computed: {
    noProbabilityPreview() {
      const yes = Number(this.yesProbability);
      if (Number.isNaN(yes)) return "—";
      return (1 - yes).toFixed(4);
    },
  },
  watch: {
    title() {
      this.clearFieldError("title");
    },
    category() {
      this.clearFieldError("category");
    },
    resolutionDate() {
      this.clearFieldError("resolution_date");
    },
    openAt() {
      this.clearFieldError("open_at");
    },
    closeAt() {
      this.clearFieldError("close_at");
    },
    description() {
      this.clearFieldError("description");
    },
    yesProbability() {
      this.clearDetailError("yes_probability");
    },
    contractPayout() {
      this.clearDetailError("contract_payout");
    },
    liquidity() {
      this.clearDetailError("liquidity");
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = data;
    } catch {
      this.errorMessage = "Could not load categories. Please refresh and try again.";
    }
  },
  methods: {
    clearFieldError(name) {
      if (this.fieldErrors[name]) {
        delete this.fieldErrors[name];
      }
    },
    clearDetailError(name) {
      if (this.detailErrors[name]) {
        delete this.detailErrors[name];
      }
    },
    validateRequired() {
      const errors = {};
      if (!this.title.trim()) errors.title = "This field is required.";
      if (!this.category) errors.category = "This field is required.";
      if (!this.resolutionDate) errors.resolution_date = "This field is required.";
      if (!this.openAt) errors.open_at = "This field is required.";
      if (!this.closeAt) errors.close_at = "This field is required.";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    // Backstop for validateRequired()'s min attribute — some browsers don't
    // enforce datetime-local's min against a manually-typed value.
    validateNotBackdated() {
      // datetime-local only carries minute precision, so compare against the
      // start of the current minute — otherwise a value equal to "now" as
      // shown in the picker fails the instant a few seconds tick by.
      const now = new Date();
      now.setSeconds(0, 0);
      const errors = {};
      if (this.resolutionDate && new Date(this.resolutionDate) < now) {
        errors.resolution_date = "Resolution date can't be in the past.";
      }
      if (this.openAt && new Date(this.openAt) < now) {
        errors.open_at = "Opening time can't be in the past.";
      }
      if (this.closeAt && new Date(this.closeAt) < now) {
        errors.close_at = "Closing time can't be in the past.";
      }
      if (Object.keys(errors).length > 0) {
        this.fieldErrors = { ...this.fieldErrors, ...errors };
        return false;
      }
      return true;
    },
    // opens_at <= closes_at <= resolution_date, matching the order the fields
    // are laid out in — backed by the same rule server-side.
    validateDateOrder() {
      const errors = {};
      const open = this.openAt ? new Date(this.openAt) : null;
      const close = this.closeAt ? new Date(this.closeAt) : null;
      const resolution = this.resolutionDate ? new Date(this.resolutionDate) : null;
      if (open && close && open > close) {
        errors.open_at = "Opening time can't be after the closing time.";
      }
      if (open && resolution && open > resolution) {
        errors.open_at = errors.open_at || "Opening time can't be after the resolution date.";
      }
      if (close && resolution && close > resolution) {
        errors.close_at = "Closing time can't be after the resolution date.";
      }
      if (Object.keys(errors).length > 0) {
        this.fieldErrors = { ...this.fieldErrors, ...errors };
        return false;
      }
      return true;
    },
    async submitMarket() {
      this.errorMessage = "";
      if (!this.validateRequired()) return;
      if (!this.validateNotBackdated()) return;
      if (!this.validateDateOrder()) return;

      this.loading = true;
      try {
        const payload = {
          title: this.title.trim(),
          description: this.description.trim(),
          category: this.category,
          resolution_date: new Date(this.resolutionDate).toISOString(),
          open_at: new Date(this.openAt).toISOString(),
          close_at: new Date(this.closeAt).toISOString(),
        };
        // Once step 1 has already created the market (e.g. after coming back
        // from step 2), re-submitting updates that same market instead of
        // creating a second one.
        const { data } = this.createdMarketId
          ? await api.patch(`/market/${this.createdMarketId}/`, payload)
          : await api.post("/market/", payload);
        this.createdMarketId = data.id;
        this.step = 2;
      } catch (err) {
        this.fieldErrors = extractFieldErrors(err);
        this.errorMessage = extractGeneralError(err);
      } finally {
        this.loading = false;
      }
    },
    async goBack() {
      this.errorMessage = "";
      this.backLoading = true;
      try {
        const { data } = await api.get(`/market/${this.createdMarketId}/`);
        this.title = data.title;
        this.description = data.description || "";
        this.category = data.category;
        this.resolutionDate = toDateTimeLocal(new Date(data.resolution_date));
        this.openAt = toDateTimeLocal(new Date(data.open_at));
        this.closeAt = toDateTimeLocal(new Date(data.close_at));
        this.step = 1;
      } catch (err) {
        this.detailsErrorMessage = extractGeneralError(err);
      } finally {
        this.backLoading = false;
      }
    },
    async submitDetails() {
      this.detailsErrorMessage = "";
      // Liquidity is deducted from the platform wallet on create, so unlike
      // yes_probability/contract_payout it can't fall back to a model default.
      if (!this.liquidity || Number(this.liquidity) < 0.01) {
        this.detailErrors = { liquidity: "Liquidity is required and must be at least 0.01." };
        return;
      }

      this.detailsLoading = true;
      try {
        await api.post(`/market/${this.createdMarketId}/details/`, {
          yes_probability: this.yesProbability,
          contract_payout: this.contractPayout,
          liquidity: this.liquidity,
        });
        this.toast.success("Market created successfully", { timeout: 2000 });
        this.router.push({ name: "markets" });
      } catch (err) {
        this.detailErrors = extractFieldErrors(err);
        this.detailsErrorMessage = extractGeneralError(err);
      } finally {
        this.detailsLoading = false;
      }
    },
    skipDetails() {
      this.toast.success("Market created successfully", { timeout: 2000 });
      this.router.push({ name: "markets" });
    },
  },
};
</script>
