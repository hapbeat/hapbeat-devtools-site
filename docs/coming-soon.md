---
title: 今後の実装予定
description: Hapbeat SDK・ツール群のうち、現在未実装で今後対応を予定しているもの。
---

このページでは、**現在未実装** で今後対応を予定している SDK・ツールをまとめています。実装が完了したものは独立したセクションに移動します。

## Unreal SDK

Unreal Engine から Hapbeat を制御する薄いアダプタ SDK。Unity SDK と同じ UDP プロトコル ([Contracts](/docs/contracts/overview/)) を利用するため、機能セットは Unity SDK にほぼ準じる予定です。

**予定機能**

- Wi-Fi UDP broadcast による直接通信
- Blueprint 対応の Trigger コンポーネント
- C++ API（`HapbeatBridge` / `HapbeatEventTrigger` 相当）
- EventMap 風の Editor ツール

**代替手段**: 先行検証したい場合は OSC / UDP ライブラリで [Contracts の message-format spec](/docs/contracts/overview/) を参照しながら直接実装することも可能です。

## Creative Kit (TouchDesigner / Max / Pure Data)

クリエイティブ開発環境から Hapbeat を制御するテンプレート・サンプル集。

**予定内容**

- TouchDesigner 用 OSC / UDP patch
- Max for Live デバイス
- Pure Data abstraction
- Live Audio との組み合わせ例
- イベントマッピングのベストプラクティス

**代替手段**: 各ソフトから直接 OSC / UDP を送ることで、現状でも Hapbeat を制御できます。[Contracts のメッセージ仕様](/docs/contracts/overview/) を参照してください。

---

その他のロードマップや進捗の議論は [GitHub Discussions](/docs/support/) でも共有しています。
