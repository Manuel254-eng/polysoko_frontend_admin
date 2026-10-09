<template>
  <div class="space-y-5">
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Simulate bets</h6>
        <router-link :to="{ name: 'users-clients', query: { is_test: 'true' } }" class="btn btn-outline-dark btn-sm">
          Back to players
        </router-link>
      </header>
      <div class="p-6">
        <div v-if="!selection" class="text-sm rounded p-4 bg-warning-500 bg-opacity-10 text-warning-500">
          No players selected. Pick test players on the
          <router-link :to="{ name: 'users-clients', query: { is_test: 'true' } }" class="underline">Players</router-link>
          page and choose <strong>Simulate bets</strong>.
        </div>
        <template v-else>
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-5">
            <strong>{{ playerCount.toLocaleString() }}</strong> test players selected. For each market, choose how many
            of them bet on each side and the stake each one places. Nobody is placed twice in the same market. Bets go
            through the real trade engine one after another — odds, wallets and price history all move.
          </p>

          <div class="mb-5 sim-market-select">
            <VueSelect label="Markets" name="markets" description="Open, published markets only.">
              <vSelect
                v-model="selectedMarkets"
                :options="marketOptions"
                label="title"
                multiple
                :loading="marketsLoading"
                :placeholder="marketsLoading ? 'Loading markets…' : 'Search and select markets'"
              >
                <template #option="market">
                  <div class="flex justify-between items-center gap-3">
                    <span>{{ market.title }}</span>
                    <span class="text-xs text-slate-400 whitespace-nowrap">{{ market.category_name }}</span>
                  </div>
                </template>
                <template #no-options>No open markets.</template>
              </vSelect>
            </VueSelect>
          </div>

          <div
            v-for="market in selectedMarkets"
            :key="market.id"
            class="border border-slate-200 dark:border-slate-700 rounded-md p-4 mb-4"
          >
            <div class="flex justify-between items-start gap-3 mb-3">
              <div>
                <div class="font-medium text-slate-700 dark:text-slate-200">{{ market.title }}</div>
                <div class="text-xs text-slate-400">{{ market.category_name }}</div>
              </div>
              <span
                class="text-xs whitespace-nowrap"
                :class="assigned(market) > playerCount ? 'text-danger-500 font-medium' : 'text-slate-500'"
              >
                {{ assigned(market) }} of {{ playerCount }} players
              </span>
            </div>

            <div class="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
              <div v-for="option in optionsFor(market)" :key="option.key">
                <label class="input-label">
                  {{ option.label }}
                  <span class="text-slate-400 font-normal">· {{ option.price }}</span>
                </label>
                <input
                  v-model.number="plans[market.id].counts[option.key]"
                  type="number"
                  min="0"
                  :max="playerCount"
                  class="input-control w-full h-[40px]"
                  placeholder="0"
                />
              </div>
              <div>
                <label class="input-label">Stake per bet (KES)</label>
                <Textinput
                  :name="`stake_${market.id}`"
                  v-model="plans[market.id].stake"
                  isMask
                  :options="AMOUNT_MASK"
                  placeholder="100"
                  classInput="h-[40px]"
                />
              </div>
            </div>
          </div>

          <div v-if="errorMessages.length" class="text-sm text-danger-500 mb-4">
            <div v-for="message in errorMessages" :key="message">{{ message }}</div>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ totalBets.toLocaleString() }} bets ·
              KES {{ totalStaked.toLocaleString(undefined, { maximumFractionDigits: 2 }) }} in total
            </span>
            <Button
              text="Run simulation"
              btnClass="btn-dark"
              :isDisabled="running || totalBets === 0"
              :isLoading="running"
              @click="run"
            />
          </div>
        </template>
      </div>
    </Card>

    <Card v-if="results" noborder>
      <h6 class="mb-4">
        Results <span class="text-sm text-slate-500 font-normal">· ran as {{ results.players }} players</span>
      </h6>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-xs uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
              <th class="py-2 pr-4 font-medium">Market</th>
              <th class="py-2 pr-4 font-medium text-right">Requested</th>
              <th class="py-2 pr-4 font-medium text-right">Placed</th>
              <th class="py-2 pr-4 font-medium text-right">Failed</th>
              <th class="py-2 font-medium">Why some failed</th>
            </tr>
          </thead>
          <tbody class="text-slate-600 dark:text-slate-300">
            <tr
              v-for="row in results.markets"
              :key="row.market"
              class="border-b border-slate-100 dark:border-slate-700 last:border-0 align-top"
            >
              <td class="py-3 pr-4">
                <router-link :to="{ name: 'market-details', params: { id: row.market } }" class="font-medium hover:underline">
                  {{ row.market_title }}
                </router-link>
              </td>
              <td class="py-3 pr-4 text-right">{{ row.requested }}</td>
              <td class="py-3 pr-4 text-right text-success-500">{{ row.placed }}</td>
              <td class="py-3 pr-4 text-right" :class="row.failed ? 'text-danger-500' : ''">{{ row.failed }}</td>
              <td class="py-3 text-xs">
                <div v-for="reason in row.failure_reasons" :key="reason.reason">{{ reason.count }}× {{ reason.reason }}</div>
                <span v-if="!row.failure_reasons.length" class="text-slate-400">—</span>
              </td>
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
import VueSelect from "@/components/Select/VueSelect";
import vSelect from "vue-select";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";
import { AMOUNT_MASK } from "@/constant/masks";
import { getSimulationSelection } from "@/lib/simulationSelection";

