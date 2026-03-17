import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '@/api/client'
import type { Person, Artist, Media, RelatedGoodsItem } from '@/types/api'


export const useGoodsStore = defineStore('goods', () => {
  const persons = ref<Person[]>([])
  const relatedArtists = ref<Artist[]>([])
  const relatedMedia = ref<Media[]>([])
  const relatedGoods = ref<RelatedGoodsItem[]>([])

  const selectedPersonId = ref<number | null>(null)
  const selectedArtistId = ref<number | null | undefined>(undefined)
  const selectedMediaId = ref<number | null | undefined>(undefined)

  const loading = ref(false)
  const error = ref<string | null>(null)

  const selectedPerson = computed(() =>
    persons.value.find((p) => p.id === selectedPersonId.value)
  )

  const selectedArtist = computed(() =>
    selectedArtistId.value == null || selectedArtistId.value === undefined
      ? null
      : relatedArtists.value.find((a) => a.id === selectedArtistId.value) ?? null
  )

  const selectedMedia = computed(() =>
    selectedMediaId.value == null || selectedMediaId.value === undefined
      ? null
      : relatedMedia.value.find((m) => m.id === selectedMediaId.value) ?? null
  )

  /** 選択が確定しているか（person・artist・media をすべて選択済み） */
  const isSelectionConfirmed = computed(
    () =>
      selectedPersonId.value != null &&
      selectedArtistId.value !== undefined &&
      selectedMediaId.value !== undefined
  )

  /** 表示用 goods（「すべて」でなければ artist 名でフィルタ） */
  const displayGoods = computed(() => {
    const aid = selectedArtistId.value
    if (aid == null || aid === undefined) return relatedGoods.value
    const artist = relatedArtists.value.find((a) => a.id === aid)
    if (!artist) return relatedGoods.value
    return relatedGoods.value.filter((g) => g.artist_name === artist.name)
  })

  async function fetchPersons() {
    loading.value = true
    error.value = null
    try {
      persons.value = await api.getPersons()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchRelatedArtists(personId: number) {
    loading.value = true
    error.value = null
    try {
      relatedArtists.value = await api.getRelatedArtists(personId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchRelatedMedia(personId: number) {
    loading.value = true
    error.value = null
    try {
      relatedMedia.value = await api.getRelatedMedia(personId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchRelatedGoods(personId: number, mediaIds: number[]) {
    loading.value = true
    error.value = null
    try {
      relatedGoods.value = await api.getRelatedGoods(personId, mediaIds)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function setSelectedPerson(id: number | null) {
    selectedPersonId.value = id
    selectedArtistId.value = undefined
    selectedMediaId.value = undefined
    relatedArtists.value = []
    relatedMedia.value = []
    relatedGoods.value = []
  }

  function setSelectedArtist(id: number | null | undefined) {
    selectedArtistId.value = id
    selectedMediaId.value = undefined
    relatedGoods.value = []
  }

  function setSelectedMedia(id: number | null | undefined) {
    selectedMediaId.value = id
    relatedGoods.value = []
  }

  function clearError() {
    error.value = null
  }

  return {
    persons,
    relatedArtists,
    relatedMedia,
    relatedGoods,
    displayGoods,
    selectedPersonId,
    selectedArtistId,
    selectedMediaId,
    selectedPerson,
    selectedArtist,
    selectedMedia,
    isSelectionConfirmed,
    loading,
    error,
    fetchPersons,
    fetchRelatedArtists,
    fetchRelatedMedia,
    fetchRelatedGoods,
    setSelectedPerson,
    setSelectedArtist,
    setSelectedMedia,
    clearError,
  }
})
