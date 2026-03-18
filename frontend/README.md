# Goods管理 フロントエンド

Vue 3 + TypeScript のスマホ向けフロントエンドです。

## 機能

- **Goods管理** タイトル表示
- **人物 (person)** 一覧 → 選択で **アーティスト (artists)** 一覧（選択した person に関連する artists +「すべて」）
- **アーティスト** 選択で **媒体 (media)** 一覧（関連 media +「すべて」）
- **媒体** 選択で **goods** を検索してリスト表示（画像・タイトル・メディア・リリース日・所持有無）
- 選択が確定するまで一覧は表示しない
- 一覧から1件選択して内容を更新
- 新規 goods 追加

## API の起点

- 設定: `src/config.ts` および環境変数 `VITE_GOODSAPI_BASE_URL`
- 既定値: `http://127.0.0.1:8000`
- 変更する場合は `.env` に `VITE_GOODSAPI_BASE_URL=https://...` を指定するか、`src/config.ts` を編集してください。

## バックエンド API について

- 一覧・追加は `API_AND_DB_SPEC.md` の API-1〜API-4, API-14 等で実現しています。
- **Goods の編集**には、更新時に `media_id` と `artist_id` が必要です。現在の API-3（関連 goods 一覧）のレスポンスにはこれらが含まれていないため、**1件取得用の `GET /goods/{id}` がバックエンドに必要です**。未実装の場合は編集画面で「商品の取得に失敗しました」と表示されます。  
  - 対応案: バックエンドに `GET /goods/{id}` を追加し、`{ id, media_id, artist_id, title, release_date, memo, is_owned, code_number }` を返す。

---

This template should help you get started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
