# Instructions: FTP-Deploy-Action timeout / control socket 失敗の調査

**発行日:** 2026-05-03
**起票:** mac 動作検証セッション (workspace, hapbeat-helper の TestPyPI publish 後)
**優先度:** 高（Studio 最新が devtools.hapbeat.com に反映されないため）

## 背景

`hapbeat-devtools-site` の `.github/workflows/deploy.yml` が以下のエラーで
FTP 段階で失敗している。Astro ビルド自体は通るが、Xserver への FTPS upload
で `Timeout (control socket)` が発生:

```
Failed to connect, are you sure your server works via FTP or FTPS?
Users sometimes get this error when the server only supports SFTP.

Error: Timeout (control socket)
    at Socket.<anonymous> (.../FTP-Deploy-Action/v4.3.6/dist/index.js:5309:33)
```

ワークフロー設定:
- `SamKirkland/FTP-Deploy-Action@v4.3.6`
- `protocol: ftps`, `port: 21`
- secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`

このエラーで **devtools.hapbeat.com の Studio (`/studio/` 配下を除く Astro 部分)**
が古いまま (`bcedd5d feat: ヘッダー再構成 + IA 整理` までは反映済、それ以降は不明)。
Studio 本体 (`hapbeat-studio`) は別 workflow でデプロイされる前提だが、
Astro 側で配置している Studio 静的アセットや docs の更新が止まっている可能性。

## 確認手順

### 1. 一過性チェック（最優先・5 分）

1. GitHub → Actions → Deploy → 失敗した run → 右上の **Re-run jobs** で再実行
2. 通れば一過性。終了
3. それでも timeout なら次へ

### 2. Xserver 側の状態確認

- Xserver 障害情報: <https://www.xserver.ne.jp/supportnews/>
- Xserver サーバーパネル → **FTP制限設定** で IP 制限が ON になっていないか
  - GitHub Actions の runner は IP 固定不可なので、**FTP 制限は OFF** が前提
  - 万一 ON になっていれば OFF に切替（"全 IP 許可"）

### 3. 手元で FTPS 接続検証

FileZilla 等で同じ credential で接続してみる:
- Server: `secrets.FTP_SERVER` の値
- Protocol: **FTPS - FTP over TLS (Explicit)**
- Port: 21
- Username / Password: `FTP_USERNAME` / `FTP_PASSWORD`

接続できれば → Actions 側 / 一過性
接続できなければ → credential 期限切れ or Xserver 側設定変更

### 4. Xserver パスワード再生成 → secret 再登録

Xserver で FTP password が無効化されている可能性。
Xserver サーバーパネル → **FTPアカウント設定** → 該当アカウントのパスワード変更 →
GitHub repo Settings → Secrets and variables → Actions → `FTP_PASSWORD` を更新。

### 5. ワークフロー側のチューニング

それでも timeout が続く場合の代替案:

#### A. `timeout` パラメータ追加

```yaml
- name: FTP Deploy
  uses: SamKirkland/FTP-Deploy-Action@v4.3.6
  with:
    ...
    timeout: 60000  # default は 30000ms
```

#### B. action のバージョン更新

`v4.3.6` は 2024 後半のリリース。最新版 (`v4.3.x` 系の patch up or `v5` 系)
で同問題が解決しているか確認:

- <https://github.com/SamKirkland/FTP-Deploy-Action/releases>
- changelog で "control socket" / "timeout" に関する修正があれば追従

#### C. SFTP に切替（要 Xserver 対応）

Xserver は SSH/SFTP も対応しているので、`appleboy/scp-action`
等の SFTP-based deploy に切替えるのが中長期で堅い。
secrets を `FTP_*` → `SSH_*` 系に作り直し。

## 副次タスク（同時対応推奨）

### Node.js 20 deprecation

警告:
```
Node.js 20 actions are deprecated. ... 2026-06-02 までに Node.js 24 デフォルト化
```

対象: `actions/checkout@v4`, `actions/setup-node@v4`, `SamKirkland/FTP-Deploy-Action@v4.3.6`

期限: **2026-06-02**。約 1 ヶ月余裕あり。各 action の最新 v5 系 release を確認して
`@v4` → `@v5` (or 該当バージョン) に上げる。

## 完了条件

- [ ] devtools.hapbeat.com への push → deploy success が再現的に通る
- [ ] 失敗が再発した場合の対処手順を README または `docs/` に追記
- [ ] Node.js 20 deprecation の対応 (期日 2026-06-02 までに完了)

## 関連ファイル

- `.github/workflows/deploy.yml` (主対象)
- 起票元: workspace セッション (mac 検証中、Studio が古い件で気付いた)
