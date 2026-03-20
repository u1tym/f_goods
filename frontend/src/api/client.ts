import { API_BASE_URL } from '@/config'
import type {
  Person,
  Artist,
  ArtistDetail,
  Media,
  RelatedGoodsItem,
  GoodsDetail,
  GoodsPayload,
} from '@/types/api'

async function request<T>(
  path: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...init } = options ?? {}
  const headers: HeadersInit = {
    ...(init.headers as HeadersInit),
  }
  if (json !== undefined) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: json !== undefined ? JSON.stringify(json) : init.body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** API-1: person一覧 */
export function getPersons(): Promise<Person[]> {
  return request<Person[]>('/persons')
}

export function createPerson(name: string): Promise<Person> {
  return request<Person>('/persons', {
    method: 'POST',
    json: { name },
  })
}

export function updatePerson(id: number, name: string): Promise<Person> {
  return request<Person>(`/persons/${id}`, {
    method: 'PUT',
    json: { id, name },
  })
}

/** API-4: 選択したpersonに紐づくartists + 一覧用 */
export function getRelatedArtists(personId: number): Promise<Artist[]> {
  return request<Artist[]>('/persons/related-artists', {
    method: 'POST',
    json: { person_id: personId },
  })
}

/** API-2: 選択したpersonに紐づくmedia一覧 */
export function getRelatedMedia(personId: number): Promise<Media[]> {
  return request<Media[]>('/persons/related-media', {
    method: 'POST',
    json: { person_id: personId },
  })
}

/** API-3: 関連goods（person_id + media_ids で検索） */
export function getRelatedGoods(
  personId: number,
  mediaIds: number[]
): Promise<RelatedGoodsItem[]> {
  return request<RelatedGoodsItem[]>('/persons/related-goods', {
    method: 'POST',
    json: { person_id: personId, media_ids: mediaIds },
  })
}

/** 1件取得（更新用）。API が goods_id で返す場合は id に正規化する */
export async function getGoods(id: number): Promise<GoodsDetail> {
  const res = await request<GoodsDetail & { goods_id?: number }>(`/goods/${id}`)
  const idVal = res.id ?? res.goods_id ?? id
  return { ...res, id: idVal }
}

/** API-14: goods追加 */
export function createGoods(payload: GoodsPayload): Promise<{ id: number }> {
  return request<{ id: number }>('/goods', {
    method: 'POST',
    json: {
      media_id: payload.media_id,
      artist_id: payload.artist_id,
      title: payload.title,
      release_date: payload.release_date ?? null,
      memo: payload.memo ?? null,
      is_owned: payload.is_owned ?? false,
      code_number: payload.code_number ?? null,
      image_type: payload.image_type ?? null,
      image_data: payload.image_data ?? null,
    },
  })
}

/** API-15: goods更新 */
export function updateGoods(
  id: number,
  payload: GoodsPayload
): Promise<{ id: number }> {
  return request<{ id: number }>(`/goods/${id}`, {
    method: 'PUT',
    json: {
      id,
      media_id: payload.media_id,
      artist_id: payload.artist_id,
      title: payload.title,
      release_date: payload.release_date ?? null,
      memo: payload.memo ?? null,
      is_owned: payload.is_owned ?? false,
      code_number: payload.code_number ?? null,
      image_type: payload.image_type ?? null,
      image_data: payload.image_data ?? null,
    },
  })
}

/** 一覧用: 全artists（「すべて」以外の選択時に名前→idの解決に利用） */
export function getAllArtists(): Promise<Artist[]> {
  return request<Artist[]>('/artists')
}

export function getArtistDetail(id: number): Promise<ArtistDetail> {
  return request<ArtistDetail>(`/artists/${id}`)
}

export function createArtist(name: string): Promise<Artist> {
  return request<Artist>('/artists', {
    method: 'POST',
    json: { name },
  })
}

export function updateArtist(
  id: number,
  name: string,
  personIds: number[]
): Promise<Artist> {
  return request<Artist>(`/artists/${id}`, {
    method: 'PUT',
    json: { id, name, person_ids: personIds },
  })
}

/** 一覧用: 全media */
export function getAllMedia(): Promise<Media[]> {
  return request<Media[]>('/media')
}

export function createMedia(name: string): Promise<Media> {
  return request<Media>('/media', {
    method: 'POST',
    json: { name },
  })
}

export function updateMedia(id: number, name: string): Promise<Media> {
  return request<Media>(`/media/${id}`, {
    method: 'PUT',
    json: { id, name },
  })
}
