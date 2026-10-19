<template>
  <div class="grid xl:grid-cols-3 gap-5">
    <Card title="Add campus">
      <form class="space-y-4" @submit.prevent="saveCampus">
        <Textinput v-model="form.name" label="Campus name" placeholder="University of Nairobi" :error="errors.name" />
        <Textinput v-model="form.slug" label="URL slug" placeholder="university-of-nairobi" :error="errors.slug" />
        <Textinput v-model="form.location" label="Location" placeholder="Nairobi" :error="errors.location" />
        <Textarea v-model="form.description" label="Description" :rows="4" :error="errors.description" />
        <Checkbox v-model="form.is_active" :checked="form.is_active" label="Active" name="is_active" />
        <Button type="submit" text="Create campus" btnClass="btn-dark" :isLoading="saving" />
      </form>
    </Card>

    <Card title="Campuses" class="xl:col-span-2">
      <div v-if="loading" class="text-slate-500 text-sm py-8 text-center">Loading…</div>
      <div v-else-if="campuses.length === 0" class="text-slate-500 text-sm py-8 text-center">No campuses yet.</div>
      <div v-else class="space-y-3">
        <div v-for="campus in campuses" :key="campus.id" class="border border-slate-200 dark:border-slate-700 rounded p-4 flex items-center justify-between gap-4">
          <div>
            <div class="font-medium text-slate-900 dark:text-white">{{ campus.name }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ campus.location || "Location not set" }} · {{ campus.market_count }} markets · /{{ campus.slug }}</div>
          </div>
          <button class="btn btn-sm" :class="campus.is_active ? 'btn-outline-danger' : 'btn-outline-success'" @click="toggleCampus(campus)">
            {{ campus.is_active ? "Deactivate" : "Activate" }}
          </button>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import Textarea from "@/components/Textarea";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";
import api from "@/lib/api";
import { pushError, pushSuccess } from "@/lib/alerts";
import { extractFieldErrors, extractGeneralError } from "@/lib/errors";

const emptyForm = () => ({ name: "", slug: "", location: "", description: "", is_active: true });

export default {
  components: { Card, Textinput, Textarea, Checkbox, Button },
  data: () => ({ campuses: [], form: emptyForm(), errors: {}, loading: true, saving: false }),
  watch: {
    "form.name"(name) {
      if (!this.form.slug || this.form.slug === this.previousSlug) {
        this.form.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        this.previousSlug = this.form.slug;
      }
    },
  },
  async mounted() { await this.loadCampuses(); },
  methods: {
    async loadCampuses() {
      this.loading = true;
      try { this.campuses = (await api.get("/market/campuses/")).data; }
      catch (err) { pushError(extractGeneralError(err) || "Could not load campuses."); }
      finally { this.loading = false; }
    },
    async saveCampus() {
      this.saving = true; this.errors = {};
      try {
        await api.post("/market/campuses/", this.form);
        this.form = emptyForm(); this.previousSlug = "";
        pushSuccess("Campus created."); await this.loadCampuses();
      } catch (err) { this.errors = extractFieldErrors(err); pushError(extractGeneralError(err) || "Could not create campus."); }
      finally { this.saving = false; }
    },
    async toggleCampus(campus) {
      try {
        const { data } = await api.patch(`/market/campuses/${campus.slug}/`, { is_active: !campus.is_active });
        Object.assign(campus, data); pushSuccess(`Campus ${campus.is_active ? "activated" : "deactivated"}.`);
      } catch (err) { pushError(extractGeneralError(err) || "Could not update campus."); }
    },
  },
};
</script>
