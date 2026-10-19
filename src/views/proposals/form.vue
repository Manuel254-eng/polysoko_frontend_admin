<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">{{ isEdit ? "Edit proposal" : "Propose a market" }}</h6>
      </header>

      <div v-if="pageLoading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
      <div v-else-if="pageError" class="text-danger-500 text-sm py-10 text-center">{{ pageError }}</div>

      <form v-else class="p-6" @submit.prevent="submit" novalidate>
        <div v-if="wasRejected" class="mb-5 rounded-md bg-danger-500 bg-opacity-10 text-danger-500 text-sm px-4 py-3">
          <strong>Rejected:</strong> {{ reviewNote }} — saving your changes sends it back for review.
        </div>

        <div class="lg:grid-cols-3 md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
          <div class="lg:col-span-3 md:col-span-2">
            <Textinput
              label="Question"
              type="text"
              placeholder="Will Kenya Shujaa win the Safari Sevens Cup final?"
              name="title"
              v-model="title"
              :error="fieldErrors.title"
              classInput="h-[48px]"
            />
            <div v-if="similar.length" class="mt-3 rounded-md border border-warning-500 border-opacity-40 bg-warning-500 bg-opacity-10 px-4 py-3">
              <div class="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Similar markets and proposals — check this isn't a duplicate:
              </div>
              <ul class="text-sm space-y-1">
                <li v-for="item in similar" :key="item.key" class="text-slate-600 dark:text-slate-300">
                  <span class="text-xs uppercase font-medium text-slate-400 ltr:mr-2 rtl:ml-2">{{ item.kind }}</span>
                  {{ item.title }}
                </li>
              </ul>
            </div>
          </div>
          <div>
            <label class="input-label" for="category">Category</label>
            <select id="category" v-model="category" class="input-control w-full h-[48px]" :class="fieldErrors.category ? 'border-danger-500' : ''">
              <option value="" disabled>Select a category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <div v-if="fieldErrors.category" class="text-danger-500 text-sm mt-1">{{ fieldErrors.category }}</div>
          </div>
          <div @click="clearFieldError('close_at')">
            <label class="input-label" for="close_at">Betting closes</label>
            <flat-pickr id="close_at" v-model="closeAt" :config="closeAtConfig" placeholder="Select date and time" class="input-control w-full h-[48px]" />
            <span v-if="fieldErrors.close_at" class="text-danger-500 block text-sm mt-2">{{ fieldErrors.close_at }}</span>
          </div>
          <div @click="clearFieldError('resolution_date')">
            <label class="input-label" for="resolution_date">Result known by</label>
            <flat-pickr id="resolution_date" v-model="resolutionDate" :config="resolutionDateConfig" placeholder="Select date and time" class="input-control w-full h-[48px]" />
            <span v-if="fieldErrors.resolution_date" class="text-danger-500 block text-sm mt-2">{{ fieldErrors.resolution_date }}</span>
          </div>
        </div>

        <div class="mb-5">
          <Textarea
            label="Description"
            name="description"
            placeholder="Exactly what makes this resolve Yes or No (or each choice)."
            v-model="description"
            :error="fieldErrors.description"
            :rows="3"
          />
        </div>

        <div class="mb-5">
          <Textinput
            label="Resolution source"
            type="text"
            placeholder="Who or what decides the result, e.g. Kenya Rugby Union"
            name="resolution_source"
            v-model="resolutionSource"
            :error="fieldErrors.resolution_source"
            classInput="h-[48px]"
          />
        </div>

        <div class="mb-5">
          <label class="input-label">Market type</label>
          <div class="flex items-center gap-6">
            <Radio v-model="isCustom" name="market-type" :value="false" label="Yes / No" />
            <Radio v-model="isCustom" name="market-type" :value="true" label="Several outcomes" />
          </div>
        </div>

        <div v-if="!isCustom" class="lg:grid-cols-3 md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
          <Textinput
            label="Chance of Yes (%)"
            type="number"
            name="yes_probability"
            v-model="yesPercent"
            :error="fieldErrors.yes_probability"
            step="0.01"
            min="0"
            max="100"
            classInput="h-[48px]"
          />
        </div>

        <template v-else>
          <div class="mb-3 flex justify-between items-center">
            <label class="input-label mb-0">Outcomes and their chances</label>
            <span class="text-sm font-medium" :class="Math.abs(choicesTotal - 100) <= 0.1 ? 'text-success-500' : 'text-danger-500'">
              Total: {{ choicesTotal.toFixed(2) }}% / 100.00%
            </span>
          </div>
          <div v-for="(choice, index) in choices" :key="index" class="flex items-start gap-3 mb-3">
            <div class="flex-1">
              <Textinput type="text" :placeholder="`Outcome ${index + 1}`" :name="`choice_label_${index}`" v-model="choice.label" classInput="h-[48px]" />
            </div>
            <div class="w-36">
              <Textinput type="number" placeholder="0.00" :name="`choice_probability_${index}`" v-model="choice.percent" step="0.01" min="0" max="100" classInput="h-[48px]" />
            </div>
            <button
              v-if="choices.length > 2"
              type="button"
              class="h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center rounded text-danger-500 border border-danger-500 border-opacity-30 hover:bg-danger-500 hover:bg-opacity-10"
              @click="choices.splice(index, 1)"
            >
              <Icon icon="heroicons-outline:trash" />
            </button>
          </div>
          <div v-if="fieldErrors.choices" class="text-danger-500 text-sm mb-3">{{ fieldErrors.choices }}</div>
          <button type="button" class="btn btn-outline-dark btn-sm mb-5 inline-flex items-center gap-1" @click="choices.push({ label: '', percent: '' })">
            <Icon icon="heroicons-outline:plus" /> Add outcome
          </button>
        </template>

        <div class="mb-6">
          <Textarea
            label="Research notes"
            name="research_notes"
            placeholder="Why this market, the evidence behind your odds, and links to sources — for the reviewer."
            v-model="researchNotes"
            :error="fieldErrors.research_notes"
            :rows="4"
          />
        </div>

        <div class="ltr:text-right rtl:text-left">
          <router-link :to="cancelTarget" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
          <Button :text="submitLabel" btnClass="btn-dark" type="submit" :isDisabled="saving" :isLoading="saving" />
        </div>
      </form>
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
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError, extractFieldErrors, extractGeneralError } from "@/lib/errors";

