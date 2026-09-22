import auth from "@/middleware/auth";
import guest from "@/middleware/guest";

const routes = [
  {
    path: "/",
    redirect: () => (localStorage.activeUser ? "/app/home" : "/login"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/login/index.vue"),
    meta: {
      middleware: [guest],
    },
  },
  {
    path: "/app",
    name: "Layout",
    redirect: "/app/home",
    component: () => import("@/Layout/index.vue"),
    meta: {
      middleware: [auth],
    },
    children: [
      {
        path: "home",
        name: "home",
        component: () => import("@/views/home/index.vue"),
        meta: {
          hide: true,
        },
      },
      {
        path: "users",
        name: "users",
        component: () => import("@/views/users/index.vue"),
      },
      {
        path: "users/create",
        name: "users-create",
        component: () => import("@/views/users/create.vue"),
      },
      {
        path: "markets",
        name: "markets",
        component: () => import("@/views/markets/index.vue"),
      },
      {
        path: "markets/create",
        name: "markets-create",
        component: () => import("@/views/markets/create.vue"),
      },
      {
        path: "markets/categories",
        name: "market-categories",
        component: () => import("@/views/markets/categories/index.vue"),
      },
      {
        path: "markets/categories/create",
        name: "market-categories-create",
        component: () => import("@/views/markets/categories/create.vue"),
      },
      {
        path: "markets/:id",
        name: "market-details",
        component: () => import("@/views/markets/view.vue"),
        meta: {
          hide: true,
        },
      },
      {
        path: "markets/resolution-requests",
        name: "market-resolution-requests",
        component: () => import("@/views/markets/resolution-requests/index.vue"),
      },
      {
        path: "bets",
        name: "bets-dashboard",
        component: () => import("@/views/bets/dashboard.vue"),
      },
      {
        path: "bets/list",
        name: "bets-list",
        component: () => import("@/views/bets/list.vue"),
      },
      {
        path: "accounting/accounts",
        name: "accounting-accounts",
        component: () => import("@/views/accounting/accounts/index.vue"),
      },
      {
        path: "accounting/accounts/:code",
        name: "accounting-account-detail",
        component: () => import("@/views/accounting/accounts/view.vue"),
        meta: {
          hide: true,
        },
      },
      {
        path: "accounting/reserve/add",
        name: "accounting-reserve-add",
        component: () => import("@/views/accounting/reserve/add.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)",
    name: "404",
    component: () => import("@/views/404.vue"),
  },
];

export default routes;
