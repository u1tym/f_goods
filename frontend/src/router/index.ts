import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'GOODS' },
    },
    {
      path: '/goods/new',
      name: 'goods-new',
      component: () => import('../views/GoodsFormView.vue'),
      meta: { title: 'Goods追加' },
    },
    {
      path: '/goods/:id/edit',
      name: 'goods-edit',
      component: () => import('../views/GoodsFormView.vue'),
      meta: { title: 'Goods編集' },
    },
  ],
})

router.afterEach((to) => {
  const title = (to.meta?.title as string) ?? 'GOODS'
  document.title = title
})

export default router
