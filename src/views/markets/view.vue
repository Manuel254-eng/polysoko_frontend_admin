<template>
  <div>
    <Card bodyClass="p-0">
      <header class="border-b px-4 border-slate-100 dark:border-slate-700 pt-4 pb-3 flex justify-between items-center">
        <h6 class="card-title mb-0">Market Details</h6>
        <div class="flex items-center gap-3">
          <Button
            v-if="market.status === 'open'"
            text="Close market"
            btnClass="btn-outline-danger btn-sm"
            @click="$refs.closeModal.openModal()"
          />
          <Button
            v-if="market.status === 'closed'"
            text="Request resolution"
            btnClass="btn-outline-success btn-sm"
            @click="openResolveModal"
          />
          <router-link :to="{ name: 'markets' }" class="btn btn-outline-dark btn-sm">Back</router-link>
        </div>
      </header>
      <div class="p-6">
        <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
          Loading…
        </div>
        <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
          {{ errorMessage }}
        </div>
        <dl v-else class="grid md:grid-cols-2 grid-cols-1 gap-x-8 gap-y-5">
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Title</dt>
            <dd class="text-slate-700 dark:text-slate-200 font-medium">{{ market.title }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Category</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ categoryName }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Status</dt>
            <dd class="text-slate-700 dark:text-slate-200 capitalize">{{ market.status }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Published</dt>
            <dd>
              <span
                class="inline-block px-3 min-w-[90px] text-center py-1 rounded-[999px] bg-opacity-25"
                :class="market.is_published ? 'text-success-500 bg-success-500' : 'text-warning-500 bg-warning-500'"
              >
                {{ market.is_published ? "Published" : "Draft" }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Resolution date</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.resolution_date) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Opens at</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.open_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Closes at</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.close_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Last updated</dt>
            <dd class="text-slate-700 dark:text-slate-200">{{ formatDate(market.updated_at) }}</dd>
          </div>
          <template v-if="market.status === 'resolved'">
            <div>
              <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Outcome</dt>
              <dd class="text-slate-700 dark:text-slate-200 font-medium">
                <span v-if="market.is_custom">{{ market.resolved_choice_label }}</span>
                <span v-else class="uppercase">{{ market.outcome }}</span>
              </dd>
            </div>
            <div>
              <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Resolution source</dt>
              <dd class="text-slate-700 dark:text-slate-200">{{ market.resolution_source || "—" }}</dd>
            </div>
          </template>
          <div class="md:col-span-2">
            <dt class="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-1">Description</dt>
            <dd class="text-slate-700 dark:text-slate-200 whitespace-pre-line">{{ market.description || "—" }}</dd>
          </div>
        </dl>
      </div>
    </Card>

    <Card v-if="market.status === 'resolving' && pendingRequest" noborder>
      <div class="flex md:flex-row flex-col md:items-center justify-between gap-3">
        <div>
          <h6 class="mb-1">Awaiting approval</h6>
          <div class="text-sm text-slate-600 dark:text-slate-300">
            Proposed outcome:
            <strong>
              <span v-if="market.is_custom">{{ pendingRequest.winning_choice_label }}</span>
              <span v-else class="uppercase">{{ pendingRequest.outcome }}</span>
            </strong>
            <span v-if="pendingRequest.resolution_source"> — {{ pendingRequest.resolution_source }}</span>
            <br />
            Requested by {{ pendingRequest.requested_by_phone || "—" }} on {{ formatDate(pendingRequest.requested_at) }}.
            A different admin must approve it before any bets settle.
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <Button text="Reject" btnClass="btn-outline-danger btn-sm" @click="$refs.rejectModal.openModal()" />
          <Button text="Approve" btnClass="btn-success btn-sm" :isLoading="approving" @click="confirmApprove" />
        </div>
      </div>
    </Card>

    <Card v-else-if="market.status === 'resolving' && !loading" noborder>
      <div class="flex md:flex-row flex-col md:items-center justify-between gap-3">
        <div class="text-sm text-slate-600 dark:text-slate-300">
          This market is marked as resolving, but no pending resolution request was found — it may have
          already been decided elsewhere, or the request failed to load.
        </div>
        <Button
          text="Refresh"
          btnClass="btn-outline-dark btn-sm flex-shrink-0"
          :isLoading="refreshingPending"
          @click="retryLoadPendingRequest"
        />
      </div>
    </Card>

    <Modal ref="closeModal" title="Close market" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-base text-slate-600 dark:text-slate-300">
        Closing "<strong>{{ market.title }}</strong>" stops all further trading on it. This can't be undone from here.
      </div>
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.closeModal.closeModal()" />
        <Button text="Close market" btnClass="btn-danger" :isLoading="closing" @click="confirmClose" />
      </template>
    </Modal>

    <Modal ref="resolveModal" title="Request resolution" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Which {{ market.is_custom ? "choice" : "side" }} won?</h4>
      <div class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        This proposes an outcome for "<strong>{{ market.title }}</strong>" — a different admin still has to approve it
        before anyone actually gets paid.
      </div>

      <div v-if="market.is_custom" class="flex flex-col gap-3 mb-5">
        <Radio
          v-for="choice in market.choices"
          :key="choice.id"
          v-model="resolveChoiceId"
          name="resolve-choice"
          :value="choice.id"
          :label="choice.label"
        />
      </div>
      <div v-else class="flex items-center gap-6 mb-5">
        <Radio v-model="resolveOutcome" name="resolve-outcome" value="yes" label="Yes" />
        <Radio v-model="resolveOutcome" name="resolve-outcome" value="no" label="No" />
      </div>

      <Textinput
        label="Resolution source"
        type="text"
        name="resolution_source"
        placeholder="Optional — e.g. link to the official result"
        v-model="resolutionSource"
        classInput="h-[48px]"
      />

      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.resolveModal.closeModal()" />
        <Button
          text="Submit for approval"
          btnClass="btn-success"
          :isDisabled="market.is_custom ? !resolveChoiceId : !resolveOutcome"
          :isLoading="resolving"
          @click="confirmResolve"
        />
      </template>
    </Modal>

    <Modal ref="rejectModal" title="Reject resolution" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        The market goes back to "closed" — the requester (or anyone else) can submit a new proposal.
      </div>
      <Textinput
        label="Note"
        type="text"
        name="reject_note"
        placeholder="Optional — why this is being rejected"
        v-model="rejectNote"
        classInput="h-[48px]"
      />
      <template v-slot:footer>
        <Button text="Cancel" btnClass="btn-outline-dark" @click="$refs.rejectModal.closeModal()" />
        <Button text="Reject" btnClass="btn-danger" :isLoading="rejecting" @click="confirmReject" />
      </template>
    </Modal>
  </div>
</template>
<script>
import Card from "@/components/Card";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button";
import Radio from "@/components/Radio";
import Textinput from "@/components/Textinput";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (err?.response?.status === 404) return "This market could not be found.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

export default {
  components: { Card, Modal, Button, Radio, Textinput },
  data() {
    return {
      loading: true,
      errorMessage: "",
      market: {},
      categories: [],
      closing: false,
      resolving: false,
      resolveOutcome: "",
      resolveChoiceId: "",
      resolutionSource: "",
      pendingRequest: null,
      refreshingPending: false,
      approving: false,
      rejecting: false,
      rejectNote: "",
    };
  },
  computed: {
    categoryName() {
      return this.categories.find((c) => c.id === this.market.category)?.name || "—";
    },
  },
  async mounted() {
    try {
      const [marketRes, categoriesRes] = await Promise.all([
        api.get(`/market/${this.$route.params.id}/`),
        api.get("/market/categories/"),
      ]);
      this.market = marketRes.data;
      this.categories = categoriesRes.data;
      if (this.market.status === "resolving") {
        await this.loadPendingRequest();
      }
    } catch (err) {
      this.errorMessage = extractError(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(value) {
      return value ? new Date(value).toLocaleString() : "—";
    },
    async confirmClose() {
      if (this.closing) return;
      this.closing = true;
      try {
        const { data } = await api.post(`/market/${this.market.id}/close/`);
        this.market = { ...this.market, ...data };
        pushSuccess("Market closed.");
        this.$refs.closeModal.closeModal();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.closing = false;
      }
    },
    async openResolveModal() {
      this.resolveOutcome = "";
      this.resolveChoiceId = "";
      this.resolutionSource = "";
      // The button's v-if only reflects market.status as of the last fetch —
      // re-check against the server so a stale "closed" can't let a resolve
      // request through for a market someone else already moved on.
      try {
        const { data } = await api.get(`/market/${this.market.id}/`);
        this.market = data;
      } catch (err) {
        pushError(extractError(err));
        return;
      }
      if (this.market.status !== "closed") {
        pushError("This market is no longer closed — refresh to see its current status.");
        return;
      }
      this.$refs.resolveModal.openModal();
    },
    async confirmResolve() {
      const ready = this.market.is_custom ? this.resolveChoiceId : this.resolveOutcome;
      if (this.resolving || !ready) return;
      if (this.market.status !== "closed") {
        pushError("This market must be closed before it can be resolved.");
        return;
      }
      this.resolving = true;
      try {
        const payload = { resolution_source: this.resolutionSource.trim() };
        if (this.market.is_custom) {
          payload.winning_choice_id = this.resolveChoiceId;
        } else {
          payload.outcome = this.resolveOutcome;
        }
        const { data } = await api.post(`/market/${this.market.id}/resolve/`, payload);
        this.market = { ...this.market, status: "resolving" };
        this.pendingRequest = data;
        pushSuccess("Resolution submitted for approval.");
        this.$refs.resolveModal.closeModal();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.resolving = false;
      }
    },
    async loadPendingRequest() {
      const { data } = await api.get("/market/resolution-requests/", { params: { status: "pending" } });
      this.pendingRequest = data.find((request) => request.market === this.market.id) || null;
    },
    async retryLoadPendingRequest() {
      if (this.refreshingPending) return;
      this.refreshingPending = true;
      try {
        await this.loadPendingRequest();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.refreshingPending = false;
      }
    },
    async confirmApprove() {
      if (this.approving || !this.pendingRequest) return;
      this.approving = true;
      try {
        await api.post(`/market/resolution-requests/${this.pendingRequest.id}/approve/`);
        const { data } = await api.get(`/market/${this.market.id}/`);
        this.market = data;
        this.pendingRequest = null;
        pushSuccess("Market resolved.");
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.approving = false;
      }
    },
    async confirmReject() {
      if (this.rejecting || !this.pendingRequest) return;
      this.rejecting = true;
      try {
        await api.post(`/market/resolution-requests/${this.pendingRequest.id}/reject/`, {
          note: this.rejectNote.trim(),
        });
        this.market = { ...this.market, status: "closed" };
        this.pendingRequest = null;
        pushSuccess("Resolution rejected.");
        this.$refs.rejectModal.closeModal();
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.rejecting = false;
      }
    },
  },
};
</script>
