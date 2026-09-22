<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>Resolution Requests</h5>
        <div class="flex items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search" type="text" prependIcon="heroicons-outline:search" merged />
        </div>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        Loading…
      </div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">
        {{ errorMessage }}
      </div>
      <div v-else-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        No pending resolution requests.
      </div>
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table bordered centered"
        :pagination-options="{ enabled: true, perPage }"
        :search-options="{ enabled: true, externalQuery: searchTerm }"
      >
        <template v-slot:table-row="props">
          <router-link
            v-if="props.column.field === 'market_title'"
            :to="{ name: 'market-details', params: { id: props.row.market } }"
            class="text-slate-600 dark:text-slate-300 font-medium hover:underline"
          >
            {{ props.row.market_title }}
          </router-link>
          <span v-else-if="props.column.field === 'outcome_display'" class="font-medium" :class="{ uppercase: !props.row.winning_choice_label }">
            {{ props.row.outcome_display }}
          </span>
          <span v-else-if="props.column.field === 'status'" class="block w-full">
            <span
              class="inline-block px-3 min-w-[80px] text-center mx-auto py-1 rounded-[999px] bg-opacity-25 capitalize"
              :class="statusBadgeClass(props.row.status)"
            >
              {{ props.row.status }}
            </span>
          </span>
          <span v-else-if="props.column.field === 'action'">
            <div v-if="props.row.status === 'pending'" class="flex items-center gap-2">
              <Button
                text="Reject"
                btnClass="btn-outline-danger btn-sm"
                @click="openRejectModal(props.row)"
              />
              <Button
                text="Approve"
                btnClass="btn-success btn-sm"
                :isLoading="approvingId === props.row.id"
                @click="approve(props.row)"
              />
            </div>
          </span>
          <span v-else>{{ props.formattedRow[props.column.field] }}</span>
        </template>
        <template #pagination-bottom="props">
          <div class="py-4 px-3">
            <Pagination
              :total="rows.length"
              :current="current"
              :per-page="perPage"
              :pageRange="2"
              @page-changed="current = $event"
              :pageChanged="props.pageChanged"
              :perPageChanged="props.perPageChanged"
              enableSearch
              enableSelect
              :options="perPageOptions"
            />
          </div>
        </template>
      </vue-good-table>
    </Card>

    <Modal ref="rejectModal" title="Reject resolution" labelClass="hidden" centered>
      <h4 class="font-medium text-lg mb-3 text-slate-900 dark:text-white">Are you sure?</h4>
      <div class="text-sm text-slate-600 dark:text-slate-300 mb-4">
        "<strong>{{ pendingReject?.market_title }}</strong>" goes back to "closed" — a new proposal can be submitted.
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
import InputGroup from "@/components/InputGroup";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal/Modal";
import Button from "@/components/Button";
import Textinput from "@/components/Textinput";
import { pushSuccess, pushError } from "@/lib/alerts";
import api from "@/lib/api";

function extractError(err) {
  const data = err?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

const STATUS_BADGE_CLASS = {
  pending: "text-warning-500 bg-warning-500",
  approved: "text-success-500 bg-success-500",
  rejected: "text-danger-500 bg-danger-500",
};

export default {
  components: { Card, InputGroup, Pagination, Modal, Button, Textinput },
  data() {
    return {
      loading: true,
      errorMessage: "",
      requests: [],
      searchTerm: "",
      current: 1,
      perPage: 10,
      perPageOptions: [
        { value: "5", label: "5" },
        { value: "10", label: "10" },
        { value: "25", label: "25" },
      ],
      approvingId: null,
      pendingReject: null,
      rejectNote: "",
      rejecting: false,
      columns: [
        { label: "Market", field: "market_title" },
        { label: "Outcome", field: "outcome_display" },
        { label: "Requested by", field: "requested_by_phone" },
        { label: "Requested at", field: "requested_at" },
        { label: "Status", field: "status" },
        { label: "", field: "action", sortable: false },
      ],
    };
  },
  computed: {
    rows() {
      return this.requests.map((request) => ({
        ...request,
        outcome_display: request.winning_choice_label || request.outcome,
        requested_by_phone: request.requested_by_phone || "—",
        requested_at: new Date(request.requested_at).toLocaleString(),
      }));
    },
  },
  async mounted() {
    await this.loadRequests();
  },
  methods: {
    statusBadgeClass(status) {
      return STATUS_BADGE_CLASS[status] || "text-slate-500 bg-slate-500";
    },
    async loadRequests() {
      this.loading = true;
      try {
        const { data } = await api.get("/market/resolution-requests/", { params: { status: "pending" } });
        this.requests = data;
      } catch (err) {
        this.errorMessage = extractError(err);
      } finally {
        this.loading = false;
      }
    },
    async approve(request) {
      if (this.approvingId) return;
      this.approvingId = request.id;
      try {
        await api.post(`/market/resolution-requests/${request.id}/approve/`);
        pushSuccess("Market resolved.");
        this.requests = this.requests.filter((r) => r.id !== request.id);
      } catch (err) {
        pushError(extractError(err));
      } finally {
        this.approvingId = null;
      }
    },
    openRejectModal(request) {
      this.pendingReject = request;
      this.rejectNote = "";
      this.$refs.rejectModal.openModal();
    },
    async confirmReject() {
      if (this.rejecting || !this.pendingReject) return;
      this.rejecting = true;
      try {
        await api.post(`/market/resolution-requests/${this.pendingReject.id}/reject/`, {
          note: this.rejectNote.trim(),
        });
        pushSuccess("Resolution rejected.");
        this.requests = this.requests.filter((r) => r.id !== this.pendingReject.id);
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
