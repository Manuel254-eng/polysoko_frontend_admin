<template>
  <div class="space-y-5">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3">
        <h6 class="card-title mb-0">Seed test players</h6>
      </header>
      <div class="p-6">
        <div v-if="statusLoading" class="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">Loading…</div>
        <div
          v-else-if="!enabled"
          class="text-sm rounded p-4 bg-warning-500 bg-opacity-10 text-warning-500"
        >
          Test tools are turned off on this server (ENABLE_TEST_TOOLS). Turn them on in the backend's .env to seed players.
        </div>
        <form v-else @submit.prevent="seed" novalidate>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Creates verified player accounts with Kenyan names and unique phone numbers, all marked
            <strong>Test</strong>. Every one logs in to the player app with the password
            <code class="px-1 rounded bg-slate-100 dark:bg-slate-700">{{ password }}</code>.
          </p>
          <div class="md:grid-cols-2 grid-cols-1 grid gap-5 mb-5">
            <Textinput
              label="Number of players"
              type="number"
              name="count"
              v-model="count"
              :error="fieldErrors.count"
              min="1"
              max="500"
              placeholder="25"
              classInput="h-[48px]"
            />
            <Textinput
              label="Starting wallet balance each (KES, optional)"
              name="starting_balance"
              v-model="startingBalance"
              :error="fieldErrors.starting_balance"
              isMask
              :options="AMOUNT_MASK"
              placeholder="0"
              classInput="h-[48px]"
            />
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 -mt-2 mb-5">
            A starting balance is credited like a real deposit — it also adds to the platform reserve.
          </p>
          <div class="ltr:text-right rtl:text-left">
            <Button text="Seed players" btnClass="btn-dark" type="submit" :isDisabled="seeding" :isLoading="seeding" />
          </div>
        </form>
      </div>
    </Card>

    <Card v-if="result" noborder>
      <div class="flex justify-between items-center mb-4">
        <h6 class="mb-0">
          Seeded {{ result.created }} players
          <span v-if="Number(result.starting_balance) > 0" class="text-sm text-slate-500 font-normal">
            · KES {{ Number(result.starting_balance).toLocaleString() }} each
          </span>
        </h6>
        <router-link :to="{ name: 'users-clients', query: { is_test: 'true' } }" class="btn btn-outline-dark btn-sm">
          View test players
        </router-link>
      </div>
      <div class="overflow-x-auto max-h-[420px]">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <th class="py-2 pr-4 font-medium">Name</th>
              <th class="py-2 pr-4 font-medium">Phone (login)</th>
              <th class="py-2 font-medium">Password</th>
            </tr>
          </thead>
          <tbody class="text-slate-600 dark:text-slate-300">
            <tr
              v-for="player in result.players"
              :key="player.id"
              class="border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <td class="py-2 pr-4">{{ player.name }}</td>
              <td class="py-2 pr-4 font-mono">{{ player.phone }}</td>
              <td class="py-2 font-mono">{{ result.password }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Textinput from "@/components/Textinput";
import Button from "@/components/Button";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError, extractFieldErrors, extractGeneralError } from "@/lib/errors";
import { AMOUNT_MASK } from "@/constant/masks";

export default {
  components: { Card, Textinput, Button },
  data() {
    return {
      AMOUNT_MASK,
      statusLoading: true,
      enabled: false,
      password: "",
      count: "25",
      startingBalance: "",
      seeding: false,
      fieldErrors: {},
      result: null,
    };
  },
  async mounted() {
    try {
      const { data } = await api.get("/user/test/seed-players/");
      this.enabled = data.enabled;
      this.password = data.password;
    } catch (err) {
      pushError(extractError(err));
    } finally {
      this.statusLoading = false;
    }
  },
  methods: {
    async seed() {
      const count = Number(this.count);
      if (!Number.isInteger(count) || count < 1 || count > 500) {
        this.fieldErrors = { count: "Enter a whole number from 1 to 500." };
        return;
      }
      this.fieldErrors = {};
      this.seeding = true;
      try {
        const { data } = await api.post("/user/test/seed-players/", {
          count,
          starting_balance: this.startingBalance || "0",
        });
        this.result = data;
        pushSuccess(`Seeded ${data.created} test players.`);
      } catch (err) {
        this.fieldErrors = extractFieldErrors(err);
        const message = extractGeneralError(err);
        if (message) pushError(message);
      } finally {
        this.seeding = false;
      }
    },
  },
};
</script>
