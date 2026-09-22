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
            <div @click="clearFieldError('open_at')">
              <label class="input-label" for="open_at">Opens at</label>
              <flat-pickr
                id="open_at"
                name="open_at"
                v-model="openAt"
                :config="openAtConfig"
                placeholder="Select date and time"
                class="input-control w-full h-[48px]"
              />
              <span v-if="fieldErrors.open_at" class="text-danger-500 block text-sm mt-2">{{ fieldErrors.open_at }}</span>
            </div>
            <div @click="clearFieldError('close_at')">
              <label class="input-label" for="close_at">Closes at</label>
              <flat-pickr
                id="close_at"
                name="close_at"
                v-model="closeAt"
                :config="closeAtConfig"
                placeholder="Select date and time"
                class="input-control w-full h-[48px]"
              />
              <span v-if="fieldErrors.close_at" class="text-danger-500 block text-sm mt-2">{{ fieldErrors.close_at }}</span>
            </div>
            <div @click="clearFieldError('resolution_date')">
              <label class="input-label" for="resolution_date">Resolution date</label>
              <flat-pickr
                id="resolution_date"
                name="resolution_date"
                v-model="resolutionDate"
                :config="resolutionDateConfig"
                placeholder="Select date and time"
                class="input-control w-full h-[48px]"
              />
              <span v-if="fieldErrors.resolution_date" class="text-danger-500 block text-sm mt-2">{{ fieldErrors.resolution_date }}</span>
            </div>
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

          <div class="mb-5">
            <label class="input-label">Market type</label>
            <div class="flex items-center gap-6">
              <Radio v-model="isCustom" name="market-type" :value="false" label="Default (Yes / No)" />
              <Radio v-model="isCustom" name="market-type" :value="true" label="Custom outcomes" />
            </div>
          </div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'markets' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button text="Next" btnClass="btn-dark" type="submit" :isDisabled="loading" :isLoading="loading" />
          </div>
        </form>

        <form v-else @submit.prevent="submitDetails" novalidate>
          <template v-if="!isCustom">
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
                label="Liquidity (KES)"
                type="number"
                name="liquidity"
                v-model="liquidity"
                :error="detailErrors.liquidity"
                step="0.01"
                min="0.01"
                classInput="h-[48px]"
                placeholder="0.01"
              />
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
              A winning share always pays 1 KES, so there's no separate contract payout to set here.
            </p>
          </template>

          <template v-else>
            <div class="lg:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
              <Textinput
                label="Max Loss Budget (KES)"
                type="number"
                name="choice_liquidity"
                v-model="liquidity"
                :error="detailErrors.liquidity"
                step="0.01"
                min="0.01"
                classInput="h-[48px]"
              />
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
              The most the platform can lose across all trading on this market — not order-book depth like a
              binary market's liquidity. Custom markets always pay 1 KES per winning share, so there's no
              separate contract payout to set here.
            </p>

            <div class="mb-3 flex justify-between items-center">
              <label class="input-label mb-0">Choices</label>
              <span
                class="text-sm font-medium"
                :class="Math.abs(choicesTotal - 1) <= 0.001 ? 'text-success-500' : 'text-danger-500'"
              >
                Total: {{ choicesTotal.toFixed(4) }} / 1.0000
              </span>
            </div>

            <div v-for="(choice, index) in choices" :key="index" class="flex items-start gap-3 mb-3">
              <div class="flex-1">
                <Textinput
                  type="text"
                  :placeholder="`Choice ${index + 1} label`"
                  :name="`choice_label_${index}`"
                  v-model="choice.label"
                  :error="choiceErrors[index]?.label"
                  classInput="h-[48px]"
                />
              </div>
              <div class="w-36">
                <Textinput
                  type="number"
                  placeholder="0.0000"
                  :name="`choice_probability_${index}`"
                  v-model="choice.probability"
                  :error="choiceErrors[index]?.probability"
                  step="0.0001"
                  min="0"
                  max="1"
                  classInput="h-[48px]"
                />
              </div>
              <button
                v-if="choices.length > 2"
                type="button"
                class="h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center rounded text-danger-500 border border-danger-500 border-opacity-30 hover:bg-danger-500 hover:bg-opacity-10"
                @click="removeChoice(index)"
              >
                <Icon icon="heroicons-outline:trash" />
              </button>
            </div>

            <button
              type="button"
              class="btn btn-outline-dark btn-sm mb-5 inline-flex items-center gap-1"
              @click="addChoice"
            >
              <Icon icon="heroicons-outline:plus" /> Add choice
            </button>
          </template>

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
              <a v-if="!isCustom" href="#" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3" @click.prevent="skipDetails">Skip</a>
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
import Radio from "@/components/Radio";
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
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
  components: { Card, Textinput, Textarea, Button, Icon, Radio },
  setup() {
    const router = useRouter();
    return { router };
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
      fieldErrors: {},

      isCustom: false,

      yesProbability: "0.5",
      liquidity: "",
      detailsLoading: false,
      detailErrors: {},

      choices: [
        { label: "", probability: "" },
        { label: "", probability: "" },
      ],
      choiceErrors: {},
    };
  },
  computed: {
    // altInput shows the human-readable altFormat text; the underlying
    // v-model value keeps dateFormat so it stays a drop-in for
    // new Date(...)/toDateTimeLocal() elsewhere in this component.
    openAtConfig() {
      return {
        enableTime: true,
        altInput: true,
        // Without allowInput, flatpickr marks the alt input readonly, which
        // triggers this project's own .input-control[readonly] grey styling.
        allowInput: true,
        altInputClass: "input-control w-full h-[48px]",
        altFormat: "M j, Y h:i K",
        dateFormat: "Y-m-d\\TH:i",
        minDate: this.minDateTime,
      };
    },
    closeAtConfig() {
      return {
        enableTime: true,
        altInput: true,
        allowInput: true,
        altInputClass: "input-control w-full h-[48px]",
        altFormat: "M j, Y h:i K",
        dateFormat: "Y-m-d\\TH:i",
        minDate: this.openAt || this.minDateTime,
      };
    },
    resolutionDateConfig() {
      return {
        enableTime: true,
        altInput: true,
        allowInput: true,
        altInputClass: "input-control w-full h-[48px]",
        altFormat: "M j, Y h:i K",
        dateFormat: "Y-m-d\\TH:i",
        minDate: this.closeAt || this.openAt || this.minDateTime,
      };
    },
    noProbabilityPreview() {
      const yes = Number(this.yesProbability);
      if (Number.isNaN(yes)) return "—";
      return (1 - yes).toFixed(4);
    },
    choicesTotal() {
      return this.choices.reduce((sum, choice) => sum + (Number(choice.probability) || 0), 0);
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
    liquidity() {
      this.clearDetailError("liquidity");
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = data;
    } catch {
      pushError("Could not load categories. Please refresh and try again.");
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
          is_custom: this.isCustom,
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
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.loading = false;
      }
    },
    async goBack() {
      this.backLoading = true;
      try {
        const { data } = await api.get(`/market/${this.createdMarketId}/`);
        this.title = data.title;
        this.description = data.description || "";
        this.category = data.category;
        this.resolutionDate = toDateTimeLocal(new Date(data.resolution_date));
        this.openAt = toDateTimeLocal(new Date(data.open_at));
        this.closeAt = toDateTimeLocal(new Date(data.close_at));
        this.isCustom = Boolean(data.is_custom);
        this.step = 1;
      } catch (err) {
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.backLoading = false;
      }
    },
    async submitDetails() {
      if (this.isCustom) {
        await this.submitChoices();
        return;
      }

      // Liquidity is deducted from the platform wallet on create, so unlike
      // yes_probability it can't fall back to a model default.
      if (!this.liquidity || Number(this.liquidity) < 0.01) {
        this.detailErrors = { liquidity: "Liquidity is required and must be at least 0.01." };
        return;
      }

      this.detailsLoading = true;
      try {
        await api.post(`/market/${this.createdMarketId}/details/`, {
          yes_probability: this.yesProbability,
          liquidity: this.liquidity,
        });
        pushSuccess("Market created successfully.");
        this.router.push({ name: "markets" });
      } catch (err) {
        this.detailErrors = extractFieldErrors(err);
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.detailsLoading = false;
      }
    },
    addChoice() {
      this.choices.push({ label: "", probability: "" });
    },
    removeChoice(index) {
      if (this.choices.length <= 2) return;
      this.choices.splice(index, 1);
      delete this.choiceErrors[index];
    },
    // Mirrors the backend's tolerance (MarketChoiceBulkSerializer.SUM_TOLERANCE)
    // so a client-side pass and the server's own check agree on what "adds up
    // to 1" means — thirds (0.3333 + 0.3333 + 0.3334) must pass both.
    validateChoices() {
      const errors = {};
      this.choices.forEach((choice, index) => {
        const fieldErrors = {};
        if (!choice.label.trim()) fieldErrors.label = "Required.";
        if (choice.probability === "" || Number.isNaN(Number(choice.probability))) {
          fieldErrors.probability = "Required.";
        }
        if (Object.keys(fieldErrors).length > 0) errors[index] = fieldErrors;
      });
      this.choiceErrors = errors;
      if (Object.keys(errors).length > 0) return false;

      if (Math.abs(this.choicesTotal - 1) > 0.001) {
        pushError(`Probabilities must add up to 1 — these add up to ${this.choicesTotal.toFixed(4)}.`);
        return false;
      }
      return true;
    },
    async submitChoices() {
      // The max-loss budget funds the LMSR pool (deducted from the platform
      // wallet, same mechanism as a binary market's seed) so it can't fall
      // back to a model default.
      if (!this.liquidity || Number(this.liquidity) < 0.01) {
        this.detailErrors = { liquidity: "Max loss budget is required and must be at least 0.01." };
        return;
      }
      if (!this.validateChoices()) return;

      this.detailsLoading = true;
      try {
        await api.post(`/market/${this.createdMarketId}/choices/`, {
          choices: this.choices.map((choice) => ({
            label: choice.label.trim(),
            probability: choice.probability,
          })),
          liquidity: this.liquidity,
        });
        pushSuccess("Market created successfully.");
        this.router.push({ name: "markets" });
      } catch (err) {
        pushError(this.extractChoicesError(err));
      } finally {
        this.detailsLoading = false;
      }
    },
    // The bulk-choices endpoint's "sum to 1" and per-item errors both land
    // under data.choices (a list-level error or a {index: {field: [...]}}
    // dict) rather than non_field_errors/detail, so extractGeneralError()
    // alone would miss them.
    extractChoicesError(err) {
      const data = err?.response?.data;
      if (!data) return "Something went wrong. Please try again.";
      if (Array.isArray(data.choices)) return data.choices.join(" ");
      if (data.choices && typeof data.choices === "object") {
        const fieldErrors = {};
        for (const [index, fields] of Object.entries(data.choices)) {
          fieldErrors[index] = Object.fromEntries(
            Object.entries(fields).map(([field, messages]) => [field, Array.isArray(messages) ? messages.join(" ") : String(messages)]),
          );
        }
        this.choiceErrors = fieldErrors;
        return "Please fix the highlighted choices.";
      }
      return extractGeneralError(err) || "Could not save choices. Please try again.";
    },
    skipDetails() {
      pushSuccess("Market created successfully.");
      this.router.push({ name: "markets" });
    },
  },
};
</script>
