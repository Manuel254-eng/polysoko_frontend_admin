<template>
  <router-view />
  <AlertToasts />
</template>

<script>
import { useThemeSettingsStore } from "@/store/themeSettings";
import AlertToasts from "@/components/Alert/AlertToasts.vue";

export default {
  components: { AlertToasts },
  mounted() {
    this.$store.themeSettingsStore = useThemeSettingsStore()
  }
}
</script>

<style></style>
