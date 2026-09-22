<template>
  <form v-if="step === 'credentials'" @submit.prevent="submitCredentials" class="space-y-4">
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
      placeholder="Your password"
      name="password"
      v-model="password"
      :error="fieldErrors.password"
      hasicon
      classInput="h-[48px]"
    />

    <button type="submit" class="btn btn-dark block w-full text-center" :disabled="loading">
      {{ loading ? "Signing in…" : "Sign in" }}
    </button>
  </form>

  <form v-else-if="step === 'otp'" @submit.prevent="submitOtp" class="space-y-4">
    <p class="text-slate-500 dark:text-slate-400 text-sm">
      Enter the verification code sent to your phone.
    </p>
    <div class="flex justify-center gap-3">
      <input
        v-for="(digit, index) in codeDigits"
        :key="index"
        ref="codeBoxes"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="1"
        class="input-control w-14 h-14 text-center text-2xl font-semibold rounded"
        :class="fieldErrors.code ? 'border-danger-500' : ''"
        :value="digit"
        @input="onCodeBoxInput(index, $event)"
        @keydown="onCodeBoxKeydown(index, $event)"
        @paste="onCodeBoxPaste($event)"
        @focus="$event.target.select()"
      />
    </div>
    <div v-if="fieldErrors.code" class="text-danger-500 text-sm text-center">{{ fieldErrors.code }}</div>

    <p
      class="text-sm text-center flex items-center justify-center gap-2"
      :class="codeExpired ? 'text-danger-500' : 'text-slate-500 dark:text-slate-400'"
    >
      {{ codeExpired ? "Code expired" : `Code expires in ${formattedTime}` }}
      <button
        v-if="codeExpired"
        type="button"
        class="underline disabled:opacity-60"
        :disabled="resending"
        @click="requestResend"
      >
        {{ resending ? "Sending…" : "Resend code" }}
      </button>
    </p>

    <button type="submit" class="btn btn-dark block w-full text-center" :disabled="loading || codeExpired">
      {{ loading ? "Verifying…" : "Verify" }}
    </button>
    <button
      type="button"
      class="text-sm text-slate-500 dark:text-slate-400 underline w-full text-center"
      @click="goToStep('credentials')"
    >
      Back
    </button>
  </form>

  <form v-else @submit.prevent="submitSetPassword" class="space-y-4">
    <p class="text-slate-500 dark:text-slate-400 text-sm">
      This is your first time signing in. Set a new password to continue.
    </p>
    <Textinput
      label="Old password"
      type="password"
      placeholder="Your current password"
      name="old_password"
      v-model="oldPassword"
      :error="fieldErrors.old_password"
      hasicon
      classInput="h-[48px]"
    />
    <Textinput
      label="New password"
      type="password"
      placeholder="New password"
      name="new_password"
      v-model="newPassword"
      :error="fieldErrors.new_password"
      hasicon
      classInput="h-[48px]"
    />

    <div class="-mt-2">
      <div class="flex gap-1">
        <div
          v-for="n in 5"
          :key="n"
          class="h-1.5 flex-1 rounded transition-colors duration-200"
          :class="n <= passwordStrengthScore ? passwordStrengthBarColor : 'bg-slate-200 dark:bg-slate-700'"
        ></div>
      </div>
      <p v-if="newPassword" class="text-xs mt-1" :class="passwordStrengthTextColor">
        {{ passwordStrengthLabel }}
      </p>

      <ul class="mt-2 space-y-1">
        <li
          v-for="check in passwordChecks"
          :key="check.key"
          class="flex items-center gap-1.5 text-xs transition-colors duration-200"
          :class="check.met ? 'text-success-500' : 'text-slate-400 dark:text-slate-500'"
        >
          <Icon :icon="check.met ? 'bi:check-circle-fill' : 'bi:circle'" />
          {{ check.label }}
        </li>
      </ul>
    </div>

    <Textinput
      label="Confirm new password"
      type="password"
      placeholder="Confirm new password"
      name="confirm_password"
      v-model="confirmPassword"
      :error="fieldErrors.confirm_password"
      hasicon
      classInput="h-[48px]"
    />

    <button type="submit" class="btn btn-dark block w-full text-center" :disabled="loading">
      {{ loading ? "Saving…" : "Set new password" }}
    </button>
  </form>
</template>
<script>
import Textinput from "@/components/Textinput";
import InputGroup from "@/components/InputGroup";
import Icon from "@/components/Icon";
import { useRouter } from "vue-router";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  return Object.values(data).flat().join(" ");
}

