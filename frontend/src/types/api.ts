/** API レスポンス型（API_AND_DB_SPEC.md に準拠） */

export interface Person {
  id: number
  name: string
}

export interface Artist {
  id: number
  name: string
}

export interface ArtistDetail {
  name: string
  persons: Person[]
}

export interface Media {
  id: number
  name: string
}

/** POST /persons/related-goods の1件（API-3 仕様で media_id, artist_id を含む） */
export interface RelatedGoodsItem {
  goods_id: number
  media_id?: number
  artist_id?: number
  media_name: string
  artist_name: string
  title: string
  release_date: string
  memo: string | null
  is_owned: boolean
  code_number: string | null
  image_type: string | null
  image_data: string | null
}

/** GET /goods/{id} のレスポンス（API は goods_id で返す場合あり） */
export interface GoodsDetail {
  id?: number
  goods_id?: number
  media_id: number
  artist_id: number
  title: string
  release_date: string
  memo: string | null
  is_owned: boolean
  code_number: string | null
  image_type?: string | null
  image_data?: string | null
}

/** POST /goods, PUT /goods/{id} の Body */
export interface GoodsPayload {
  media_id: number
  artist_id: number
  title: string
  release_date?: string
  memo?: string | null
  is_owned?: boolean
  code_number?: string | null
  image_type?: string | null
  image_data?: string | null
}
