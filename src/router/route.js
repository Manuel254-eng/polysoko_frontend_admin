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
        path: "urgent-actions",
        name: "urgent-actions",
        component: () => import("@/views/urgent-actions/index.vue"),
        meta: {
          permission: "VIEW_REPORTS",
        },
      },
      {
        path: "users",
        name: "users",
        component: () => import("@/views/users/index.vue"),
      },
      {
        path: "users/clients",
        name: "users-clients",
        component: () => import("@/views/users/clients.vue"),
      },
      {
        path: "testing",
        name: "testing",
        component: () => import("@/views/testing/index.vue"),
      },
      {
        path: "testing/simulate-bets",
        name: "testing-simulate-bets",
        component: () => import("@/views/testing/simulate-bets.vue"),
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
        path: "markets/campuses",
        name: "market-campuses",
        component: () => import("@/views/markets/campuses/index.vue"),
      },
      {
        path: "markets/campuses/create",
        name: "market-campuses-create",
        component: () => import("@/views/markets/campuses/create.vue"),
      },
      {
        path: "markets/campuses/:slug",
        name: "market-campuses-view",
        component: () => import("@/views/markets/campuses/view.vue"),
        meta: {
          hide: true,
        },
      },

      {
        path: "markets/categories/create",
        name: "market-categories-create",
        component: () => import("@/views/markets/categories/create.vue"),
      },
      {
        path: "markets/:id/edit",
        name: "markets-edit",
        component: () => import("@/views/markets/create.vue"),
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
        path: "markets/combos",
        name: "market-combos",
        component: () => import("@/views/markets/combos/index.vue"),
      },
      {
        path: "markets/combos/create",
        name: "market-combos-create",
        component: () => import("@/views/markets/combos/create.vue"),
      },
      {
        path: "markets/combos/:id/edit",
        name: "market-combos-edit",
        component: () => import("@/views/markets/combos/create.vue"),
      },
      {
        path: "markets/combos/:id",
        name: "market-combos-view",
        component: () => import("@/views/markets/combos/view.vue"),
        meta: {
          hide: true,
        },
      },
      {
        path: "markets/jackpots",
        name: "market-jackpots",
        component: () => import("@/views/markets/jackpots/index.vue"),
      },
      {
        path: "markets/jackpots/create",
        name: "market-jackpots-create",
        component: () => import("@/views/markets/jackpots/create.vue"),
      },
      {
        path: "markets/jackpots/:id/edit",
        name: "market-jackpots-edit",
        component: () => import("@/views/markets/jackpots/create.vue"),
      },
      {
        path: "markets/jackpots/:id",
        name: "market-jackpots-view",
        component: () => import("@/views/markets/jackpots/view.vue"),
        meta: {
          hide: true,
        },
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
      {
        path: "proposals",
        name: "proposals",
        component: () => import("@/views/proposals/index.vue"),
      },
      {
        path: "proposals/create",
        name: "proposals-create",
        component: () => import("@/views/proposals/form.vue"),
      },
      {
        path: "proposals/search",
        name: "proposals-search",
        component: () => import("@/views/proposals/search.vue"),
      },
      {
        path: "proposals/:id/edit",
        name: "proposals-edit",
        component: () => import("@/views/proposals/form.vue"),
        meta: { hide: true },
      },
      {
        path: "proposals/:id",
        name: "proposal-details",
        component: () => import("@/views/proposals/view.vue"),
        meta: {
          hide: true,
        },
      },
    ],
  },
  {
    path: "/:catchAll(.*)",
    name: "404",
    component: () => import("@/views/404.vue"),
  },
];

const PROPOSALS = ["PROPOSE_MARKET", "REVIEW_MARKET_PROPOSAL"];
const ROUTE_PERMISSIONS = {
  home: "VIEW_REPORTS",
  users: "VIEW_USER",
  "users-create": "CREATE_USER",
  "users-clients": "VIEW_USER",
  testing: "CREATE_USER",
  "testing-simulate-bets": "CREATE_USER",
  markets: "UPDATE_MARKET",
  "markets-create": "CREATE_MARKET",
  "markets-edit": "UPDATE_MARKET",
  "market-details": "UPDATE_MARKET",
  "market-categories": "CREATE_MARKET_CATEGORY",
  "market-categories-create": "CREATE_MARKET_CATEGORY",
  "market-campuses": "VIEW_CAMPUS",
  "market-campuses-view": "VIEW_CAMPUS",
  "market-campuses-create": "CREATE_CAMPUS",
  "market-resolution-requests": "APPROVE_MARKET_RESOLUTION",
  "market-combos": ["CREATE_COMBO", "UPDATE_COMBO"],
  "market-combos-create": "CREATE_COMBO",
  "market-combos-view": ["CREATE_COMBO", "UPDATE_COMBO"],
  "market-combos-edit": "UPDATE_COMBO",
  "market-jackpots": ["CREATE_JACKPOT", "UPDATE_JACKPOT"],
  "market-jackpots-create": "CREATE_JACKPOT",
  "market-jackpots-view": ["CREATE_JACKPOT", "UPDATE_JACKPOT"],
  "market-jackpots-edit": "UPDATE_JACKPOT",
  "bets-dashboard": "VIEW_REPORTS",
  "bets-list": "VIEW_REPORTS",
  "accounting-accounts": "VIEW_REPORTS",
  "accounting-account-detail": "VIEW_REPORTS",
  "accounting-reserve-add": "DEPOSIT_TO_PLATFORM",
  proposals: PROPOSALS,
  "proposals-create": "PROPOSE_MARKET",
  "proposals-search": "PROPOSE_MARKET",
  "proposal-details": PROPOSALS,
  "proposals-edit": PROPOSALS,
};
for (const route of routes.find((r) => r.name === "Layout").children) {
  if (route.name in ROUTE_PERMISSIONS) {
    route.meta = { ...route.meta, permission: ROUTE_PERMISSIONS[route.name] };
  }
}

export default routes;
