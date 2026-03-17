<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGoodsStore } from '@/stores/goods'
import type { RelatedGoodsItem } from '@/types/api'

const router = useRouter()
const store = useGoodsStore()

onMounted(async () => {
  await store.fetchPersons()
})

// Person 用の v-model（空文字 ⇔ null）
const personModel = computed({
  get: () => store.selectedPersonId ?? '',
  set: (v: number | '') => {
    const id = v === '' ? null : Number(v)
    store.setSelectedPerson(id)
    if (id != null) {
      store.fetchRelatedArtists(id)
      store.fetchRelatedMedia(id)
    }
  },
})

// Artist は Person 選択後に有効。「すべて」は null（value="all"）
const artistModel = computed({
  get: () =>
    store.selectedArtistId === undefined
      ? ''
      : store.selectedArtistId === null
        ? 'all'
        : store.selectedArtistId,
  set: (v: string | number) => {
    const id =
      v === '' || v === undefined
        ? undefined
        : v === 'all'
          ? null
          : Number(v)
    store.setSelectedArtist(id)
  },
})

// Media は Artist 選択後に有効。「すべて」は null（value="all"）
const mediaModel = computed({
  get: () =>
    store.selectedMediaId === undefined
      ? ''
      : store.selectedMediaId === null
        ? 'all'
        : store.selectedMediaId,
  set: async (v: string | number) => {
    const id =
      v === '' || v === undefined
        ? undefined
        : v === 'all'
          ? null
          : Number(v)
    store.setSelectedMedia(id)
    const pid = store.selectedPersonId
    const mediaIds =
      id != null ? [id] : store.relatedMedia.map((m) => m.id)
    if (pid != null && mediaIds.length > 0) {
      await store.fetchRelatedGoods(pid, mediaIds)
    }
  },
})

const isArtistEnabled = computed(() => store.selectedPersonId != null)
const isMediaEnabled = computed(() => store.selectedArtistId !== undefined)

function imageUrl(item: RelatedGoodsItem): string {
  if (!item.image_data || !item.image_type) return ''
  const base = item.image_data
  const type = item.image_type === 'image/png' ? 'png' : 'jpeg'
  return `data:image/${type};base64,${base}`
}

function toEdit(item: RelatedGoodsItem) {
  router.push({
    name: 'goods-edit',
    params: { id: String(item.goods_id) },
    state: { goodsItem: item },
  })
}

function toNew() {
  router.push('/goods/new')
}
</script>

<template>
  <div class="page">
    <h1 class="title">Goods管理</h1>

    <div class="filters">
      <label class="field">
        <span class="label">Person</span>
        <select
          v-model="personModel"
          class="select"
          aria-label="人物を選択"
        >
          <option value="">選択してください</option>
          <option
            v-for="p in store.persons"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span class="label">Artist</span>
        <select
          v-model="artistModel"
          class="select"
          :disabled="!isArtistEnabled"
          aria-label="アーティストを選択"
        >
          <option value="">選択してください</option>
          <option value="all">すべて</option>
          <option
            v-for="a in store.relatedArtists"
            :key="a.id"
            :value="a.id"
          >
            {{ a.name }}
          </option>
        </select>
      </label>
      <label class="field">
        <span class="label">Media</span>
        <select
          v-model="mediaModel"
          class="select"
          :disabled="!isMediaEnabled"
          aria-label="媒体を選択"
        >
          <option value="">選択してください</option>
          <option value="all">すべて</option>
          <option
            v-for="m in store.relatedMedia"
            :key="m.id"
            :value="m.id"
          >
            {{ m.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="toolbar">
      <button
        type="button"
        class="btn primary"
        @click="toNew"
      >
        新規追加
      </button>
    </div>

    <p v-if="store.error" class="error">{{ store.error }}</p>
    <template v-else-if="!store.isSelectionConfirmed">
      <p class="muted">Person・Artist・Mediaを選択すると一覧が表示されます。</p>
    </template>
    <template v-else>
      <p v-if="store.loading" class="muted">読込中…</p>
      <template v-else>
        <ul v-if="store.displayGoods.length > 0" class="goods-list">
          <li
            v-for="g in store.displayGoods"
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
  </div>
</template>

<style scoped>
.page {
  padding: 1rem;
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
}
.title {
  font-size: 1.35rem;
  margin-bottom: 1rem;
}
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.label {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.9;
}
.select {
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
  min-height: 44px;
}
.select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--color-background-mute);
}
.toolbar {
  margin-bottom: 1rem;
}
.btn {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  border: 1px solid var(--color-border);
  background: var(--color-background-mute);
  color: var(--color-text);
}
.btn.primary {
  background: hsla(160, 100%, 37%, 0.2);
  border-color: hsla(160, 100%, 37%, 0.5);
  color: hsla(160, 100%, 37%, 1);
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
}
.badge.owned {
  background: hsla(160, 100%, 37%, 0.25);
  color: hsla(160, 100%, 37%, 1);
}
</style>
