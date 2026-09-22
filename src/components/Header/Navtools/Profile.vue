<template>
  <Dropdown classMenuItems=" w-[180px] top-[58px] ">
    <div class="flex items-center">
      <div class="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
        <div
          class="lg:h-8 lg:w-8 h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center"
        >
          <Icon icon="heroicons-outline:user" class="text-lg" />
        </div>
      </div>
      <div
        class="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap"
      >
        <span
          class="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block"
          >{{ displayName }}</span
        >
        <span class="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]"
          ><Icon icon="heroicons-outline:chevron-down"></Icon
        ></span>
      </div>
    </div>
    <template #menus>
      <MenuItem v-slot="{ active }" v-for="(item, i) in ProfileMenu" :key="i">
        <div
          type="button"
          :class="`${
            active
              ? 'bg-slate-100 dark:bg-slate-700 dark:bg-opacity-70 text-slate-900 dark:text-slate-300'
              : 'text-slate-600 dark:text-slate-300'
          } `"
          class="inline-flex items-center space-x-2 rtl:space-x-reverse w-full px-4 py-2 first:rounded-t last:rounded-b font-normal cursor-pointer"
          @click="item.link()"
        >
          <div class="flex-none text-lg">
            <Icon :icon="item.icon" />
          </div>
          <div class="flex-1 text-sm">
            {{ item.label }}
          </div>
        </div>
      </MenuItem>
    </template>
  </Dropdown>
</template>
<script>
import { MenuItem } from "@headlessui/vue";
import Dropdown from "@/components/Dropdown";
import Icon from "@/components/Icon";
import { useAuthStore } from "@/store/auth";
export default {
  components: {
    Icon,
    Dropdown,
    MenuItem,
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      ProfileMenu: [
        {
          label: "Logout",
          icon: "heroicons-outline:login",
          link: async () => {
            await this.authStore.logout();
            this.$router.push("/login");
          },
        },
      ],
    };
  },
  computed: {
    // first_name/last_name are blank=True on the backend — an older staff
    // account may never have had them filled in, so this falls back to the
    // phone number rather than showing a blank/undefined name.
    displayName() {
      const user = this.authStore.user;
      if (!user) return "";
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
      return fullName || `${user.country_code}${user.phone_number}`;
    },
  },
};
</script>
<style lang=""></style>