// The rules behind the live strength checklist below — kept as one list so the
// checklist UI and the reject-before-submit check can't drift apart.
const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { key: "lowercase", label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { key: "uppercase", label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { key: "number", label: "One number (0-9)", test: (p) => /\d/.test(p) },
  { key: "symbol", label: "One symbol (e.g. !@#$%)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Backend is the source of truth (Django AUTH_PASSWORD_VALIDATORS also checks
// similarity to the user's own info and common-password lists); this just
// avoids a round-trip for passwords that obviously don't meet the checklist.
function weakPasswordError(password) {
  const unmet = PASSWORD_RULES.find((rule) => !rule.test(password));
  if (!unmet) return "";
  return `Password must have ${unmet.label.charAt(0).toLowerCase()}${unmet.label.slice(1)}.`;
}

export default {
  components: {
    Textinput,
    InputGroup,
    Icon,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    return { router, authStore };
  },
  data() {
    return {
      step: "credentials",
      phoneNumberDigits: "",
      password: "",
      codeDigits: ["", "", "", ""],
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      verificationSessionId: "",
      loading: false,
      resending: false,
      fieldErrors: {},
      secondsLeft: 0,
      timer: null,
    };
  },
  computed: {
    formattedTime() {
      const m = Math.floor(this.secondsLeft / 60);
      const s = this.secondsLeft % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    },
    codeExpired() {
      return this.secondsLeft <= 0;
    },
    // Digits-only, capped at 9 — the national number that follows the fixed
    // +254 prefix shown beside the input.
    phoneNumber: {
      get() {
        return this.phoneNumberDigits;
      },
      set(value) {
        this.phoneNumberDigits = value.replace(/\D/g, "").slice(0, 9);
      },
    },
    // The 4 OTP boxes joined into the single string the API expects.
    code: {
      get() {
        return this.codeDigits.join("");
      },
      set(value) {
        const digits = value.replace(/\D/g, "").slice(0, 4).split("");
        this.codeDigits = [0, 1, 2, 3].map((i) => digits[i] || "");
      },
    },
    passwordChecks() {
      return PASSWORD_RULES.map((rule) => ({
        key: rule.key,
        label: rule.label,
        met: rule.test(this.newPassword),
      }));
    },
    passwordStrengthScore() {
      return this.passwordChecks.filter((check) => check.met).length;
    },
    passwordStrengthLabel() {
      return ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][this.passwordStrengthScore];
    },
    passwordStrengthBarColor() {
      if (this.passwordStrengthScore <= 1) return "bg-danger-500";
      if (this.passwordStrengthScore <= 3) return "bg-warning-500";
      if (this.passwordStrengthScore === 4) return "bg-info-500";
      return "bg-success-500";
    },
    passwordStrengthTextColor() {
      if (this.passwordStrengthScore <= 1) return "text-danger-500";
      if (this.passwordStrengthScore <= 3) return "text-warning-500";
      if (this.passwordStrengthScore === 4) return "text-info-500";
      return "text-success-500";
    },
  },
  watch: {
    phoneNumber() {
      this.clearFieldError("phone_number");
    },
    password() {
      this.clearFieldError("password");
    },
    code() {
      this.clearFieldError("code");
    },
    oldPassword() {
      this.clearFieldError("old_password");
    },
    newPassword() {
      this.clearFieldError("new_password");
    },
    confirmPassword() {
      this.clearFieldError("confirm_password");
    },
  },
  methods: {
    // InputGroup's :value binding sometimes doesn't get re-patched by Vue when
    // the sanitized result equals the previous reactive value (e.g. typing a
    // letter right after a digit that didn't change the digits-only string) —
    // the DOM input keeps showing the raw keystroke even though state is
    // correct. Force the DOM to match the sanitized state directly.
    setPhoneNumber(value) {
      this.phoneNumber = value;
      this.$nextTick(() => {
        const input = this.$refs.phoneInputGroup?.$el?.querySelector('input[name="phone_number"]');
        if (input && input.value !== this.phoneNumberDigits) {
          input.value = this.phoneNumberDigits;
        }
      });
    },
    onCodeBoxInput(index, event) {
      const digit = event.target.value.replace(/\D/g, "").slice(-1);
      event.target.value = digit; // keep the DOM box in sync even if codeDigits ends up unchanged
      const digits = [...this.codeDigits];
      digits[index] = digit;
      this.codeDigits = digits;
      if (digit && index < 3) {
        this.$refs.codeBoxes[index + 1]?.focus();
      }
    },
    onCodeBoxKeydown(index, event) {
      if (event.key === "ArrowLeft" && index > 0) {
        this.$refs.codeBoxes[index - 1]?.focus();
        return;
      }
      if (event.key === "ArrowRight" && index < 3) {
        this.$refs.codeBoxes[index + 1]?.focus();
        return;
      }
      if (event.key !== "Backspace" || this.codeDigits[index] || index === 0) return;
      // current box is already empty — step back and clear the previous one too
      event.preventDefault();
      const digits = [...this.codeDigits];
      digits[index - 1] = "";
      this.codeDigits = digits;
      this.$nextTick(() => {
        const prevBox = this.$refs.codeBoxes[index - 1];
        if (prevBox) {
          prevBox.value = "";
          prevBox.focus();
        }
      });
    },
    onCodeBoxPaste(event) {
      event.preventDefault();
      const pasted = (event.clipboardData || window.clipboardData).getData("text");
      const digits = pasted.replace(/\D/g, "").slice(0, 4).split("");
      this.codeDigits = [0, 1, 2, 3].map((i) => digits[i] || "");
      this.$nextTick(() => {
        const focusIndex = Math.min(digits.length, 3);
        this.$refs.codeBoxes[focusIndex]?.focus();
      });
    },
    clearFieldError(name) {
      if (this.fieldErrors[name]) {
        delete this.fieldErrors[name];
      }
    },
    // Returns true when all given fields are non-blank; otherwise populates
    // fieldErrors for the blank ones (skipping the network call entirely).
    validateRequired(fields) {
      const errors = {};
      for (const [name, value] of Object.entries(fields)) {
        if (!value || !value.trim()) {
          errors[name] = "This field is required.";
        }
      }
      this.fieldErrors = errors;
      return Object.keys(errors).length === 0;
    },
    goToStep(step) {
      this.step = step;
      this.fieldErrors = {};
      if (step === "otp") {
        this.$nextTick(() => this.$refs.codeBoxes?.[0]?.focus());
      }
    },
    startCountdown(seconds) {
      this.secondsLeft = Math.max(0, seconds);
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.secondsLeft > 0) this.secondsLeft--;
      }, 1000);
    },
    // /user/staff-login/ only returns the session id, not the OTP's expiry — fetch
    // it from the same generic status endpoint the player app's OTP step uses.
    async loadOtpCountdown() {
      try {
        const { data } = await api.get(`/user/verification-session/${this.verificationSessionId}/`);
        const remaining = data.otp_expires_at
          ? Math.round((new Date(data.otp_expires_at).getTime() - Date.now()) / 1000)
          : 0;
        this.startCountdown(remaining);
      } catch {
        this.startCountdown(0); // shows as expired — resend is still available
      }
    },
    async requestResend() {
      this.resending = true;
      try {
        const { data } = await api.post(`/user/verification-session/${this.verificationSessionId}/resend/`);
        this.verificationSessionId = data.verification_session_id;
        this.codeDigits = ["", "", "", ""];
        const remaining = data.otp_expires_at
          ? Math.round((new Date(data.otp_expires_at).getTime() - Date.now()) / 1000)
          : 0;
        this.startCountdown(remaining);
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.resending = false;
      }
    },
    async submitCredentials() {
      if (!this.validateRequired({ phone_number: this.phoneNumber, password: this.password })) return;
      this.loading = true;
      try {
        const { data } = await api.post("/user/staff-login/", {
          phone_number: this.phoneNumber,
          password: this.password,
        });
        this.verificationSessionId = data.verification_session_id;
        this.goToStep("otp");
        this.loadOtpCountdown();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.loading = false;
      }
    },
    async submitOtp() {
      if (!this.validateRequired({ code: this.code })) return;
      if (this.code.length < 4) {
        this.fieldErrors = { code: "Enter all 4 digits." };
        return;
      }
      this.loading = true;
      try {
        const { data } = await api.post("/user/staff-login/verify/", {
          verification_session_id: this.verificationSessionId,
          code: this.code,
        });
        if (data.first_login === false) {
          this.goToStep("setPassword");
          return;
        }
        await this.completeLogin();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.loading = false;
      }
    },
    async submitSetPassword() {
      if (
        !this.validateRequired({
          old_password: this.oldPassword,
          new_password: this.newPassword,
          confirm_password: this.confirmPassword,
        })
      )
        return;

      const weakness = weakPasswordError(this.newPassword);
      if (weakness) {
        this.fieldErrors = { new_password: weakness };
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.fieldErrors = { confirm_password: "New password and confirmation do not match." };
        return;
      }
      this.loading = true;
      try {
        await api.post("/user/staff-login/set-password/", {
          old_password: this.oldPassword,
          new_password: this.newPassword,
        });
        await this.completeLogin();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.loading = false;
      }
    },
    async completeLogin() {
      await this.authStore.fetchMe();
      pushSuccess("Logged in successfully.");
      this.router.push("/app/home");
    },
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
};
</script>
<style lang="scss"></style>