// "YYYY-MM-DDTHH:mm" in local time — what the date pickers hold.
function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PICKER = {
  enableTime: true,
  altInput: true,
  allowInput: true,
  altInputClass: "input-control w-full h-[48px]",
  altFormat: "M j, Y h:i K",
  dateFormat: "Y-m-d\\TH:i",
};
const SIMILAR_DEBOUNCE_MS = 400;

export default {
  components: { Card, Textinput, Textarea, Button, Icon, Radio },
  data() {
    return {
      pageLoading: false,
      pageError: "",
      saving: false,
      fieldErrors: {},
      categories: [],
      minDateTime: toDateTimeLocal(new Date()),

      title: "",
      category: "",
      closeAt: "",
      resolutionDate: "",
      description: "",
      resolutionSource: "",
      isCustom: false,
      yesPercent: "50",
      choices: [
        { label: "", percent: "" },
        { label: "", percent: "" },
      ],
      researchNotes: "",

      wasRejected: false,
      reviewNote: "",
      similar: [],
      similarTimer: null,
    };
  },
  computed: {
    isEdit() {
      return this.$route.name === "proposals-edit";
    },
    submitLabel() {
      if (!this.isEdit) return "Submit for review";
      return this.wasRejected ? "Resubmit for review" : "Save changes";
    },
    cancelTarget() {
      return this.isEdit ? { name: "proposal-details", params: { id: this.$route.params.id } } : { name: "proposals" };
    },
    choicesTotal() {
      return this.choices.reduce((sum, choice) => sum + (Number(choice.percent) || 0), 0);
    },
    closeAtConfig() {
      return { ...PICKER, minDate: this.minDateTime };
    },
    resolutionDateConfig() {
      return { ...PICKER, minDate: this.closeAt || this.minDateTime };
    },
  },
  watch: {
    title(value) {
      this.clearFieldError("title");
      clearTimeout(this.similarTimer);
      this.similarTimer = setTimeout(() => this.findSimilar(value), SIMILAR_DEBOUNCE_MS);
    },
  },
  async mounted() {
    this.pageLoading = true;
    try {
      const { data } = await api.get("/market/categories/");
      this.categories = data;
      if (this.isEdit) await this.loadProposal();
    } catch (err) {
      this.pageError = extractError(err);
    } finally {
      this.pageLoading = false;
    }
  },
  beforeUnmount() {
    clearTimeout(this.similarTimer);
  },
  methods: {
    clearFieldError(field) {
      if (this.fieldErrors[field]) this.fieldErrors = { ...this.fieldErrors, [field]: "" };
    },
    async loadProposal() {
      const { data } = await api.get(`/market/proposals/${this.$route.params.id}/`);
      this.title = data.title;
      this.category = data.category;
      this.closeAt = toDateTimeLocal(new Date(data.close_at));
      this.resolutionDate = toDateTimeLocal(new Date(data.resolution_date));
      this.description = data.description;
      this.resolutionSource = data.resolution_source;
      this.isCustom = data.is_custom;
      if (data.yes_probability != null) this.yesPercent = String(Number(data.yes_probability) * 100);
      if (data.is_custom) {
        this.choices = data.choices.map((choice) => ({ label: choice.label, percent: String(Number(choice.probability) * 100) }));
      }
      this.researchNotes = data.research_notes;
      this.wasRejected = data.status === "rejected";
      this.reviewNote = data.review_note;
    },
    // Existing markets and other proposals with a similar title, so a
    // researcher notices a duplicate before submitting.
    async findSimilar(title) {
      const query = title.trim();
      if (query.length < 4) {
        this.similar = [];
        return;
      }
      try {
        const [markets, proposals] = await Promise.all([
          api.get("/market/", { params: { search: query, page_size: 5 } }),
          api.get("/market/proposals/", { params: { search: query, status: "pending", page_size: 5 } }),
        ]);
        const ownId = Number(this.$route.params.id);
        this.similar = [
          ...markets.data.results.map((m) => ({ key: `m${m.id}`, kind: "Market", title: m.title })),
          ...proposals.data.results
            .filter((p) => p.id !== ownId)
            .map((p) => ({ key: `p${p.id}`, kind: "Proposal", title: p.title })),
        ];
      } catch {
        this.similar = [];
      }
    },
    payload() {
      const payload = {
        title: this.title.trim(),
        category: this.category || null,
        description: this.description.trim(),
        resolution_source: this.resolutionSource.trim(),
        close_at: this.closeAt ? new Date(this.closeAt).toISOString() : null,
        resolution_date: this.resolutionDate ? new Date(this.resolutionDate).toISOString() : null,
        is_custom: this.isCustom,
        research_notes: this.researchNotes.trim(),
      };
      if (this.isCustom) {
        payload.choices = this.choices.map((choice) => ({
          label: choice.label.trim(),
          probability: (Number(choice.percent) / 100).toFixed(4),
        }));
      } else {
        payload.yes_probability = (Number(this.yesPercent) / 100).toFixed(4);
      }
      return payload;
    },
    async submit() {
      this.fieldErrors = {};
      if (this.isCustom && this.choices.some((choice) => !choice.label.trim() || !(Number(choice.percent) > 0))) {
        this.fieldErrors = { choices: "Give every outcome a name and a chance above 0%." };
        return;
      }
      this.saving = true;
      try {
        const { data } = this.isEdit
          ? await api.patch(`/market/proposals/${this.$route.params.id}/`, this.payload())
          : await api.post("/market/proposals/", this.payload());
        pushSuccess(this.isEdit && !this.wasRejected ? "Proposal updated." : "Proposal submitted for review.");
        this.$router.push({ name: "proposal-details", params: { id: data.id } });
      } catch (err) {
        this.fieldErrors = extractFieldErrors(err);
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>
