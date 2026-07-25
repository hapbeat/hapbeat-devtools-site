---
title: XRI Hand Demo の APK を入れて試す
kind: howto
description: XRI Hands Interaction Demo に Hapbeat の触覚を載せたビルド済み APK を Quest 3 / 3S にインストールして体験する手順。Unity 経験者向け adb、SideQuest、開発者登録不要のリリースチャンネルの 3 通り。
sidebar:
  order: 200
---

XR Interaction Toolkit（XRI）の **Hands Interaction Demo** に Hapbeat の触覚を載せたデモの、**ビルド済み APK** を配布しています。掴む・押す・スナップする・こするといった操作に触覚が返るところを、Unity を開かずに体験できます。

:::caution[Hapbeat 実機が必要です]
このデモは Hapbeat デバイスが無いと体験できません。デバイスは Quest と **同じ Wi-Fi** に接続してください。
:::

Unity プロジェクトとして自分でビルド・改造したい場合は [](/docs/sdk-integration/unity-sdk/xri-handdemo-quickstart/) を参照してください。

## ダウンロード

APK は GitHub Releases で配布します。

<!-- TODO: 配布 repo 公開時に、下記プレースホルダを実際の GitHub Releases URL（およびダウンロードリンク）へ差し替える -->

:::note[配布リポジトリは準備中です]
公開後、以下の URL からダウンロードできるようになります。

```
https://github.com/hapbeat/<配布リポジトリ名>/releases/latest
```

ファイル名は `hapbeat-handdemo.apk` です。
:::

## 必要環境

- **Meta Quest 3 / 3S**
- **Hapbeat 実機**（Quest と同じ Wi-Fi に接続）
- インストール方法によって追加の要件があります（下記 A / B / C を参照）

## インストール方法

読者の状況に応じて 3 通りあります。

### A. Unity で Build and Run したことがある人（最速）

Build and Run が通っている時点で **開発者モードは既に有効**です。SideQuest も不要で、Unity に同梱されている `adb` がそのまま使えます。

Quest を USB-C で PC に接続してから、次を実行します。

```bash
adb install -r hapbeat-handdemo.apk
```

`adb` は Unity の Android Build Support（Android SDK）に同梱されています。例: `<Unity インストール先>/Editor/Data/PlaybackEngines/AndroidPlayer/SDK/platform-tools/adb.exe`

### B. VR は使うが Unity は使わない人（SideQuest）

:::caution[Meta 開発者登録が必要です]
開発者モードを有効にするには、**Meta の開発者登録（開発者組織への所属と本人確認）** が必要です。ここが最初の壁になります。
:::

**開発者モードを有効にする**

1. スマホの **Meta Horizon** アプリを開く
2. ヘッドセットのアイコンから、ペアリング済みの端末を選択する
3. **Headset Settings → Developer Mode** をオンにする
4. ヘッドセットを USB-C で PC に接続する
5. ヘッドセットを装着し、Quick Control → Settings → Developer タブで **MTP Notification** を有効化する
6. 「USB デバッグを許可しますか」のダイアログで **Always allow from this computer** を選ぶ

**SideQuest でインストールする**

1. PC に **SideQuest（Advanced Installer）** をインストールする
2. Quest を USB 接続し、SideQuest の接続インジケータが**緑**になるのを確認する
3. APK を SideQuest のウィンドウに**ドラッグ&ドロップ**する（または *Install APK file from folder* を使う）

**起動する**

ヘッドセットのライブラリを開き、提供元のフィルタを **「提供元不明のアプリ（Unknown Sources）」** に切り替えるとアプリが表示されます。

### C. 開発者登録をしたくない人（リリースチャンネル）

配布側が Meta Horizon Store の **ALPHA チャンネル**にビルドを上げ、**メールまたは URL で招待**する方式です。

- 受け取る側に必要なのは **Meta アカウントのみ**。開発者登録も開発者モードも不要です
- 招待を受け取ると、ストアの **My Preview Apps** とライブラリにアプリが並ぶので、そのままインストールできます
- **ALPHA / BETA チャンネルはストア審査が不要**です（審査が必要なのは Production のみ）
- 1 チャンネルあたり既定で 200 ユーザー（申請により最大 2,500 ユーザー）まで招待できます

この方式を希望する場合は [](/docs/support/contact/) の GitHub Discussions からご連絡ください。招待をお送りします。

## 使い方（起動後）

Hapbeat の **player / group はアプリ内の設定パネルから変更**できます。Unity を開く必要はありません。player / group の考え方は [](/docs/concepts/group-player-addressing/) を参照してください。

触覚が鳴らない場合は [](/docs/support/faq/) の接続関連、および [](/docs/hardware/troubleshooting/) を確認してください。

## ライセンス表記

本デモには Unity 製の **XR Interaction Toolkit** のサンプルアセットが含まれています。

- XR Interaction Toolkit copyright © Unity Technologies
- ライセンス: [Unity Companion License](http://www.unity3d.com/legal/licenses/Unity_Companion_License)
