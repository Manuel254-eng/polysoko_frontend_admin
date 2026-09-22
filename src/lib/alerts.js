import { ref } from "vue";

// Backs the floating top-right toast stack (see components/Alert/AlertToasts.vue)
// with the project's own traced Alert component, rather than a separate toast
// library — every view pushes into this same list after an API call succeeds
// or fails instead of rolling its own inline success/error state.
export const alerts = ref([]);

let nextId = 1;

export function pushAlert({ type = "success-light", message, icon, timeout = 4000 }) {
  const id = nextId++;
  alerts.value.push({ id, type, message, icon });
  if (timeout) {
    setTimeout(() => dismissAlert(id), timeout);
  }
  return id;
}

export function dismissAlert(id) {
  alerts.value = alerts.value.filter((a) => a.id !== id);
}

export function pushSuccess(message, timeout = 3500) {
  return pushAlert({ type: "success-light", icon: "heroicons-outline:check-circle", message, timeout });
}

export function pushError(message, timeout = 5500) {
  return pushAlert({ type: "danger-light", icon: "heroicons-outline:exclamation-circle", message, timeout });
}
