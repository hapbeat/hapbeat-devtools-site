---
title: デスクトップアプリ版（Windows）
kind: howto
description: Helper を内蔵した Hapbeat Studio の Windows アプリ。Python やコマンド操作なしで Studio を使う方法と留意事項。
sidebar:
  order: 12
---

Hapbeat Studio デスクトップアプリは、Studio（Web）の画面に Helper を内蔵した Windows 用アプリです。Python・pipx・コマンド操作は要りません。

## インストール

1. [ダウンロードページ](https://github.com/hapbeat/hapbeat-studio-desktop/releases/latest)から `HapbeatStudio-Setup-<ver>.exe` を入手して実行します。現在のユーザーにインストールされ、そのまま起動します（管理者権限は不要）。
2. 次回からは、デスクトップまたはスタートメニューの「Hapbeat Studio」から起動します。

## 留意事項

- **初回の警告**: 署名のないアプリのため、「Windows によって PC が保護されました」と表示されたら「詳細情報」→「実行」を選んでください。
- **スマート アプリ コントロール**: Windows 11 でこの機能がオンの PC では起動できません。「Windows セキュリティ」→「アプリとブラウザーの制御」→「スマート アプリ コントロールの設定」でオフにしてください。
- **ファイアウォール**: 初回起動時に確認が出たら「アクセスを許可する」を選んでください。許可しないとデバイスが見つかりません。
- **表示するタブ**: Kit・UI・Manage を表示します。右上の「接続」から開くパネルで「すべての機能を表示」をオンにすると、エディタとシーンのタブも出ます。
- **更新**: 画面は Studio（Web）と同じで、起動のたびに最新版を読み込みます。開いている間に新しい版が出ると、右下に「再読み込みして更新」が出ます。アプリ本体（内蔵 Helper）は起動時に自動で更新を確認します。
- **オフライン**: ネットにつながらないときは、前回保存した版で起動します。アプリの更新とファームウェアの一覧は使えません。
- **ブラウザとの併用**: アプリの起動中は内蔵の Helper が動くので、同じ PC のブラウザで開いた Studio も利用できます。pipx で入れた Helper がすでに動いている場合は、アプリはそちらを使います。
- **対応 OS**: Windows のみです。macOS では Studio（Web）と [Helper](/docs/tools/helper/getting-started/) を使ってください。
