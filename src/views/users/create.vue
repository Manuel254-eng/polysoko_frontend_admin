<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Add User</h6>
      </header>
      <div class="p-6">
        <form @submit.prevent="submit" novalidate>
          <div class="md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="First name"
              type="text"
              placeholder="Enter first name"
              name="first_name"
              v-model="firstName"
              :error="fieldErrors.first_name"
              classInput="h-[48px]"
            />
            <Textinput
              label="Middle name"
              type="text"
              placeholder="Enter middle name"
              name="middle_name"
              v-model="middleName"
              :error="fieldErrors.middle_name"
              classInput="h-[48px]"
            />
            <Textinput
              label="Last name"
              type="text"
              placeholder="Enter last name"
              name="last_name"
              v-model="lastName"
              :error="fieldErrors.last_name"
              classInput="h-[48px]"
            />
            <Textinput
              label="Email"
              type="email"
              placeholder="Enter email address"
              name="email"
              v-model="email"
              :error="fieldErrors.email"
              classInput="h-[48px]"
            />
            <InputGroup
              ref="phoneInputGroup"
              label="Phone number"
              type="tel"
              prepend="+254"
              placeholder="712345678"
              name="phone_number"
              :modelValue="phoneNumber"
              @update:modelValue="setPhoneNumber"
              :error="fieldErrors.phone_number"
              classInput="h-[48px]"
            />
            <Textinput
              label="Password"
              type="password"
              placeholder="Temporary password"
              name="password"
              v-model="password"
              :error="fieldErrors.password"
              hasicon
              classInput="h-[48px]"
            />
            <div>
              <label class="input-label" for="role">Role</label>
              <select id="role" v-model="role" class="input-control w-full h-[48px]" :class="fieldErrors.role ? 'border-danger-500' : ''">
                <option value="" disabled>Select a role</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
              <div v-if="fieldErrors.role" class="text-danger-500 text-sm mt-1">{{ fieldErrors.role }}</div>
            </div>
          </div>

          <div class="mb-5">
            <Checkbox v-model="isActive" :checked="isActive" label="Active" name="is_active" />
          </div>

          <div v-if="errorMessage" class="text-danger-500 text-sm mb-5">{{ errorMessage }}</div>

          <div class="ltr:text-right rtl:text-left">
            <router-link :to="{ name: 'users' }" class="btn btn-outline-dark ltr:mr-3 rtl:ml-3">Cancel</router-link>
            <Button text="Create user" btnClass="btn-dark" type="submit" :isDisabled="loading" :isLoading="loading" />
          </div>
        </form>
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import InputGroup from "@/components/InputGroup";
import Checkbox from "@/components/Checkbox";
import Button from "@/components/Button";
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

export default {
  components: { Card, Textinput, InputGroup, Checkbox, Button },
  setup() {
    const toast = useToast();
    const router = useRouter();
    return { toast, router };
  },
  data() {
    return {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumberDigits: "",
      password: "",
      role: "",
      isActive: true,
      roles: [],
      loading: false,
      loadingRoles: true,
      errorMessage: "",
      fieldErrors: {},
    };
  },
  computed: {
    phoneNumber: {
      get() {
        return this.phoneNumberDigits;
      },
      set(value) {
        this.phoneNumberDigits = value.replace(/\D/g, "").slice(0, 9);
      },
    },
  },
  watch: {
    firstName() {
      this.clearFieldError("first_name");
    },
    middleName() {
      this.clearFieldError("middle_name");
    },
    lastName() {
      this.clearFieldError("last_name");
    },
    email() {
      this.clearFieldError("email");
    },
    phoneNumber() {
      this.clearFieldError("phone_number");
    },
    password() {
      this.clearFieldError("password");
    },
    role() {
      this.clearFieldError("role");
    },
  },
  async mounted() {
    try {
      const { data } = await api.get("/rbac/roles/");
      this.roles = data;
    } catch {
      this.errorMessage = "Could not load roles. Please refresh and try again.";
    } finally {
      this.loadingRoles = false;
    }
  },
  methods: {
    // See Signin.vue for why this DOM-sync workaround is needed with InputGroup.
    setPhoneNumber(value) {
      this.phoneNumber = value;
      this.$nextTick(() => {
        const input = this.$refs.phoneInputGroup?.$el?.querySelector('input[name="phone_number"]');
        if (input && input.value !== this.phoneNumberDigits) {
          input.value = this.phoneNumberDigits;
        }
      });
    },
    clearFieldError(name) {
      if (this.fieldErrors[name]) {
        delete this.fieldErrors[name];
      }
    },
    validateRequired() {
      const errors = {};
      if (!this.firstName.trim()) errors.first_name = "This field is required.";
      if (!this.lastName.trim()) errors.last_name = "This field is required.";
      if (!this.email.trim()) errors.email = "This field is required.";
      if (!this.phoneNumber.trim()) errors.phone_number = "This field is required.";
      if (!this.password.trim()) errors.password = "This field is required.";
      if (!this.role) errors.role = "This field is required.";
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      this.errorMessage = "";
      if (!this.validateRequired()) return;
      if (!/^\S+@\S+\.\S+$/.test(this.email)) {
        this.fieldErrors = { email: "Enter a valid email address." };
        return;
      }
      if (this.password.length < 8) {
        this.fieldErrors = { password: "Password must be at least 8 characters long." };
        return;
      }

      this.loading = true;
      try {
        await api.post("/user/staff/", {
          first_name: this.firstName.trim(),
          middle_name: this.middleName.trim(),
          last_name: this.lastName.trim(),
          email: this.email.trim(),
          country_code: "+254",
          phone_number: this.phoneNumber,
          password: this.password,
          role: this.role,
          is_active: this.isActive,
        });
        this.toast.success("User created successfully", { timeout: 2000 });
        this.router.push({ name: "users" });
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
