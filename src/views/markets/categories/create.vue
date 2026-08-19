<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Add Market Category</h6>
      </header>
      <div class="p-6">
        <form @submit.prevent="submit" novalidate>
          <div class="md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Name"
              type="text"
              placeholder="Crypto"
              name="name"
              v-model="name"
              :error="fieldErrors.name"
              classInput="h-[48px]"
            />
            <Textinput
              label="Slug"
              type="text"
              placeholder="crypto"
              name="slug"
              v-model="slug"
              :error="fieldErrors.slug"
              classInput="h-[48px]"
              @input="slugEditedManually = true"
            />
          </div>

          <div class="mb-5">
            <label class="input-label">Icon</label>
            <ul class="flex icon-list flex-wrap">
              <li>
                <Tooltip placement="top" :offset="[10, 30]" :arrow="true">
                  <template #button>
                    <div
                      @click.prevent="icon = ''"
                      class="cursor-pointer rounded-md text-slate-600 dark:text-slate-300 text-xl py-3 px-4 border-2"
                      :class="icon === '' ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-700' : 'border-transparent bg-white dark:bg-slate-800 shadow-base'"
                    >
                      <Icon icon="heroicons-outline:x-circle" />
                    </div>
                  </template>
                  <span>No icon</span>
                </Tooltip>
              </li>
              <li v-for="opt in iconOptions" :key="opt.value">
                <Tooltip placement="top" :offset="[10, 30]" :arrow="true">
                  <template #button>
                    <div
                      @click.prevent="icon = opt.value"
                      class="cursor-pointer rounded-md text-slate-600 dark:text-slate-300 text-xl py-3 px-4 border-2"
                      :class="icon === opt.value ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-700' : 'border-transparent bg-white dark:bg-slate-800 shadow-base'"
                    >
                      <Icon :icon="opt.value" />
                    </div>
                  </template>
                  <span>{{ opt.label }}</span>
                </Tooltip>
              </li>
            </ul>
            <div v-if="fieldErrors.icon" class="text-danger-500 text-sm mt-1">{{ fieldErrors.icon }}</div>
          </div>

          <div v-if="errorMessage" class="text-danger-500 text-sm mb-5">{{ errorMessage }}</div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'market-categories' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button text="Create category" btnClass="btn-dark" type="submit" :isDisabled="loading" :isLoading="loading" />
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
import Icon from "@/components/Icon";
import Tooltip from "@/components/Tooltip";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/lib/api";

const ICON_OPTIONS = [
  { value: "heroicons-outline:currency-dollar", label: "Finance" },
  { value: "heroicons-outline:chart-bar", label: "Markets" },
  { value: "heroicons-outline:globe-alt", label: "Politics / World" },
  { value: "bi:trophy", label: "Sports" },
  { value: "heroicons-outline:film", label: "Entertainment" },
  { value: "heroicons-outline:chip", label: "Technology" },
  { value: "heroicons-outline:beaker", label: "Science" },
  { value: "heroicons-outline:sun", label: "Weather" },
  { value: "heroicons-outline:briefcase", label: "Business" },
  { value: "heroicons-outline:scale", label: "Law / Elections" },
  { value: "heroicons-outline:heart", label: "Health" },
  { value: "heroicons-outline:academic-cap", label: "Education" },
];

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export default {
  components: { Card, Textinput, Button, Icon, Tooltip },
  setup() {
    const toast = useToast();
    const router = useRouter();
    return { toast, router };
  },
  data() {
    return {
      name: "",
      slug: "",
      icon: "",
      iconOptions: ICON_OPTIONS,
      // once the user edits the slug themselves, stop overwriting it from the name
      slugEditedManually: false,
      loading: false,
      errorMessage: "",
      fieldErrors: {},
    };
  },
  watch: {
    name(value) {
      this.clearFieldError("name");
      if (!this.slugEditedManually) {
        this.slug = slugify(value);
      }
    },
    slug() {
      this.clearFieldError("slug");
    },
    icon() {
      this.clearFieldError("icon");
    },
  },
  methods: {
    clearFieldError(name) {
      if (this.fieldErrors[name]) {
        delete this.fieldErrors[name];
      }
    },
    validateRequired() {
      const errors = {};
      if (!this.name.trim()) errors.name = "This field is required.";
      if (!this.slug.trim()) errors.slug = "This field is required.";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      this.errorMessage = "";
      if (!this.validateRequired()) return;

      this.loading = true;
      try {
        await api.post("/market/categories/", {
          name: this.name.trim(),
          slug: this.slug.trim(),
          icon: this.icon.trim(),
        });
        this.toast.success("Category created successfully", { timeout: 2000 });
        this.router.push({ name: "market-categories" });
      } catch (err) {
        this.fieldErrors = extractFieldErrors(err);
        this.errorMessage = extractGeneralError(err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.icon-list {
  li {
    margin-right: 12px;
    margin-bottom: 12px;
  }
}
</style>
