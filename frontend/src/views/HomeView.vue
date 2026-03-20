<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGoodsStore } from '@/stores/goods'
import type { RelatedGoodsItem, Artist, Media, Person } from '@/types/api'
import * as api from '@/api/client'
import goodsIcon from '../../images/GOODS.jpg'
import portalIcon from '../../images/PORTAL.jpg'
import configIcon from '../../images/CONFIG.jpg'

const router = useRouter()
const store = useGoodsStore()
const allPersons = ref<Person[]>([])
const allArtists = ref<Artist[]>([])
const allMedia = ref<Media[]>([])
const settingsOpen = ref(false)
const settingsError = ref('')
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const activeMenu = ref<
  | ''
  | 'person-add'
  | 'person-edit'
  | 'artist-add'
  | 'artist-edit'
  | 'media-add'
  | 'media-edit'
>('')

const personAddName = ref('')
const personEditId = ref<number | null>(null)
const personEditName = ref('')
const artistAddName = ref('')
const artistEditId = ref<number | null>(null)
const artistEditName = ref('')
const artistEditPersonIds = ref<number[]>([])
const mediaAddName = ref('')
const mediaEditId = ref<number | null>(null)
const mediaEditName = ref('')

onMounted(async () => {
  await store.fetchPersons()
  await refreshMasterData()
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

async function refreshMasterData() {
  const [persons, artists, media] = await Promise.all([
    api.getPersons(),
    api.getAllArtists(),
    api.getAllMedia(),
  ])
  allPersons.value = persons
  allArtists.value = artists
  allMedia.value = media
}

function openSettings() {
  settingsOpen.value = true
  settingsError.value = ''
  activeMenu.value = ''
}

function closeSettings() {
  settingsOpen.value = false
  settingsError.value = ''
  activeMenu.value = ''
}

function setMenu(
  menu:
    | 'person-add'
    | 'person-edit'
    | 'artist-add'
    | 'artist-edit'
    | 'media-add'
    | 'media-edit'
) {
  settingsError.value = ''
  activeMenu.value = menu
}

watch(personEditId, (id) => {
  const selected = allPersons.value.find((p) => p.id === id)
  personEditName.value = selected?.name ?? ''
})

watch(mediaEditId, (id) => {
  const selected = allMedia.value.find((m) => m.id === id)
  mediaEditName.value = selected?.name ?? ''
})

watch(artistEditId, async (id) => {
  artistEditName.value = ''
  artistEditPersonIds.value = []
  if (id == null) return
  settingsLoading.value = true
  settingsError.value = ''
  try {
    const detail = await api.getArtistDetail(id)
    artistEditName.value = detail.name
    artistEditPersonIds.value = detail.persons.map((p) => p.id)
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsLoading.value = false
  }
})

async function submitPersonAdd() {
  if (!personAddName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.createPerson(personAddName.value.trim())
    personAddName.value = ''
    await refreshMasterData()
    await store.fetchPersons()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}

async function submitPersonEdit() {
  if (personEditId.value == null || !personEditName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.updatePerson(personEditId.value, personEditName.value.trim())
    await refreshMasterData()
    await store.fetchPersons()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}

async function submitArtistAdd() {
  if (!artistAddName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.createArtist(artistAddName.value.trim())
    artistAddName.value = ''
    await refreshMasterData()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}

async function submitArtistEdit() {
  if (artistEditId.value == null || !artistEditName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.updateArtist(
      artistEditId.value,
      artistEditName.value.trim(),
      artistEditPersonIds.value
    )
    await refreshMasterData()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}

async function submitMediaAdd() {
  if (!mediaAddName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.createMedia(mediaAddName.value.trim())
    mediaAddName.value = ''
    await refreshMasterData()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}

async function submitMediaEdit() {
  if (mediaEditId.value == null || !mediaEditName.value.trim()) return
  settingsSaving.value = true
  settingsError.value = ''
  try {
    await api.updateMedia(mediaEditId.value, mediaEditName.value.trim())
    await refreshMasterData()
  } catch (e) {
    settingsError.value = e instanceof Error ? e.message : String(e)
  } finally {
    settingsSaving.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="header">
      <h1 class="title">
        <img :src="goodsIcon" alt="" class="title-icon" />
        GOODS
      </h1>
      <div class="header-actions">
        <button
          type="button"
          class="icon-button"
          aria-label="設定メニューを開く"
          @click="openSettings"
        >
          <img :src="configIcon" alt="" class="portal-icon" />
        </button>
        <a href="../m.html" class="portal-link" aria-label="ポータルへ移動">
          <img :src="portalIcon" alt="" class="portal-icon" />
        </a>
      </div>
    </div>

    <div class="filters">
      <div class="field row">
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
      </div>
      <div class="field row">
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
      </div>
      <div class="field row">
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
      </div>
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
              <div class="row-top">
                <div class="text">
                  <div class="title-row">{{ g.title }}</div>
                  <div class="meta">
                    {{ g.media_name }} / {{ g.release_date }}
                  </div>
                </div>
                <div class="owned">
                  <span v-if="g.is_owned" class="badge owned">所持</span>
                  <span v-else class="badge">未所持</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="muted">該当するGoodsはありません。</p>
      </template>
    </template>

    <div v-if="settingsOpen" class="overlay" @click.self="closeSettings">
      <div class="settings-modal" role="dialog" aria-modal="true">
        <div class="settings-header">
          <h2 class="settings-title">設定メニュー</h2>
          <button type="button" class="close-btn" @click="closeSettings">×</button>
        </div>

        <p v-if="settingsError" class="error">{{ settingsError }}</p>

        <div class="menu-grid">
          <button type="button" class="btn" @click="setMenu('person-add')">person追加</button>
          <button type="button" class="btn" @click="setMenu('person-edit')">person編集</button>
          <button type="button" class="btn" @click="setMenu('artist-add')">artist追加</button>
          <button type="button" class="btn" @click="setMenu('artist-edit')">artist編集</button>
          <button type="button" class="btn" @click="setMenu('media-add')">media追加</button>
          <button type="button" class="btn" @click="setMenu('media-edit')">media編集</button>
        </div>

        <div v-if="activeMenu === 'person-add'" class="editor">
          <h3 class="editor-title">person追加</h3>
          <input v-model="personAddName" type="text" class="select" placeholder="人物名" />
          <button type="button" class="btn primary" :disabled="settingsSaving" @click="submitPersonAdd">保存</button>
        </div>

        <div v-if="activeMenu === 'person-edit'" class="editor">
          <h3 class="editor-title">person編集</h3>
          <select v-model.number="personEditId" class="select">
            <option :value="null">選択してください</option>
            <option v-for="p in allPersons" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <input v-model="personEditName" type="text" class="select" placeholder="新しい人物名" />
          <button type="button" class="btn primary" :disabled="settingsSaving || personEditId == null" @click="submitPersonEdit">保存</button>
        </div>

        <div v-if="activeMenu === 'artist-add'" class="editor">
          <h3 class="editor-title">artist追加</h3>
          <input v-model="artistAddName" type="text" class="select" placeholder="アーティスト名" />
          <button type="button" class="btn primary" :disabled="settingsSaving" @click="submitArtistAdd">保存</button>
        </div>

        <div v-if="activeMenu === 'artist-edit'" class="editor">
          <h3 class="editor-title">artist編集</h3>
          <select v-model.number="artistEditId" class="select">
            <option :value="null">選択してください</option>
            <option v-for="a in allArtists" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
          <input v-model="artistEditName" type="text" class="select" placeholder="新しいアーティスト名" />
          <div class="person-checkboxes" v-if="artistEditId != null">
            <label v-for="p in allPersons" :key="p.id" class="person-checkbox">
              <input v-model="artistEditPersonIds" :value="p.id" type="checkbox" />
              <span>{{ p.name }}</span>
            </label>
          </div>
          <p v-if="settingsLoading" class="muted">読込中…</p>
          <button type="button" class="btn primary" :disabled="settingsSaving || artistEditId == null" @click="submitArtistEdit">保存</button>
        </div>

        <div v-if="activeMenu === 'media-add'" class="editor">
          <h3 class="editor-title">media追加</h3>
          <input v-model="mediaAddName" type="text" class="select" placeholder="媒体名" />
          <button type="button" class="btn primary" :disabled="settingsSaving" @click="submitMediaAdd">保存</button>
        </div>

        <div v-if="activeMenu === 'media-edit'" class="editor">
          <h3 class="editor-title">media編集</h3>
          <select v-model.number="mediaEditId" class="select">
            <option :value="null">選択してください</option>
            <option v-for="m in allMedia" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <input v-model="mediaEditName" type="text" class="select" placeholder="新しい媒体名" />
          <button type="button" class="btn primary" :disabled="settingsSaving || mediaEditId == null" @click="submitMediaEdit">保存</button>
        </div>
      </div>
    </div>

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
.title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  margin-bottom: 1rem;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.title-icon {
  width: 1.6rem;
  height: 1.6rem;
  object-fit: cover;
  border-radius: 4px;
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
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
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.field.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}
.field .label {
  flex-shrink: 0;
  width: 4.5em;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.9;
}
.field.row .select {
  flex: 1;
  min-width: 0;
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
.row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}
.text {
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
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 20;
}
.settings-modal {
  width: min(680px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1rem;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.settings-title {
  margin: 0;
  font-size: 1.1rem;
}
.close-btn {
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text);
}
.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.editor {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.editor-title {
  margin: 0;
  font-size: 1rem;
}
.person-checkboxes {
  max-height: 180px;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem;
}
.person-checkbox {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0;
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
