<template>
  <div class="phone">
    <div class="phone-notch"></div>
    <div class="screen">
      <div class="status-bar">
        <span>9:41</span>
        <span class="status-icons"><Icon icon="heroicons-solid:wifi" /><Icon icon="heroicons-solid:lightning-bolt" /></span>
      </div>

      <div class="app-bar">
        <span class="back"><Icon icon="heroicons-outline:arrow-left" /> Back</span>
        <span class="app-title">Jackpot</span>
        <span></span>
      </div>

      <div class="scroll">
        <div class="hero">
          <div class="hero-badge"><Icon icon="heroicons-solid:star" /> Jackpot</div>
          <div class="hero-title" :class="{ placeholder: !title.trim() }">{{ title.trim() || "Jackpot title" }}</div>
          <div class="hero-code">{{ code || "JKP-········" }}</div>

          <div class="prize-lbl">Win up to</div>
          <div class="prize">{{ prizeAmount ? kes(prizeAmount) : "KES —" }}</div>
          <div class="hero-stats">
            <div class="stat">
              <span class="stat-val">{{ entryFee ? kes(entryFee) : "—" }}</span>
              <span class="stat-lbl">per ticket</span>
            </div>
            <div class="stat">
              <span class="stat-val">{{ count || "—" }}</span>
              <span class="stat-lbl">markets</span>
            </div>
          </div>
        </div>

        <div v-if="allowPartialWins && validTiers.length" class="tiers">
          <div class="section-lbl">Prizes</div>
          <div class="tier-row">
            <span>All {{ count }} right</span>
            <b>{{ prizeAmount ? kes(prizeAmount) : "—" }}</b>
          </div>
          <div v-for="tier in validTiers" :key="tier.correct_picks" class="tier-row">
            <span>{{ tier.correct_picks }} of {{ count }}</span>
            <b>{{ kes(tier.prize_amount) }}</b>
          </div>
          <div class="tier-note">Each prize is shared equally by its winning tickets.</div>
        </div>

        <div class="section-lbl">Your picks · {{ markets.length }} of {{ count || "?" }}</div>

        <div v-for="(market, i) in markets" :key="market.id" class="card">
          <div class="card-head">
            <span class="card-num">{{ i + 1 }}</span>
            <span class="card-title">{{ market.title }}</span>
          </div>
          <div class="card-meta">
            <span v-if="market.category_name" class="tag">{{ market.category_name }}</span>
            <span v-if="market.close_at">Closes {{ shortDate(market.close_at) }}</span>
          </div>
          <div v-if="market.is_custom && market.choice_labels?.length" class="choices">
            <span v-for="label in market.choice_labels" :key="label" class="pick">{{ label }}</span>
          </div>
          <div v-else class="picks">
            <span class="pick">Yes</span>
            <span class="pick">No</span>
          </div>
        </div>

        <div v-for="n in emptySlots" :key="`empty-${n}`" class="card card-empty">
          <span class="card-num">{{ markets.length + n }}</span>
          <span>Market not selected yet</span>
        </div>

        <div v-if="!count && markets.length === 0" class="empty-hint">
          Set the number of markets and pick some to see them here.
        </div>
      </div>

      <div class="buy-bar">
        <button type="button" class="buy-btn" tabindex="-1">
          Buy ticket{{ entryFee ? ` — ${kes(entryFee)}` : "" }}
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import Icon from "@/components/Icon";

