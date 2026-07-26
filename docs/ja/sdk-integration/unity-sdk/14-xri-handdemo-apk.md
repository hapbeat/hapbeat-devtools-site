---
title: XRI Hand Demo の APK を入れて試す
kind: howto
description: Hapbeat の触覚フィードバックを追加した XRI Hands Interaction Demo のビルド済み APK を Quest 3 / 3S に入れて体験する手順。リリースチャンネル / CLI / SideQuest の 3 通り。
sidebar:
  order: 200
  label: XRI デモを APK で試す
---

[XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html) の **Hands Interaction Demo** に Hapbeat の触覚フィードバックを追加した、**ビルド済み APK** を配布中。Unity を開かずに体験可能。

:::caution[Hapbeat 実機が必要です]
このデモは Hapbeat が無いと何も起きません。デバイスは Quest と**同じ Wi-Fi** に接続してください。
:::

自分の Unity プロジェクトで再現・改造したい場合は [](/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/) を参照。

## 必要環境

- **Meta Quest** — 動作確認済みは **Quest 3 / 3S**。ハンドトラッキング対応機であれば **Quest 2 / Quest Pro** も配布対象に含む（未検証）
- **Hapbeat 実機** — Quest と同じ Wi-Fi

## どの方法を選ぶか

| | 方法 | 必要なもの | APK の入手 |
|---|---|---|---|
| **A** | リリースチャンネル | Meta アカウント | 不要 |
| **B** | CLI（adb） | PC・USB ケーブル・開発者モード | 必要 |
| **C** | アプリ（SideQuest） | B と同じ + SideQuest | 必要 |

開発者登録をしていない場合は **A** が最も簡単。ストアから通常のアプリと同じように入る。

## A. リリースチャンネル

Meta Horizon Store の **ALPHA チャンネル**に招待する方式。APK のダウンロードも USB 接続も不要で、必要なのは Meta アカウントのみ。開発者登録も開発者モードもいらない。

招待は個別に送付するため、[](/docs/support/contact/) から連絡すること。

1. **招待を受け取り、承諾**
   - 承諾はブラウザで完結する

2. **ヘッドセットのライブラリからインストール**
   - 招待制チャンネルのアプリは**ストア検索には出ない**。ライブラリに並ぶ

## APK のダウンロード（B / C 用）

<a href="https://github.com/hapbeat/hapbeat-demos/releases/latest/download/hapbeat-handdemo_all.apk" download>hapbeat-handdemo_all.apk をダウンロード</a>

過去のビルドは [hapbeat-demos の Releases](https://github.com/hapbeat/hapbeat-demos/releases) にある。以降のコマンドは、**この APK を置いたディレクトリで実行**する。

## B. CLI（adb）

1. **開発者モードを有効化**
   - 手順は [Meta 公式: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/) を参照
   - Unity で Build and Run が通っている場合はすでに有効なので不要

2. **Quest を USB-C で PC に接続し、ヘッドセット内で USB デバッグを許可**
   - 許可ダイアログはヘッドセット内にしか出ない。装着して **Always allow from this computer** を選ぶ

3. **APK を置いたディレクトリで実行**

   ```bash
   adb install -r hapbeat-handdemo_all.apk
   ```

   - `adb` は [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools) に含まれる。Unity の Android Build Support を導入済みなら `<Unity インストール先>/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/platform-tools/` にもある
   - コマンドの詳細は [adb 公式ドキュメント](https://developer.android.com/tools/adb)
   - `INSTALL_FAILED_UPDATE_INCOMPATIBLE`（署名不一致）が出た場合は、先に `adb uninstall com.Hapbeat.HapticHandDemo` を実行

4. **ライブラリの「提供元不明のアプリ（Unknown Sources）」から起動**
   - 既定のフィルタには出ない。切り替えが必要

## C. アプリ（SideQuest）

1. **開発者モードを有効化**
   - 手順は [Meta 公式: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/) を参照

2. **PC に SideQuest を導入**
   - [SideQuest 公式: Get SideQuest](https://sidequestvr.com/setup-howto)（Advanced Installer 版）

3. **Quest を USB 接続し、SideQuest の接続インジケータが緑になるのを確認**

4. **APK を SideQuest のウィンドウにドラッグ&ドロップ**

5. **ライブラリの「提供元不明のアプリ（Unknown Sources）」から起動**

## 動作しないとき

- Hapbeat と Quest が**同じ Wi-Fi**（同一サブネット）にいるか確認する
- このビルドはアドレスを固定していないため、**同じネットワーク上の Hapbeat はすべて反応する**。特定の 1 台に絞る設定は入っていない
- 解決しない場合は [](/docs/support/faq/) の接続関連と [](/docs/hardware/troubleshooting/) を参照

## ライセンス表記

本デモには Unity 製の [XR Interaction Toolkit](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit@3.3/manual/index.html) のサンプルアセットを含む。

- XR Interaction Toolkit copyright © Unity Technologies
- ライセンス: [Unity Companion License](http://www.unity3d.com/legal/licenses/Unity_Companion_License)
