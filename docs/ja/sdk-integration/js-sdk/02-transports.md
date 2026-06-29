---
title: Transports — Node UDP / React Native UDP / Browser helper
kind: explanation
description: 1 つの API・3 つのトランスポート。Node と React Native は Wi-Fi UDP を直接ブロードキャスト、ブラウザは hapbeat-helper を WebSocket で中継する。パッケージの exports map がランタイムを見て自動で切り替える仕組みと、各経路の能力差を解説。
sidebar:
  order: 2
  label: Transports
---

JS/TS SDK は **API が 1 つ・トランスポート（送信経路）が 3 つ**です。
`connect()` の呼び方は同じでも、Node・React Native・ブラウザで内部の送信方法が変わります。

- **Node**（Electron / サーバー / CLI / クリエイティブコーディング）→ Wi-Fi
  **UDP ブロードキャスト**をデバイスへ直接送る。
- **React Native**（Android / iOS のスマホアプリ）→ オプションの
  `react-native-udp` で Wi-Fi **UDP ブロードキャスト**を端末から直接送る。
  スマホはブラウザのようにサンドボックス化されていないため本物の UDP ソケットを
  開けるので、**hapbeat-helper は不要**。
- **ブラウザ**（WebXR / three.js / p5.js / jsPsych など）→ ローカルで動く
  **hapbeat-helper** に **WebSocket**（`ws://localhost:7703`）で中継する。
  ブラウザは生の UDP ソケットを開けないため、helper が代わりにブロードキャストする。

どちらを使うかは**自分で選ぶ必要はありません**。パッケージの `exports` map が
ランタイム／バンドラーを見て自動で正しいビルドを選びます。

## なぜ 3 つのビルドが必要か

Hapbeat デバイスは LAN 上で **UDP ブロードキャスト**を受けて自己フィルタします
（詳細は [](/docs/concepts/group-player-addressing/)）。Node は `node:dgram` で、
React Native は `react-native-udp` で UDP を直接送れますが、
**ブラウザのサンドボックスは生 UDP を許可しません**。
そのためブラウザ側はローカルの helper デーモンに WebSocket で指示を渡し、helper が
UDP ブロードキャストを代行します。

この差を吸収するため、SDK は実体が異なる 3 つのエントリポイントを持ちます。

| ビルド | エントリ | 依存 | 送信経路 |
|---|---|---|---|
| Node | `dist/node.js` | `node:dgram` | UDP ブロードキャスト（直接） |
| React Native | `dist/react-native.js` | `react-native-udp` | UDP ブロードキャスト（直接） |
| Browser | `dist/browser.js` | `WebSocket` | hapbeat-helper 経由 |

`node:dgram` がブラウザバンドルに混入しないよう、トランスポート実装は
エントリごとに分離されています。

## exports map による自動選択

`@hapbeat/sdk` の `package.json` は `exports` 条件で出し分けます。

```jsonc
"exports": {
  ".": {
    "node":         { "default": "./dist/node.js" },          // Node ランタイム
    "react-native": { "default": "./dist/react-native.js" },  // React Native ランタイム
    "browser":      { "default": "./dist/browser.js" },       // バンドラーの browser 条件
    "default":      { "default": "./dist/browser.js" }        // それ以外（WebXR 等）
  }
}
```

- **Node で実行** → `node` 条件にマッチ → UDP ビルド。
- **React Native（Metro）でバンドル** → `react-native` 条件にマッチ → RN UDP ビルド。
- **Vite / webpack / esbuild でバンドル** → `browser` 条件にマッチ → helper ビルド。
- どれにもマッチしないランタイムは `default`（= browser ビルド）にフォールバック。

利用側のコードは常に同じです。

```ts
import { connect } from "@hapbeat/sdk"; // どちらのビルドかは exports が決める
const hb = await connect({ appName: "MyApp" });
```

## Node — UDP ブロードキャスト

Node ビルドは `node:dgram` で UDP4 ソケットを開き、`PLAY` / `STOP` /
`CONNECT_STATUS` などのパケットを直接ブロードキャストします。

```ts
const hb = await connect({
  appName: "MyApp",          // OLED 表示名（最大 16 文字）
  port: 7700,                // 既定 7700（コマンド送信先ポート）
  broadcastAddr: "255.255.255.255", // 既定
  keepalive: true,           // 既定 true
  // bindPort: 7700,         // opt-in: well-known 受信ポートを bind（既定は ephemeral）
});
```

