<template>
  <div class="alert-toast-stack">
    <Alert
      v-for="a in alerts"
      :key="a.id"
      :type="a.type"
      :icon="a.icon"
      dismissible
      customClass="shadow-lg"
    >
      {{ a.message }}
    </Alert>
  </div>
</template>
<script>
import Alert from "./index.vue";
import { alerts } from "@/lib/alerts";

export default {
  name: "AlertToasts",
  components: { Alert },
  data() {
    return { alerts };
  },
};
</script>
<style scoped>
.alert-toast-stack {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 360px;
  max-width: calc(100vw - 40px);
}

/* Alert's "-light" types (success-light, danger-light, ...) pair
   bg-{color}-500 bg-opacity-[14%] with text-{color}-500 — same-hue text on a
   deliberately pale tint, meant for a banner embedded in a card's own
   background. Floating over arbitrary page content instead, that
   translucency lets whatever's underneath bleed through and wreck contrast.
   Forcing the background to full opacity alone would make it worse (same
   color text and background at 100% opacity), so this also switches to
   white text, matching how Alert's own "solid" types (success/danger/...)
   already pair a full-opacity background with text-white. Scoped to the
   toast stack only — every other inline usage of Alert keeps its intended
   translucent look. */
.alert-toast-stack :deep([class*="bg-opacity-"]) {
  --tw-bg-opacity: 1 !important;
  color: #fff !important;
}
</style>
