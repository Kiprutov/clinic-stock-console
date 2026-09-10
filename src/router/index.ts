import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth';


declare module 'vue-router' {
    interface RouteMeta {
        public?: boolean;
    }
}

const routes = [
  {
    path: '/login',
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: {
      public: true,
  },
  },
  {
    path: '/',
    name: "stock-list",
    component: () => import("@/views/StockListView.vue"),
  },
  {
    path: '/items/:id',
    name: "item-detail",
    component: () => import("@/views/ItemDetailView.vue"),
    props: true,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let hasRehydrated = false;

router.beforeEach(async (to) => {
  const { isAuthenticated, fetchCurrentUser } = useAuth();

  if (!hasRehydrated) {
    await fetchCurrentUser();
    hasRehydrated = true;
  }

  const isPublicRoute = to.meta.public === true
  
  if (!isPublicRoute && !isAuthenticated.value) {
    //not logged in and trying to reach protected route, redirect to login
    return { 
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  //already logged in and trying to reach login route, redirect to stock-list
  if (isPublicRoute && isAuthenticated.value) {
    return { name: "stock-list" };
  }
  
  

  return true;
});

export default router