- **送信先は `7700`**（デバイスのコマンドポート）。**受信ソケットは既定で
  ephemeral（OS 任せ）ポートを bind** します（DEC-036）。well-known の 7700 を
  bind するのは daemon（hapbeat-helper）だけ、という方針で、SDK が helper から
  7700 を奪わないようにするためです。PONG は送信元の ephemeral ポートへ返るので
  discovery は成立します。
- daemon 的に**非要求のブロードキャストを 7700 で受けたい**場合は
  `bindPort: 7700` を明示します（7700 が使用中なら ephemeral にフォールバック）。
- `keepalive` が有効かつ `appName` が設定されているときのみ、5 秒間隔で
  `CONNECT_STATUS` を送り、デバイス OLED にアプリ名を表示します
  （`hb.close()` で「アプリが離れた」通知を送って解除します）。

### マルチ NIC（multi-homed）の注意

PC が複数のネットワークインターフェイスを持つ場合（有線 + Wi-Fi、VPN、Docker の
仮想 NIC など）、`255.255.255.255` 宛のブロードキャストが **Hapbeat とは別の NIC から
出ていく**ことがあります。デバイスが見つからない・鳴らないときは、Hapbeat と同じ
LAN に繋がっている NIC が経路（route）を持っているか確認してください。
特定セグメントに送りたい場合は `broadcastAddr` をそのサブネットの
ブロードキャストアドレス（例 `192.168.1.255`）に指定します。

## React Native — UDP ブロードキャスト（helper 不要）

React Native ビルドは、オプションの peer 依存 `react-native-udp` を使って
スマホから **UDP ブロードキャストを直接**送ります。スマホはブラウザのように
サンドボックス化されていないため本物の UDP ソケットを開けます。よって
**hapbeat-helper は不要**で、ワイヤーフォーマットは Node と同一です。
`exports` の `react-native` 条件が `dist/react-native.js` を解決します。

```ts
const hb = await connect({ appName: "MyApp" });
hb.play("sample-kit.sine_100hz", { gain: 0.5 });
```

### アプリ側のセットアップ

1. 依存をインストールします。

   ```bash
   npm install react-native-udp fast-text-encoding
   ```

   - `react-native-udp` … UDP のネイティブモジュール（autolink されます）。
   - `fast-text-encoding` … **必須の polyfill**。RN Hermes（0.86 を含む）は
     `TextEncoder` を持ちますが `TextDecoder` を持たず、ワイヤープロトコルの
     デコードに必要なためです。

2. `metro.config.js` の resolver で `@hapbeat/sdk` が React Native ビルドへ
   解決されるようにします。

   ```js
   // metro.config.js
   config.resolver.unstable_enablePackageExports = true;
   config.resolver.unstable_conditionNames = ["react-native", "require", "default"];
   ```

3. **`import 'fast-text-encoding';` を最初の import** にします
   （`@hapbeat/sdk` より前・`index.js` か `App.tsx` の先頭）。順序が後だと
   `ReferenceError: Property 'TextDecoder' doesn't exist` になります。

   ```ts
   import "fast-text-encoding"; // ← 最初に。@hapbeat/sdk より前
   import { connect } from "@hapbeat/sdk";
   ```

### プラットフォームの権限メモ

- **Android**: `INTERNET` 権限は既定で付与され、ブロードキャスト送信はそのまま動きます。
  探索の PONG 受信はネットワークによって multicast lock が必要な場合があります。
  AP / クライアント分離が有効なネットワークではブロードキャストが届きません。
- **iOS 14+**: ローカルネットワーク権限が必要です
  （`Info.plist` に `NSLocalNetworkUsageDescription` を追加）。

動作する完全な例は [](/docs/sdk-integration/js-sdk/examples/) を参照してください。

## ブラウザ — hapbeat-helper 経由

ブラウザビルドは UDP を送れないため、ローカルの **hapbeat-helper** に WebSocket で
指示（`play_event` / `stream_begin` など）を渡し、helper が UDP ブロードキャストします。

### helper のインストールと起動

```bash
pip install hapbeat-helper
hapbeat-helper            # ws://localhost:7703 で待ち受け
```

### 接続

