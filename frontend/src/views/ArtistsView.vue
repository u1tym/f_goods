<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGoodsStore } from '@/stores/goods'

const router = useRouter()
const route = useRoute()
const store = useGoodsStore()

const personId = computed(() => store.selectedPersonId)
const personName = computed(() => store.selectedPerson?.name ?? '')
const artists = computed(() => store.relatedArtists)
const loading = computed(() => store.loading)
const error = computed(() => store.error)

onMounted(() => {
  if (personId.value == null) {
    router.replace('/')
    return
  }
  if (artists.value.length === 0) {
    store.fetchRelatedArtists(personId.value)
  }
})

function goBack() {
  store.setSelectedPerson(null)
  router.push('/')
}

function selectArtist(id: number | null) {
  store.setSelectedArtist(id)
  router.push('/media')
}
</script>

<template>
  <div class="page">
    <nav class="nav">
      <button type="button" class="back" aria-label="戻る" @click="goBack">
        ← 戻る
      </button>
    </nav>
    <h1 class="title">アーティスト</h1>
    <p class="lead">{{ personName }} に関連するアーティストを選択</p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="muted">読込中…</p>
    <ul v-else class="list">
      <li
        class="list-item list-item-all"
        role="button"
        tabindex="0"
        @click="selectArtist(null)"
        @keydown.enter="selectArtist(null)"
      >
        すべて
      </li>
      <li
        v-for="a in artists"
        :key="a.id"
        class="list-item"
        role="button"
        tabindex="0"
        @click="selectArtist(a.id)"
        @keydown.enter="selectArtist(a.id)"
      >
        {{ a.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  padding: 1rem;
  padding-top: env(safe-area-inset-top, 0);
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
  margin-bottom: 0.5rem;
}
.lead {
  color: var(--color-text);
  opacity: 0.9;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}
.error {
  color: #c00;
  margin: 0.5rem 0;
}
.muted {
  color: var(--color-text);
  opacity: 0.7;
}
.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.list-item {
  padding: 0.85rem 1rem;
  margin-bottom: 0.5rem;
  background: var(--color-background-mute);
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
}
.list-item-all {
  font-weight: 600;
}
.list-item:active {
  opacity: 0.85;
}
</style>
