<template>
  <div >
    <Card title="Create campus">
      <form class="space-y-4" @submit.prevent="saveCampus">
        <Textinput v-model="form.name" label="Campus name" placeholder="University of Nairobi" :error="errors.name" />
        <Textinput v-model="form.slug" label="URL slug" placeholder="university-of-nairobi" :error="errors.slug" />
        <Textinput v-model="form.location" label="Location" placeholder="Nairobi" :error="errors.location" />
        <Textarea v-model="form.description" label="Description" :rows="4" :error="errors.description" />
        <Checkbox v-model="form.is_active" :checked="form.is_active" label="Active" name="is_active" />
        <div>
          <label class="input-label" for="campus-logo">Campus logo (optional)</label>
          <label for="campus-logo" class="block border-2 border-dashed rounded p-5 text-center cursor-pointer" :class="dragging ? 'border-primary-500' : 'border-slate-300'" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="dropLogo">
            <img v-if="logoPreview" :src="logoPreview" alt="Selected campus logo" class="h-20 w-20 object-contain mx-auto mb-3" />
            <span>{{ logo ? logo.name : 'Drop your logo here or click to browse' }}</span>
            <span class="block text-xs text-slate-500 mt-2">PNG, JPEG or WebP · Maximum 2 MB</span>
          </label>
          <input id="campus-logo" ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp" class="block w-full mt-2" @change="selectLogo($event.target.files[0])" />
          <p v-if="errors.logo" class="text-danger-500 text-sm mt-1">{{ errors.logo }}</p>
          <button v-if="logo" type="button" class="text-sm underline mt-2" @click="clearLogo">Remove logo</button>
        </div>
        <div class="flex justify-end items-center gap-3">
          <router-link :to="{ name: 'market-campuses' }" class="btn btn-outline-dark">Cancel</router-link>
          <Button type="submit" text="Create campus" btnClass="btn-dark" :isLoading="saving" :isDisabled="saving" />
        </div>
      </form>
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
  data: () => ({ form: emptyForm(), errors: {}, saving: false, logo: null, logoPreview: '', dragging: false }),
  beforeUnmount() { if (this.logoPreview) URL.revokeObjectURL(this.logoPreview); },
  watch: {
    "form.name"(name) {
      if (!this.form.slug || this.form.slug === this.previousSlug) {
        this.form.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        this.previousSlug = this.form.slug;
      }
    },
  },
  methods: {
    clearLogo() {
      if (this.logoPreview) URL.revokeObjectURL(this.logoPreview);
      this.logo = null; this.logoPreview = '';
      if (this.$refs.logoInput) this.$refs.logoInput.value = '';
      delete this.errors.logo;
    },
    selectLogo(file) {
      if (!file) return;
      this.clearLogo();
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        this.errors.logo = 'Upload a PNG, JPEG, or WebP image.'; return;
      }
      if (file.size > 2 * 1024 * 1024) {
        this.errors.logo = 'Logo must be 2 MB or smaller.'; return;
      }
      this.logo = file; this.logoPreview = URL.createObjectURL(file);
    },
    dropLogo(event) {
      this.dragging = false;
      this.selectLogo(event.dataTransfer.files[0]);
    },
    async saveCampus() {
      if (this.saving || this.errors.logo) return;
      this.saving = true; this.errors = {};
      try {
        const payload = new FormData();
        Object.entries(this.form).forEach(([key, value]) => payload.append(key, value));
        if (this.logo) payload.append('logo', this.logo);
        await api.post("/market/campuses/", payload);
        this.clearLogo();
        this.form = emptyForm(); this.previousSlug = "";
        pushSuccess("Campus created."); this.$router.push({ name: "market-campuses" });
      } catch (err) { this.errors = extractFieldErrors(err); pushError(extractGeneralError(err) || "Could not create campus."); }
      finally { this.saving = false; }
    },

  },
};
</script>
