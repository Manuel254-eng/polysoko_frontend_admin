<template>
  <div class="space-y-5">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Jackpot Details</h6>
        <div class="flex items-center gap-3">
          <template v-if="jackpot && jackpot.status === 'draft'">
            <Button
              text="Publish"
              btnClass="btn-outline-success btn-sm"
              :isLoading="publishing"
              @click="$refs.publishModal.openModal()"
            />
            <router-link
              :to="{ name: 'market-jackpots-edit', params: { id: jackpot.id } }"
              class="btn btn-outline-dark btn-sm"
            >
              Edit
            </router-link>
          </template>
          <router-link :to="{ name: 'market-jackpots' }" class="btn btn-outline-dark btn-sm">Back</router-link>
        </div>
      </header>
      <div class="p-6">
        <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
        <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
        <dl v-else class="grid md:grid-cols-3 grid-cols-1 gap-x-8 gap-y-5">
          <div class="md:col-span-2">
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Title</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ jackpot.title }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Status</dt>
            <dd>
              <span
                class="inline-block px-3 min-w-[90px] text-center py-1 rounded-[999px] bg-opacity-25"
                :class="{
                  draft: 'text-warning-500 bg-warning-500',
                  published: 'text-success-500 bg-success-500',
                  settled: 'text-info-500 bg-info-500',
                }[jackpot.status]"
              >
                {{ { draft: "Draft", published: "Published", settled: "Settled" }[jackpot.status] }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Code</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-mono">{{ jackpot.code }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Entry fee per ticket</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatKes(jackpot.entry_fee) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Markets</dt>
            <dd
              class="font-medium"
              :class="jackpot.items.length === jackpot.market_count ? 'text-slate-700 dark:text-slate-200' : 'text-warning-500'"
            >
              {{ jackpot.items.length }} of {{ jackpot.market_count }} added
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Created</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(jackpot.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Last updated</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(jackpot.updated_at) }}</dd>
          </div>
        </dl>
      </div>
    </Card>

    <Card v-if="jackpot" noborder>
      <h6 class="mb-1">Prizes</h6>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Each prize is a pool shared equally by every ticket that lands on it. A pool nobody wins stays with the platform.
      </p>
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
            <th class="py-2 pr-4 font-medium">Correct picks</th>
            <th class="py-2 font-medium text-right">Prize pool</th>
          </tr>
        </thead>
        <tbody class="text-slate-600 dark:text-slate-300">
          <tr class="border-b border-slate-100 dark:border-slate-700">
            <td class="py-3 pr-4 font-medium">All {{ jackpot.market_count }} (jackpot)</td>
            <td class="py-3 text-right font-medium">{{ formatKes(jackpot.prize_amount) }}</td>
          </tr>
          <template v-if="jackpot.allow_partial_wins">
            <tr
              v-for="tier in jackpot.prize_tiers"
              :key="tier.id"
              class="border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <td class="py-3 pr-4">{{ tier.correct_picks }} of {{ jackpot.market_count }}</td>
              <td class="py-3 text-right">{{ formatKes(tier.prize_amount) }}</td>
            </tr>
            <tr v-if="jackpot.prize_tiers.length === 0">
              <td colspan="2" class="py-3 text-warning-500 text-xs">
                Partial wins are on but no tiers are set — add one before publishing.
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="2" class="py-3 text-xs text-slate-400">Partial wins are off — all-or-nothing.</td>
          </tr>
        </tbody>
      </table>
    </Card>

    <Card v-if="jackpot" noborder>
      <h6 class="mb-4">Markets ({{ jackpot.items.length }} of {{ jackpot.market_count }})</h6>
      <div v-if="jackpot.items.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
        No markets in this jackpot yet.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <th class="py-2 pr-4 font-medium">Market</th>
              <th class="py-2 pr-4 font-medium">Status</th>
              <th class="py-2 pr-4 font-medium">Published</th>
              <th class="py-2 pr-4 font-medium">Closes</th>
              <th class="py-2 font-medium">Resolves</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in jackpot.items"
              :key="item.id"
              class="border-b border-slate-100 dark:border-slate-700 last:border-0 text-slate-600 dark:text-slate-300"
            >
              <td class="py-3 pr-4">
                <router-link
                  :to="{ name: 'market-details', params: { id: item.market } }"
                  class="font-medium hover:underline"
                >
                  {{ item.market_title }}
                </router-link>
                <span v-if="item.market_is_jackpot_only" class="text-xs text-warning-500 ml-1">Jackpot only</span>
              </td>
              <td class="py-3 pr-4 capitalize">{{ item.market_status }}</td>
              <td class="py-3 pr-4">{{ item.market_is_published ? "Yes" : "No" }}</td>
              <td class="py-3 pr-4 whitespace-nowrap">{{ formatDate(item.market_close_at) }}</td>
              <td class="py-3 whitespace-nowrap">{{ formatDate(item.market_resolution_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Modal ref="publishModal" title="Publish jackpot" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-base text-slate-600 dark:text-slate-300">
        Publishing "<strong>{{ jackpot?.title }}</strong>" makes it visible to everyone, and its markets, fee and prizes
        can't be changed afterwards.
      </div>
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.publishModal.closeModal()" />
        <Button text="Publish" btnClass="btn-dark" :isLoading="publishing" @click="publish" />
      </template>
    </Modal>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Button from "@/components/Button";
import Modal from "@/components/Modal/Modal";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";

const NOT_FOUND = { notFoundMessage: "This jackpot could not be found." };

export default {
  components: { Card, Button, Modal },
  data() {
    return {
      loading: true,
      errorMessage: "",
      jackpot: null,
      publishing: false,
    };
  },
  async mounted() {
    try {
      const { data } = await api.get(`/market/jackpots/${this.$route.params.id}/`);
      this.jackpot = data;
    } catch (err) {
      this.errorMessage = extractError(err, NOT_FOUND);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(value) {
      return value ? new Date(value).toLocaleString() : "—";
    },
    formatKes(value) {
      return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    },
    async publish() {
      if (this.publishing) return;
      this.publishing = true;
      try {
        const { data } = await api.post(`/market/jackpots/${this.jackpot.id}/publish/`);
        this.jackpot = data;
        pushSuccess("Jackpot published.");
        this.$refs.publishModal.closeModal();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.publishing = false;
      }
    },
  },
};
</script>
