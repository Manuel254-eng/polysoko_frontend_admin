<template>
  <div>
    <Card noborder>
      <div class="md:flex justify-between pb-6 md:space-y-0 space-y-3 items-center">
        <h5>{{ canReview ? "Market proposals" : "My proposals" }}</h5>
        <div class="flex flex-wrap items-center gap-3">
          <InputGroup v-model="searchTerm" placeholder="Search title or category" type="text" prependIcon="heroicons-outline:search" merged />
          <router-link v-if="canPropose" :to="{ name: 'proposals-create' }" class="btn btn-dark btn-sm">
            Propose a market
          </router-link>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-5">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="btn btn-sm"
          :class="status === tab.value ? 'btn-dark' : 'btn-outline-dark'"
          @click="status = tab.value"
        >
          {{ tab.label }}
        </button>
        <label v-if="canPropose && canReview" class="ltr:ml-auto rtl:mr-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input v-model="mineOnly" type="checkbox" class="h-4 w-4" /> Only mine
        </label>
      </div>

      <div v-if="loading" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">Loading…</div>
      <div v-else-if="errorMessage" class="text-danger-500 text-sm py-10 text-center">{{ errorMessage }}</div>
      <div v-else-if="rows.length === 0" class="text-slate-500 dark:text-slate-400 text-sm py-10 text-center">
        {{ emptyMessage }}
      </div>
      <vue-good-table
        v-else
        :columns="columns"
        :rows="rows"
        styleClass="vgt-table bordered"
        :pagination-options="{ enabled: true, perPage }"
        :search-options="{ enabled: true, externalQuery: searchTerm }"
      >
        <template v-slot:table-row="props">
          <router-link
            v-if="props.column.field === 'title'"
            :to="{ name: 'proposal-details', params: { id: props.row.id } }"
            class="text-slate-600 dark:text-slate-300 font-medium hover:underline"
          >
            {{ props.row.title }}
          </router-link>
          <span v-else-if="props.column.field === 'status'" class="block w-full">
            <span
              class="inline-block px-3 min-w-[110px] text-center py-1 rounded-[999px] bg-opacity-25"
              :class="STATUS_BADGE_CLASS[props.row.status]"
            >
              {{ STATUS_LABELS[props.row.status] }}
            </span>
          </span>
          <span v-else-if="props.column.field === 'action'">
            <router-link
              :to="{ name: 'proposal-details', params: { id: props.row.id } }"
              class="btn btn-sm"
              :class="canReview && props.row.status === 'pending' ? 'btn-dark' : 'btn-outline-dark'"
            >
              {{ canReview && props.row.status === "pending" ? "Review" : "Open" }}
            </router-link>
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
  </div>
</template>
<script>
import Card from "@/components/Card";
import InputGroup from "@/components/InputGroup";
import Pagination from "@/components/Pagination";
import api from "@/lib/api";
import { extractError } from "@/lib/errors";
import { useAuthStore } from "@/store/auth";
import { STATUS_BADGE_CLASS, STATUS_LABELS, describeOdds, formatDateTime } from "./shared";

export default {
  components: { Card, InputGroup, Pagination },
  data() {
    const auth = useAuthStore();
    const canReview = auth.can("REVIEW_MARKET_PROPOSAL");
    return {
      STATUS_BADGE_CLASS,
      STATUS_LABELS,
      canReview,
      canPropose: auth.can("PROPOSE_MARKET"),
      // Reviewers start on the queue; researchers on everything of theirs.
      status: canReview ? "pending" : "",
      mineOnly: !canReview,
      loading: true,
      errorMessage: "",
      proposals: [],
      searchTerm: "",
      current: 1,
      perPage: 10,
      perPageOptions: [
        { value: "10", label: "10" },
        { value: "25", label: "25" },
        { value: "50", label: "50" },
      ],
      tabs: [
        { value: "pending", label: "Pending review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "withdrawn", label: "Withdrawn" },
        { value: "", label: "All" },
      ],
    };
  },
  computed: {
    columns() {
      const columns = [
        { label: "Market", field: "title" },
        { label: "Category", field: "category_name" },
        { label: "Opening odds", field: "odds", sortable: false },
        { label: "Closes", field: "closes" },
        { label: "Submitted", field: "submitted" },
      ];
      if (!this.mineOnly) columns.push({ label: "Researcher", field: "proposed_by_name" });
      columns.push({ label: "Status", field: "status" }, { label: "", field: "action", sortable: false });
      return columns;
    },
    rows() {
      return this.proposals.map((proposal) => ({
        ...proposal,
        odds: describeOdds(proposal),
        closes: formatDateTime(proposal.close_at),
        submitted: formatDateTime(proposal.submitted_at),
      }));
    },
    emptyMessage() {
      if (this.canReview && this.status === "pending" && !this.mineOnly) return "No proposals are waiting for review.";
      return this.mineOnly ? "You haven't proposed any markets here yet." : "No proposals here.";
    },
  },
  watch: {
    status() {
      this.load();
    },
    mineOnly() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.errorMessage = "";
      try {
        const params = { page_size: 100 };
        if (this.status) params.status = this.status;
        if (this.mineOnly) params.mine = "true";
        const { data } = await api.get("/market/proposals/", { params });
        this.proposals = data.results;
        this.current = 1;
      } catch (err) {
        this.errorMessage = extractError(err);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
