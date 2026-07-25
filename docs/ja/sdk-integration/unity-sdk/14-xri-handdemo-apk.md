---
title: XRI Hand Demo の APK を入れて試す
kind: howto
description: Hapbeat の触覚を載せた XRI Hands Interaction Demo のビルド済み APK を Quest 3 / 3S に入れて体験する手順。リリースチャンネル / adb / SideQuest の 3 通り。
sidebar:
  order: 200
  label: XRI デモを APK で試す
---

XR Interaction Toolkit の **Hands Interaction Demo** に Hapbeat の触覚を載せた、**ビルド済み APK** を配布しています。Unity を開かずに体験できます。

:::caution[Hapbeat 実機が必要です]
このデモは Hapbeat が無いと何も起きません。デバイスは Quest と**同じ Wi-Fi** に接続してください。
:::

自分の Unity プロジェクトで再現・改造したい場合は [](/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/)。

## 必要環境

- **Meta Quest 3 / 3S**
- **Hapbeat 実機**（Quest と同じ Wi-Fi）

## どの方法を選ぶか

| | 方法 | 必要なもの | APK の入手 |
|---|---|---|---|
| **A** | リリースチャンネル | Meta アカウントのみ | 不要 |
| **B** | adb | PC・USB ケーブル・開発者モード | 必要 |
| **C** | SideQuest | B + SideQuest | 必要 |

**開発者登録をしていないなら A** が最も簡単です。ストアから通常のアプリと同じように入ります。

## A. リリースチャンネル

Meta Horizon Store の **ALPHA チャンネル**に参加していただく方式です。APK のダウンロードも USB 接続も不要です。

1. **招待リンクを開いて参加する**

   <!-- TODO: ダッシュボードの ALPHA チャンネルで発行した招待 URL に差し替える -->
   ```
   https://…（招待リンク・準備中）
   ```

   - 必要なのは Meta アカウントだけです。開発者登録も開発者モードも不要です
   - ALPHA チャンネルはストア審査が不要なため、公開申請を待たずに配布できます

2. **ヘッドセットのライブラリからインストールする**
   - 招待制チャンネルのアプリは**ストア検索には出ません**。ライブラリに並びます

## APK のダウンロード（B / C 用）

<a href="https://github.com/hapbeat/hapbeat-demos/releases/latest" download>hapbeat-handdemo_all.apk</a>

以降のコマンドは、**この APK を置いたディレクトリで実行**してください。

## B. adb

1. **開発者モードを有効にする**
   - 手順は [Meta 公式: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)
   - Unity で Build and Run が通っている人は**すでに有効**なので、この手順は不要です

2. **Quest を USB-C で PC に接続し、ヘッドセット内で USB デバッグを許可する**
   - ダイアログはヘッドセット内にしか出ません。装着して **Always allow from this computer** を選びます

3. **APK を置いたディレクトリで実行する**

   ```bash
   adb install -r hapbeat-handdemo_all.apk
   ```

   - `adb` は [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools) に含まれます。Unity の Android Build Support を入れている場合は `<Unity インストール先>/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/platform-tools/` にもあります
   - コマンドの詳細は [adb 公式ドキュメント](https://developer.android.com/tools/adb)
   - `INSTALL_FAILED_UPDATE_INCOMPATIBLE`（署名不一致）が出たら、先に `adb uninstall com.Hapbeat.HapticHandDemo` を実行します

4. **ライブラリの「提供元不明のアプリ（Unknown Sources）」から起動する**
   - 既定のフィルタには出ません。切り替えが必要です

## C. SideQuest

1. **開発者モードを有効にする**
   - 手順は [Meta 公式: Set up development environment](https://developers.meta.com/horizon/documentation/native/android/mobile-device-setup/)

2. **PC に SideQuest をインストールする**
   - [SideQuest 公式: Get SideQuest](https://sidequestvr.com/setup-howto)（Advanced Installer 版）

3. **Quest を USB 接続し、SideQuest の接続インジケータが緑になるのを確認する**

4. **APK を SideQuest のウィンドウにドラッグ&ドロップする**

5. **ライブラリの「提供元不明のアプリ（Unknown Sources）」から起動する**

## 触覚が鳴らないとき

- Hapbeat と Quest が**同じ Wi-Fi**（同一サブネット）にいるか確認してください
- このビルドはアドレスを固定していないため、**同じネットワーク上の Hapbeat はすべて鳴ります**。特定の 1 台だけに絞る設定は入っていません
- それでも鳴らない場合は [](/docs/support/faq/) の接続関連と [](/docs/hardware/troubleshooting/) を参照してください

## ライセンス表記

本デモには Unity 製の **XR Interaction Toolkit** のサンプルアセットが含まれています。

- XR Interaction Toolkit copyright © Unity Technologies
- ライセンス: [Unity Companion License](http://www.unity3d.com/legal/licenses/Unity_Companion_License)
