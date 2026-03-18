/**
 * API 基底URL
 * - 開発時: /api にプロキシするため同一オリジンになり CORS を回避
 * - 本番・プレビュー: 環境変数 VITE_GOODSAPI_BASE_URL または http://127.0.0.1:8000
 */
export const API_BASE_URL =
  import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_GOODSAPI_BASE_URL ?? 'http://127.0.0.1:8000')
