// Shared by the proposal pages.

export const STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_BADGE_CLASS = {
  pending: "text-warning-500 bg-warning-500",
  approved: "text-success-500 bg-success-500",
  rejected: "text-danger-500 bg-danger-500",
  withdrawn: "text-slate-500 bg-slate-500",
};

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
}

// A proposal's opening odds in words: "Yes 60%" or "A 50% · B 30% · C 20%".
export function describeOdds(proposal) {
  if (proposal.is_custom) {
    return (proposal.choices || [])
      .map((choice) => `${choice.label} ${(Number(choice.probability) * 100).toFixed(0)}%`)
      .join(" · ");
  }
  return proposal.yes_probability != null ? `Yes ${(Number(proposal.yes_probability) * 100).toFixed(0)}%` : "—";
}
