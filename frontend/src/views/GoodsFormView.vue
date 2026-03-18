<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGoodsStore } from '@/stores/goods'
import * as api from '@/api/client'
import type { GoodsPayload, RelatedGoodsItem } from '@/types/api'

const router = useRouter()
const route = useRoute()
const store = useGoodsStore()

const isNew = computed(() => route.name === 'goods-new')
const goodsId = computed(() =>
  route.name === 'goods-edit' ? Number(route.params.id) : 0
)

const form = ref({
  media_id: 0,
  artist_id: 0,
  title: '',
  release_date: '',
  memo: '',
  is_owned: false,
  code_number: '',
  image_type: null as string | null,
  image_data: null as string | null,
})
/** 画像プレビュー用（data URL）。表示専用 */
const imagePreview = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const mediaOptions = ref<{ id: number; name: string }[]>([])
const artistOptions = ref<{ id: number; name: string }[]>([])

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const [mediaList, artistList] = await Promise.all([
      api.getAllMedia(),
      api.getAllArtists(),
    ])
    mediaOptions.value = mediaList
    artistOptions.value = artistList

    if (!isNew.value && goodsId.value) {
      const raw = (history.state as { goodsItem?: unknown })?.goodsItem
      const stateItem: RelatedGoodsItem | undefined =
        typeof raw === 'string'
          ? (JSON.parse(raw) as RelatedGoodsItem)
          : (raw as RelatedGoodsItem | undefined)
      const fromList =
        stateItem &&
        stateItem.media_id != null &&
        stateItem.artist_id != null
      try {
        const g = await api.getGoods(goodsId.value)
        form.value = {
          media_id: g.media_id,
          artist_id: g.artist_id,
          title: g.title,
          release_date: g.release_date ?? '',
          memo: g.memo ?? '',
          is_owned: g.is_owned,
          code_number: g.code_number ?? '',
          image_type: g.image_type ?? null,
          image_data: g.image_data ?? null,
        }
        updateImagePreview(g.image_type, g.image_data)
      } catch {
        if (fromList && stateItem) {
          form.value = {
            media_id: stateItem.media_id!,
            artist_id: stateItem.artist_id!,
            title: stateItem.title,
            release_date: stateItem.release_date ?? '',
            memo: stateItem.memo ?? '',
            is_owned: stateItem.is_owned,
            code_number: stateItem.code_number ?? '',
            image_type: null,
            image_data: null,
          }
        } else {
          error.value =
            '商品の取得に失敗しました。一覧から選択して編集してください。'
        }
      }
    } else {
      if (store.selectedMediaId != null) form.value.media_id = store.selectedMediaId
      if (store.selectedArtistId != null) form.value.artist_id = store.selectedArtistId
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})