const DEFAULT_STAKE = "100";

function percent(price) {
  return price == null ? "—" : `${Math.round(Number(price) * 100)}%`;
}

export default {
  components: { Card, Textinput, Button, VueSelect, vSelect },
  data() {
    const saved = getSimulationSelection();
    return {
      AMOUNT_MASK,
      selection: saved?.selection || null,
      playerCount: saved?.count || 0,
      marketOptions: [],
      marketsLoading: true,
      selectedMarkets: [],
      // market id -> { stake, counts: { yes, no } | { [choiceId]: n } }
      plans: {},
      running: false,
      errorMessages: [],
      results: null,
    };
  },
  computed: {
    totalBets() {
      return this.selectedMarkets.reduce((sum, market) => sum + this.assigned(market), 0);
    },
    totalStaked() {
      return this.selectedMarkets.reduce(
        (sum, market) => sum + this.assigned(market) * (Number(this.plans[market.id]?.stake) || 0),
        0,
      );
    },
  },
  watch: {
    // A plan per selected market, created on pick and dropped on removal.
    selectedMarkets(markets) {
      const next = {};
      for (const market of markets) {
        next[market.id] = this.plans[market.id] || {
          stake: DEFAULT_STAKE,
          counts: Object.fromEntries(this.optionsFor(market).map((option) => [option.key, 0])),
        };
      }
      this.plans = next;
    },
  },
  async mounted() {
    if (!this.selection) {
      this.marketsLoading = false;
      return;
    }
    try {
      const { data } = await api.get("/market/test/simulate-bets/");
      this.marketOptions = data;
    } catch (err) {
      pushError(extractError(err));
    } finally {
      this.marketsLoading = false;
    }
  },
  methods: {
    optionsFor(market) {
      if (market.is_custom) {
        return market.choices.map((choice) => ({ key: String(choice.id), label: choice.label, price: percent(choice.price) }));
      }
      const yes = market.yes_price;
      return [
        { key: "yes", label: "Yes", price: percent(yes) },
        { key: "no", label: "No", price: yes == null ? "—" : percent(1 - Number(yes)) },
      ];
    },
    assigned(market) {
      const counts = this.plans[market.id]?.counts || {};
      return Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
    },
    validate() {
      const errors = [];
      for (const market of this.selectedMarkets) {
        const counts = Object.values(this.plans[market.id].counts).map(Number);
        if (counts.some((n) => !Number.isInteger(n) || n < 0)) {
          errors.push(`"${market.title}": player counts must be whole numbers.`);
        } else if (this.assigned(market) > this.playerCount) {
          errors.push(`"${market.title}": ${this.assigned(market)} bets but only ${this.playerCount} players selected.`);
        }
        if (this.assigned(market) > 0 && !(Number(this.plans[market.id].stake) >= 1)) {
          errors.push(`"${market.title}": stake must be at least KES 1.`);
        }
      }
      this.errorMessages = errors;
      return errors.length === 0;
    },
    async run() {
      if (!this.validate()) return;
      const markets = this.selectedMarkets
        .filter((market) => this.assigned(market) > 0)
        .map((market) => {
          const plan = this.plans[market.id];
          return {
            market: market.id,
            stake: String(plan.stake),
            allocations: Object.entries(plan.counts).map(([key, count]) =>
              market.is_custom ? { choice: Number(key), count: Number(count) || 0 } : { side: key, count: Number(count) || 0 },
            ),
          };
        });

      this.running = true;
      try {
        const { data } = await api.post("/market/test/simulate-bets/", { players: this.selection, markets });
        this.results = data;
        const placed = data.markets.reduce((sum, row) => sum + row.placed, 0);
        pushSuccess(`Placed ${placed} simulated bets.`);
      } catch (err) {
        const messages = err?.response?.data?.markets || err?.response?.data?.players;
        if (Array.isArray(messages)) this.errorMessages = messages;
        else pushError(extractError(err));
      } finally {
        this.running = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
// VueSelect capitalizes every option/chip, which would rewrite market titles.
.sim-market-select :deep(.vs__dropdown-menu li),
.sim-market-select :deep(.vs__selected-options) {
  text-transform: none;
}
</style>
