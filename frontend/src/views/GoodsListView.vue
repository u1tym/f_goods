<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGoodsStore } from '@/stores/goods'
import type { RelatedGoodsItem } from '@/types/api'
import goodsIcon from '../../images/GOODS.png'
import portalIcon from '../../images/PORTAL.png'

const router = useRouter()
const store = useGoodsStore()

const personId = computed(() => store.selectedPersonId)
const displayGoods = computed(() => store.displayGoods)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const isSelectionConfirmed = computed(() => store.isSelectionConfirmed)

onMounted(() => {
  if (personId.value == null || !isSelectionConfirmed.value) {
    router.replace('/')
    return
  }
})

function goBack() {
  store.setSelectedMedia(null)
  router.push('/media')
}

function imageUrl(item: RelatedGoodsItem): string {
  const data = item.image_data
  const type = item.image_type
  if (!data) return ''
  // API 側が data URL を返す場合と Base64 のみを返す場合の両方に対応
  if (data.startsWith('data:')) return data
  const ext = type === 'image/png' ? 'png' : 'jpeg'
  return `data:image/${ext};base64,${data}`
}

function toEdit(item: RelatedGoodsItem) {
  router.push({
    name: 'goods-edit',
    params: { id: String(item.goods_id) },
    // HistoryStateValue 制約のため JSON 文字列で渡す
    state: { goodsItem: JSON.stringify(item) },
  })
}

function toNew() {
  router.push('/goods/new')
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <button type="button" class="back" aria-label="戻る" @click="goBack">
        ← 戻る
      </button>
    </nav>
    <div class="header">
      <h1 class="title">
        <img :src="goodsIcon" alt="" class="title-icon" />
        GOODS
      </h1>
      <a href="../m.html" class="portal-link" aria-label="ポータルへ移動">
        <img :src="portalIcon" alt="" class="portal-icon" />
      </a>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <template v-else-if="!isSelectionConfirmed">
      <p class="muted">人物・アーティスト・媒体を選択してください。</p>
    </template>
    <template v-else>
      <p v-if="loading" class="muted">読込中…</p>
      <template v-else>
        <ul v-if="displayGoods.length > 0" class="goods-list">
          <li
            v-for="g in displayGoods"
            :key="g.goods_id"
            class="goods-item"
            role="button"
            tabindex="0"
            @click="toEdit(g)"
            @keydown.enter="toEdit(g)"
          >
            <div class="thumb">
              <img
                v-if="imageUrl(g)"
                :src="imageUrl(g)"
                :alt="g.title"
                class="thumb-img"
              />
              <span v-else class="thumb-placeholder">No image</span>
            </div>
            <div class="body">
              <div class="title-row">{{ g.title }}</div>
              <div class="meta">
                {{ g.media_name }} / {{ g.release_date }}
              </div>
              <div class="owned">
                <span v-if="g.is_owned" class="badge owned">所持</span>
                <span v-else class="badge">未所持</span>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="muted">該当するGoodsはありません。</p>
      </template>
    </template>

    <button type="button" class="fab-add" aria-label="新規追加" @click="toNew">
      +
    </button>
  </div>
</template>

<style scoped>
.page {
  padding: 1rem;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
}
.nav {
  margin-bottom: 0.75rem;
}
.back {
  background: none;
  border: none;
  color: var(--color-text);
  opacity: 0.9;
  font-size: 1rem;
  padding: 0.25rem 0;
  cursor: pointer;
  touch-action: manipulation;
}
.title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  margin-bottom: 0.5rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.title-icon {
  width: 1.6rem;
  height: 1.6rem;
  object-fit: cover;
  border-radius: 4px;
}
.portal-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}
.portal-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}
.error {
  color: #c00;
  margin: 0.5rem 0;
}
.muted {
  color: var(--color-text);
  opacity: 0.7;
  margin: 0.5rem 0;
}
.goods-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.goods-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  touch-action: manipulation;
  align-items: flex-start;
}
.goods-item:active {
  opacity: 0.9;
}
.thumb {
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-background-mute);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.7rem;
  color: var(--color-text);
  opacity: 0.6;
}
.body {
  flex: 1;
  min-width: 0;
}
.title-row {
  font-weight: 600;
  margin-bottom: 0.25rem;
  word-break: break-word;
}
.meta {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-bottom: 0.35rem;
}
.owned {
  margin-top: 0.25rem;
}
.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
  background: var(--color-background-mute);
  white-space: nowrap;
}
.badge.owned {
  background: hsla(160, 100%, 37%, 0.25);
  color: hsla(160, 100%, 37%, 1);
}
.fab-add {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0));
  width: 3.25rem;
  height: 3.25rem;
  border: none;
  border-radius: 999px;
  font-size: 2rem;
  line-height: 1;
  color: #fff;
  background: hsla(160, 100%, 37%, 0.6);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  z-index: 15;
}
.fab-add:active {
  opacity: 0.9;
}
</style>