async function submit() {
  if (!form.value.title.trim()) {
    error.value = 'タイトルを入力してください。'
    return
  }
  if (!form.value.media_id || !form.value.artist_id) {
    error.value = '媒体とアーティストを選択してください。'
    return
  }
  saving.value = true
  error.value = ''
  const payload: GoodsPayload = {
    media_id: form.value.media_id,
    artist_id: form.value.artist_id,
    title: form.value.title.trim(),
    release_date: form.value.release_date || undefined,
    memo: form.value.memo.trim() || null,
    is_owned: form.value.is_owned,
    code_number: form.value.code_number.trim() || null,
    image_type: form.value.image_type || undefined,
    image_data: form.value.image_data || undefined,
  }
  try {
    if (isNew.value) {
      await api.createGoods(payload)
    } else {
      await api.updateGoods(goodsId.value, payload)
    }
    // 一覧を最新状態にするため、選択状態と goods を取り直す
    if (store.selectedPersonId != null) {
      store.setSelectedArtist(form.value.artist_id)
      store.setSelectedMedia(form.value.media_id)
      const mediaIds =
        form.value.media_id != null && form.value.media_id !== 0
          ? [form.value.media_id]
          : store.relatedMedia.map((m) => m.id)
      if (mediaIds.length > 0) {
        await store.fetchRelatedGoods(store.selectedPersonId, mediaIds)
      }
    }
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/')
}

function updateImagePreview(type: string | null | undefined, data: string | null | undefined) {
  if (!data) {
    imagePreview.value = null
    return
  }
  if (data.startsWith('data:')) {
    imagePreview.value = data
    return
  }
  const ext = type === 'image/png' ? 'png' : 'jpeg'
  imagePreview.value = `data:image/${ext};base64,${data}`
}

function onImageChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    form.value.image_type = null
    form.value.image_data = null
    imagePreview.value = null
    return
  }
  const type = file.type === 'image/png' || file.type === 'image/jpeg' ? file.type : 'image/jpeg'
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result as string
    const base64 = result.includes(',') ? result.split(',')[1]! : result
    form.value.image_type = type
    form.value.image_data = base64
    imagePreview.value = `data:${type};base64,${base64}`
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  form.value.image_type = null
  form.value.image_data = null
  imagePreview.value = null
  if (imageInput.value) imageInput.value.value = ''
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <button type="button" class="back" aria-label="戻る" @click="goBack">
        ← 戻る
      </button>
    </nav>
    <h1 class="title">{{ isNew ? 'Goods追加' : 'Goods編集' }}</h1>

    <p v-if="loading" class="muted">読込中…</p>
    <template v-else>
      <p v-if="error" class="error">{{ error }}</p>
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="label">媒体</span>
          <select v-model.number="form.media_id" required class="input">
            <option :value="0">選択してください</option>
            <option
              v-for="m in mediaOptions"
              :key="m.id"
              :value="m.id"
            >
              {{ m.name }}
            </option>
          </select>
        </label>
        <label class="field">
          <span class="label">アーティスト</span>
          <select v-model.number="form.artist_id" required class="input">
            <option :value="0">選択してください</option>
            <option
              v-for="a in artistOptions"
              :key="a.id"
              :value="a.id"
            >
              {{ a.name }}
            </option>
          </select>
        </label>
        <label class="field">
          <span class="label">タイトル</span>
          <input
            v-model="form.title"
            type="text"
            class="input"
            required
            placeholder="タイトル"
          />
        </label>
        <label class="field">
          <span class="label">リリース日</span>
          <input
            v-model="form.release_date"
            type="date"
            class="input"
          />
        </label>
        <label class="field">
          <span class="label">所持</span>
          <input
            v-model="form.is_owned"
            type="checkbox"
            class="checkbox"
          />
        </label>
        <label class="field">
          <span class="label">品番</span>
          <input
            v-model="form.code_number"
            type="text"
            class="input"
            placeholder="品番"
          />
        </label>
        <div class="field">
          <span class="label">画像</span>
          <div class="image-field">
            <input
              ref="imageInput"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              class="input-file"
              @change="onImageChange"
            />
            <div v-if="imagePreview" class="image-preview-wrap">
              <img :src="imagePreview" alt="プレビュー" class="image-preview" />
              <button
                type="button"
                class="btn btn-small"
                @click="clearImage"
              >
                削除
              </button>
            </div>
            <p v-else class="image-hint">PNG / JPEG（任意）</p>
          </div>
        </div>
        <label class="field">
          <span class="label">メモ</span>
          <textarea
            v-model="form.memo"
            class="input textarea"
            rows="3"
            placeholder="メモ"
          />
        </label>
        <div class="actions">
          <button
            type="submit"
            class="btn primary"
            :disabled="saving"
          >
            {{ saving ? '保存中…' : isNew ? '追加' : '更新' }}
          </button>
        </div>
      </form>
    </template>
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
  font-size: 1.35rem;
  margin-bottom: 1rem;
}
.error {
  color: #c00;
  margin-bottom: 0.5rem;
}
.muted {
  color: var(--color-text);
  opacity: 0.7;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
.input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
  min-height: 44px;
}
.textarea {
  min-height: 80px;
  resize: vertical;
}
.checkbox {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: hsla(160, 100%, 37%, 1);
}
.actions {
  margin-top: 0.5rem;
}
.btn {
  padding: 0.75rem 1.25rem;
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
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.image-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-file {
  font-size: 0.95rem;
  color: var(--color-text);
}
.image-preview-wrap {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.image-preview {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  object-fit: contain;
  background: var(--color-background-mute);
}
.btn-small {
  padding: 0.4rem 0.75rem;
  font-size: 0.9rem;
}
.image-hint {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0;
}
</style>