// The jackpot as a player will see it in the app — a live preview beside the
// create/edit form, so it's drawn with the player app's own palette rather
// than the admin theme. Purely visual: nothing here is clickable.
export default {
  components: { Icon },
  props: {
    title: { type: String, default: "" },
    code: { type: String, default: "" },
    entryFee: { type: [String, Number], default: "" },
    prizeAmount: { type: [String, Number], default: "" },
    marketCount: { type: [String, Number], default: "" },
    allowPartialWins: { type: Boolean, default: false },
    tiers: { type: Array, default: () => [] },
    // { id, title, category_name, close_at, is_custom, choice_labels }
    markets: { type: Array, default: () => [] },
  },
  computed: {
    count() {
      const n = Number(this.marketCount);
      return Number.isInteger(n) && n > 0 ? n : 0;
    },
    emptySlots() {
      return Math.max(this.count - this.markets.length, 0);
    },
    validTiers() {
      return this.tiers
        .map((tier) => ({ correct_picks: Number(tier.correct_picks), prize_amount: Number(tier.prize_amount) }))
        .filter((tier) => tier.correct_picks > 0 && tier.prize_amount > 0)
        .sort((a, b) => b.correct_picks - a.correct_picks);
    },
  },
  methods: {
    kes(value) {
      return `KES ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    },
    shortDate(value) {
      return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },
  },
};
</script>
<style scoped>
/* Player app palette (player app src/assets/base.css) */
.phone {
  --bg: #0b0f0d;
  --surface: #111815;
  --surface2: #25302a;
  --border: #25302a;
  --green: #16a34a;
  --green-light: rgba(22, 163, 74, 0.16);
  --amber: #d4a017;
  --amber-dark: #f0c24b;
  --ink: #f5f5f0;
  --muted: #9ca8a0;

  position: relative;
  width: 300px;
  height: 610px;
  margin: 0 auto;
  padding: 12px;
  border-radius: 44px;
  background: #1c1c1e;
  box-shadow: 0 0 0 2px #3a3a3c, 0 20px 40px rgba(0, 0, 0, 0.35);
  font-family: Inter, system-ui, sans-serif;
}

.phone-notch {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 22px;
  background: #1c1c1e;
  border-radius: 0 0 14px 14px;
  z-index: 2;
}

.screen {
  height: 100%;
  border-radius: 34px;
  background: var(--bg);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 22px 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-icons {
  display: flex;
  gap: 4px;
}

.app-bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 6px 14px 10px;
  border-bottom: 0.5px solid var(--border);
}

.back {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted);
}

.app-title {
  font-family: "Roboto Slab", Georgia, serif;
  font-size: 13px;
  font-weight: 700;
}

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  scrollbar-width: none;
}

.scroll::-webkit-scrollbar {
  display: none;
}

.hero {
  position: relative;
  background: linear-gradient(160deg, rgba(212, 160, 23, 0.18), var(--surface) 55%);
  border: 1.5px solid var(--amber);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

.hero-badge {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  background: var(--amber);
  color: #1a1400;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-bottom-left-radius: 6px;
}

.hero-title {
  font-family: "Roboto Slab", Georgia, serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  padding-right: 56px;
}

.hero-title.placeholder {
  color: var(--muted);
  font-weight: 400;
}

.hero-code {
  font-size: 9px;
  color: var(--muted);
  letter-spacing: 0.05em;
  margin: 3px 0 10px;
}

.prize-lbl {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.prize {
  font-family: "Roboto Slab", Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--amber-dark);
  margin-bottom: 10px;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.stat {
  background: var(--surface2);
  border-radius: 6px;
  padding: 6px 8px;
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 12px;
  font-weight: 700;
}

.stat-lbl {
  display: block;
  font-size: 9px;
  color: var(--muted);
}

.tiers {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.tiers .section-lbl {
  margin: 0 0 6px;
  text-align: left;
}

.tier-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
  padding: 3px 0;
}

.tier-row b {
  color: var(--ink);
  font-weight: 600;
}

.tier-note {
  font-size: 9px;
  color: var(--muted);
  margin-top: 4px;
}

.section-lbl {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
  margin: 4px 0 8px;
}

.card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 9px 10px;
  margin-bottom: 8px;
}

.card-head {
  display: flex;
  gap: 6px;
  align-items: flex-start;
}

.card-num {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--surface2);
  color: var(--muted);
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-family: "Roboto Slab", Georgia, serif;
  font-size: 11px;
  line-height: 1.35;
}

.card-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 9px;
  color: var(--muted);
  margin: 5px 0 7px 22px;
}

.tag {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  background: var(--surface2);
  padding: 1px 5px;
  border-radius: 3px;
}

.picks {
  display: flex;
  gap: 6px;
}

.choices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.pick {
  flex: 1;
  text-align: center;
  font-size: 10px;
  font-weight: 500;
  padding: 5px 4px;
  border-radius: 5px;
  background: var(--surface2);
  color: var(--muted);
  border: 0.5px solid var(--border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-empty {
  display: flex;
  align-items: center;
  gap: 6px;
  border-style: dashed;
  border-color: #37473f;
  background: transparent;
  color: var(--muted);
  font-size: 10px;
}

.empty-hint {
  text-align: center;
  font-size: 10px;
  color: var(--muted);
  padding: 20px 10px;
}

.buy-bar {
  padding: 10px 12px 14px;
  border-top: 0.5px solid var(--border);
  background: var(--surface);
}

.buy-btn {
  width: 100%;
  padding: 9px 0;
  border-radius: 6px;
  border: none;
  background: var(--amber);
  color: #1a1400;
  font-size: 12px;
  font-weight: 700;
  cursor: default;
}
</style>