```ts
const hb = await connect({
  appName: "MyWebXR",
  helperUrl: "ws://localhost:7703", // 既定
  connectTimeoutMs: 4000,           // 既定。helper 無応答時に reject するまで
  onConnectionLost: () => {
    // 確立後に helper が落ちた／再起動したとき呼ばれる
    console.warn("hapbeat-helper の接続が切れました");
  },
});
```

- helper に到達できない／`connectTimeoutMs` 内に応答が無いと `connect()` は
  **reject** します。ユーザーには `pip install hapbeat-helper` と起動を案内してください。
- `onConnectionLost` は、いったん確立した接続が後から切れた（helper が終了・再起動した）
  ときのみ呼ばれます。初回接続失敗は `connect()` の reject 側で扱います。

## トランスポート間の能力差

`play` / `stop` / `stopAll`（command モード）は **全トランスポートで同じ**に動きます。
UDP を直接送る Node と React Native は能力が一致し、ブラウザ（helper 経由）の
ストリーミング（clip / live）まわりだけ一部制約があります。

| 機能 | Node（UDP 直接） | React Native（UDP 直接） | Browser（helper WS） |
|---|---|---|---|
| command 再生 `play(id)` | ✅ | ✅ | ✅ |
| `target` 指定（command） | ✅ デバイス側で自己フィルタ | ✅ デバイス側で自己フィルタ | ✅ |
| `targetTimeUs`（同期再生） | ✅ パケットに乗せて送る | ✅ パケットに乗せて送る | ⚠️ **無視**（即時再生のみ） |
| clip / live ストリーミング | ✅ | ✅ | ✅ |
| clip / stream の per-device ターゲティング | ✅ パケット内 address で絞る | ✅ パケット内 address で絞る | ⚠️ helper が知る**全デバイス**へ届く |
| keep-alive（OLED アプリ名表示） | ✅ `CONNECT_STATUS` 5 秒間隔 | ✅ `CONNECT_STATUS` 5 秒間隔 | — |
| デバイス探索 `discover()` | ✅ ブロードキャスト PING/PONG | ✅ ブロードキャスト PING/PONG | ✅ helper の `rescan` 経由 |

ブラウザ側の制約の理由:

- **`targetTimeUs` 無視**: helper WS の level-1 プロトコルは予約再生時刻を公開して
  おらず、即時再生のみを中継します。
- **clip が全デバイスに届く**: helper はストリームのターゲットを既知デバイスの IP へ
  解決する設計で、アドレス文字列（`player_1/chest` 等）による per-device の clip
  ターゲティングは現状未対応です。Node の clip ストリーミングはパケット内 address を
  尊重します。

これらは [](/docs/sdk-integration/js-sdk/command-vs-clip/) /
[](/docs/sdk-integration/js-sdk/streaming-clips/) /
[](/docs/sdk-integration/js-sdk/streaming-live/) にも関連します。

## バンドラーと Electron

- **Vite / webpack / esbuild** は `exports` の `browser` 条件を自動で解決するため、
  特別な設定は不要です（バンドル時に browser ビルドが選ばれます）。
- **Electron** は構成次第で使い分けられます。レンダラープロセスでも、Node 統合を
  有効にしていれば **node ビルド（UDP 直接）**を使えます。helper を別途立てずに
  デバイスへ直接送れるため、デスクトップアプリでは node ビルドが扱いやすい選択肢です。

## まとめ

- API は 1 つ、トランスポートは 3 つ。選択は `exports` map が自動で行う。
- Node = UDP 直接（送信 7700・受信は既定 ephemeral／`bindPort` で opt-in・keep-alive あり・マルチ NIC に注意）。
- React Native = UDP 直接（要 `react-native-udp` + `fast-text-encoding` polyfill・
  `metro.config.js` resolver・polyfill は最初の import・helper 不要）。
- Browser = hapbeat-helper 経由（要 `pip install hapbeat-helper`・`targetTimeUs` と
  clip の per-device ターゲティングに制約あり）。
- command モードの挙動は全経路で一致するので、まずは command から始めると差を意識せず済む。

## 次に読む

- [](/docs/sdk-integration/js-sdk/getting-started/) — インストールと最初のイベント
- [](/docs/sdk-integration/js-sdk/command-vs-clip/) — command と clip の使い分け
- [](/docs/sdk-integration/js-sdk/streaming-live/) — 連続ストリーミング（`openStream`）
