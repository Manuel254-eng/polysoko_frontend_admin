<template>
  <div class="space-y-5">
    <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
    <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>

    <template v-else>
      <Card bodyClass="p-0">
        <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex flex-wrap gap-3 justify-between items-center">
          <div class="flex items-center gap-3">
            <h6 class="card-title mb-0">Proposal</h6>
            <span class="inline-block px-3 py-1 rounded-[999px] bg-opacity-25 text-sm" :class="STATUS_BADGE_CLASS[proposal.status]">
              {{ STATUS_LABELS[proposal.status] }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <Button v-if="canWithdraw" text="Withdraw" btnClass="btn-outline-danger btn-sm" :isLoading="withdrawing" @click="withdraw" />
            <router-link v-if="canEdit" :to="{ name: 'proposals-edit', params: { id: proposal.id } }" class="btn btn-outline-dark btn-sm">
              {{ proposal.status === "rejected" ? "Revise and resubmit" : isReviewer && !isOwner ? "Edit before approving" : "Edit" }}
            </router-link>
            <template v-if="canReviewThis">
              <Button text="Reject" btnClass="btn-outline-danger btn-sm" @click="openRejectModal" />
              <Button text="Approve and publish" btnClass="btn-success btn-sm" @click="openApproveModal" />
            </template>
          </div>
        </header>

        <div class="p-6">
          <h4 class="text-xl font-medium text-slate-900 dark:text-white mb-1">{{ proposal.title }}</h4>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Proposed by {{ proposal.proposed_by_name }} · {{ formatDateTime(proposal.submitted_at) }}
          </p>

          <div v-if="proposal.review_note && proposal.status !== 'pending'" class="mb-5 rounded-md px-4 py-3 text-sm"
            :class="proposal.status === 'rejected' ? 'bg-danger-500 bg-opacity-10 text-danger-500' : 'bg-success-500 bg-opacity-10 text-success-500'">
            <strong>{{ proposal.status === "rejected" ? "Why it was rejected" : "Reviewer's note" }}:</strong>
            {{ proposal.review_note }}
          </div>

          <dl class="grid md:grid-cols-2 grid-cols-1 gap-x-8 gap-y-5">
            <div v-for="row in details" :key="row.label">
              <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">{{ row.label }}</dt>
              <dd class="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                <router-link v-if="row.link" :to="row.link" class="hover:underline">{{ row.value }}</router-link>
                <template v-else>{{ row.value }}</template>
              </dd>
            </div>
            <div class="md:col-span-2">
              <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Description</dt>
              <dd class="text-slate-700 dark:text-slate-200 whitespace-pre-line">{{ proposal.description || "—" }}</dd>
            </div>
            <div class="md:col-span-2">
              <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Research notes</dt>
              <dd class="text-slate-700 dark:text-slate-200 whitespace-pre-line break-words">{{ proposal.research_notes || "—" }}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </template>

    <Modal ref="approveModal" title="Approve and publish" labelClass="hidden" centered>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Creates <strong>{{ proposal?.title }}</strong>, seeds it from the platform reserve and publishes it to players
        straight away. Betting closes {{ formatDateTime(proposal?.close_at) }}.
      </p>
      <Textinput
        label="Liquidity (KES)"
        name="liquidity"
        v-model="liquidity"
        :error="approveErrors.liquidity"
        isMask
        :options="AMOUNT_MASK"
        classInput="h-[48px]"
      />
      <span class="block text-secondary-500 font-light text-xs mt-2 mb-4">
        At least KES {{ MIN_MARKET_LIQUIDITY.toLocaleString() }} — the most the platform can lose on this market.
      </span>
      <Textinput label="Note to the researcher" type="text" name="approve_note" placeholder="Optional" v-model="approveNote" classInput="h-[48px]" />
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.approveModal.closeModal()" />
        <Button text="Approve and publish" btnClass="btn-success" :isLoading="approving" @click="approve" />
      </template>
    </Modal>

    <Modal ref="rejectModal" title="Reject proposal" labelClass="hidden" centered>
      <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        The researcher sees your reason and can revise and resubmit the proposal.
      </p>
      <Textarea label="Reason" name="reject_note" placeholder="What needs to change?" v-model="rejectNote" :error="rejectError" :rows="3" />
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.rejectModal.closeModal()" />
        <Button text="Reject" btnClass="btn-danger" :isLoading="rejecting" @click="reject" />
      </template>
    </Modal>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Button from "@/components/Button";
import Modal from "@/components/Modal/Modal";
import Textinput from "@/components/Textinput";
import Textarea from "@/components/Textarea";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";
import { extractError, extractFieldErrors, extractGeneralError } from "@/lib/errors";
import { AMOUNT_MASK } from "@/constant/masks";
import { MIN_MARKET_LIQUIDITY } from "@/constant/markets";
import { useAuthStore } from "@/store/auth";
import { STATUS_BADGE_CLASS, STATUS_LABELS, describeOdds, formatDateTime } from "./shared";

export default {
  components: { Card, Button, Modal, Textinput, Textarea },
  data() {
    const auth = useAuthStore();
    return {
      STATUS_BADGE_CLASS,
      STATUS_LABELS,
      AMOUNT_MASK,
      MIN_MARKET_LIQUIDITY,
      isReviewer: auth.can("REVIEW_MARKET_PROPOSAL"),
      canOpenMarkets: auth.can("UPDATE_MARKET"),
      userId: auth.user?.id,
      loading: true,
      errorMessage: "",
      proposal: null,
      withdrawing: false,
      liquidity: String(MIN_MARKET_LIQUIDITY),
      approveNote: "",
      approveErrors: {},
      approving: false,
      rejectNote: "",
      rejectError: "",
      rejecting: false,
    };
  },
  computed: {
    isOwner() {
      return this.proposal?.proposed_by === this.userId;
    },
    canEdit() {
      return this.proposal.can_edit || (this.isReviewer && this.proposal.status === "pending");
    },
    canWithdraw() {
      return this.isOwner && this.proposal.status === "pending";
    },
    canReviewThis() {
      return this.isReviewer && this.proposal.status === "pending";
    },
    details() {
      const p = this.proposal;
      const rows = [
        { label: "Category", value: p.category_name },
        { label: "Type", value: p.is_custom ? "Several outcomes" : "Yes / No" },
        { label: "Opening odds", value: describeOdds(p) },
        { label: "Resolution source", value: p.resolution_source || "—" },
        { label: "Betting closes", value: formatDateTime(p.close_at) },
        { label: "Result known by", value: formatDateTime(p.resolution_date) },
      ];
      if (p.reviewed_by_name) rows.push({ label: "Reviewed by", value: `${p.reviewed_by_name} · ${formatDateTime(p.reviewed_at)}` });
      if (p.market) {
        rows.push({
          label: "Published market",
          value: p.market_title,
          link: this.canOpenMarkets ? { name: "market-details", params: { id: p.market } } : null,
        });
        rows.push({ label: "Liquidity", value: `KES ${Number(p.liquidity).toLocaleString()}` });
      }
      return rows;
    },
  },
  async mounted() {
    try {
      const { data } = await api.get(`/market/proposals/${this.$route.params.id}/`);
      this.proposal = data;
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDateTime,
    async withdraw() {
      this.withdrawing = true;
      try {
        const { data } = await api.post(`/market/proposals/${this.proposal.id}/withdraw/`);
        this.proposal = data;
        pushSuccess("Proposal withdrawn.");
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.withdrawing = false;
      }
    },
    openApproveModal() {
      this.approveErrors = {};
      this.$refs.approveModal.openModal();
    },
    async approve() {
      if (!(Number(this.liquidity) >= MIN_MARKET_LIQUIDITY)) {
        this.approveErrors = { liquidity: `Liquidity must be at least KES ${MIN_MARKET_LIQUIDITY.toLocaleString()}.` };
        return;
      }
      this.approving = true;
      this.approveErrors = {};
      try {
        const { data } = await api.post(`/market/proposals/${this.proposal.id}/approve/`, {
          liquidity: this.liquidity,
          review_note: this.approveNote.trim(),
        });
        this.proposal = data;
        this.$refs.approveModal.closeModal();
        pushSuccess("Approved — the market is live.");
      } catch (err) {
        // Errors can be about the market itself (e.g. its closing time has
        // passed while it waited), not only the liquidity — show them all.
        this.approveErrors = extractFieldErrors(err);
        const general = extractGeneralError(err);
        const other = Object.entries(this.approveErrors)
          .filter(([field]) => field !== "liquidity")
          .map(([, message]) => message);
        const message = [general, ...other].filter(Boolean).join(" ");
        if (message) pushError(message);
      } finally {
        this.approving = false;
      }
    },
    openRejectModal() {
      this.rejectNote = "";
      this.rejectError = "";
      this.$refs.rejectModal.openModal();
    },
    async reject() {
      if (!this.rejectNote.trim()) {
        this.rejectError = "Say why it was rejected.";
        return;
      }
      this.rejecting = true;
      try {
        const { data } = await api.post(`/market/proposals/${this.proposal.id}/reject/`, { review_note: this.rejectNote.trim() });
        this.proposal = data;
        this.$refs.rejectModal.closeModal();
        pushSuccess("Proposal rejected.");
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.rejecting = false;
      }
    },
  },
};
</script>
