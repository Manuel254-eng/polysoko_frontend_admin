<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Add to Reserve</h6>
      </header>
      <div class="p-6">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Records real capital contributed into the platform's reserve (e.g. a bank transfer from the owner) — not a
          customer's own money. This increases the reserve available to seed new markets.
        </p>
        <form @submit.prevent="submit" novalidate>
          <div class="md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Amount (KES)"
              name="amount"
              v-model="amount"
              :error="fieldErrors.amount"
              isMask
              :options="AMOUNT_MASK"
              placeholder="0.00"
              classInput="h-[48px]"
            />
          </div>
          <div class="mb-5">
            <Textarea
              label="Note"
              name="note"
              placeholder="Optional — e.g. bank transfer reference"
              v-model="note"
              :error="fieldErrors.note"
            />
          </div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'accounting-accounts' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">
              Cancel
            </router-link>
            <Button text="Add to reserve" btnClass="btn-dark" type="submit" :isDisabled="loading" :isLoading="loading" />
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
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractFieldErrors, extractGeneralError } from "@/lib/errors";
import { AMOUNT_MASK } from "@/constant/masks";

export default {
  components: { Card, Textinput, Textarea, Button },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      AMOUNT_MASK,
      amount: "",
      note: "",
      loading: false,
      fieldErrors: {},
    };
  },
  watch: {
    amount() {
      this.clearFieldError("amount");
    },
    note() {
      this.clearFieldError("note");
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
      if (!this.amount || Number(this.amount) <= 0) errors.amount = "Enter an amount greater than zero.";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      if (!this.validateRequired()) return;

      this.loading = true;
      try {
        await api.post("/wallet/platform/deposit/", {
          amount: this.amount,
          note: this.note.trim(),
        });
        pushSuccess("Added to reserve successfully.");
        this.router.push({ name: "accounting-accounts" });
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
