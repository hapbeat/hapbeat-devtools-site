/**
 * /demos/showcase/ (デモ一覧) のデータ。一覧カードと詳細ページ (/demos/showcase/<id>/) は
 * すべてここから生成する。デモの追加・文言修正・サムネイル差し替えはこの
 * ファイルだけを編集すればよい。
 *
 * 掲載対象は hapbeat-demos 配下の Hapbeat 製デモ。内容の正本は各デモ repo の
 * README。仕様が変わったら README を見てここを追従させる。
 * 各デモの repo へのリンクは載せない (ソースは非公開のものが多い)。
 *
 * 素材 (public/showcase/<id>/ に置き、サイトルートからのパスで指定する):
 *   - thumbnail: '/showcase/<id>/thumb.webp' — 一覧カードの画像。16:9 (1280x720)。
 *   - video: '/showcase/<id>/pv.mp4' — 詳細ページ上部で無音ループ再生する
 *     15 秒前後の PV (H.264、音声トラックなし)。thumbnail をポスターに使う。
 *   - screenshots: [{ src: '/showcase/<id>/shot-1.webp', caption: '…' }, …] —
 *     詳細ページのギャラリー (クリックで拡大)。
 *   - 素材が無いデモは、タイトル入りの単色プレースホルダを表示する。
 *   - public/demos/ は fetch-demos が毎回作り直すので、素材はそこに置かない。
 *   - 撮り直しの手順とスクリプトは workspace の
 *     dev-notes/devtools-site/showcase-capture/<id>/ にある。
 *   - この repo は public。ライセンス上公開できない第三者素材 (他社ゲームの
 *     画面・購入アセットの単体画像など) は public/showcase/ にコミットしない。
 */

export type ShowcaseCategory = 'space' | 'vr-hands' | 'training' | 'game';

export const SHOWCASE_CATEGORIES: { id: ShowcaseCategory; label: string }[] = [
  { id: 'space', label: '空間・インスタレーション' },
  { id: 'vr-hands', label: 'VR ハンドトラッキング' },
  { id: 'training', label: '研修・安全教育' },
  { id: 'game', label: 'ゲーム・エンタメ' },
];

export interface HubOption {
  id: string;
  label: string;
  default: string;
  values: { value: string; label: string }[];
  when?: Record<string, string[]>;
}

export interface ShowcaseDemo {
  /** URL slug (/demos/showcase/<id>/) */
  id: string;
  /**
   * Demo Hub / Demo Switch の demo_id (各デモの hapbeat-demo-session.json の demo_id、
   * hapbeat-contracts specs/demo-session.md)。Quest のデモだけが持つ。
   * 展示用リモコンのプリセットに入れられるのはこれがあるデモだけ。
   */
  hubDemoId?: string;
  /**
   * Hub で選べる設定 (各デモの hapbeat-demo-session.json の options の写し)。
   * リモコン用プランの作成ページで使う。descriptor を変えたらここも合わせる。
   * when: 他の設定がこの値のときだけ有効 (例: volley の points は scene が block / match のとき)。
   */
  hubOptions?: HubOption[];
  title: string;
  /** タイトルの下に小さく出す日本語名・別名 */
  subtitle?: string;
  categories: ShowcaseCategory[];
  /** プレースホルダの絵文字 */
  icon: string;
  /** プレースホルダ・アクセントの色相 (oklch の hue, 0-360) */
  hue: number;
  /** カードに出す 1〜2 行の説明 */
  tagline: string;
  /** 詳細ページの導入文 */
  description: string;
  /** 体験の流れ (順番に) */
  flow: string[];
  /** 触覚体験 (どんな触覚を感じられるか。詳細ページ上段に出す) */
  haptics: string[];
  /** 体験に使うもの・人数など (ラベル → 値) */
  specs: { label: string; value: string }[];
  /** カード下部の短い要点 (2〜3 個) */
  meta: string[];
  thumbnail?: string;
  video?: string;
  /** step: そのスクショが対応する体験の流れ (flow) の番号 (1 始まり)。詳細ページで番号を揃えて並べる */
  screenshots?: { src: string; caption: string; step?: number }[];
  /** false にすると一覧・詳細ページとも生成しない (展示会ごとに一時的に外す等) */
  published?: boolean;
}

export const SHOWCASE_DEMOS: ShowcaseDemo[] = [
  {
    id: 'trex-encounter',
    hubDemoId: 'trex-encounter',
    title: 'T-Rex Encounter',
    subtitle: 'T-Rex エンカウンター',
    categories: ['vr-hands', 'game'],
    icon: '🦖',
    hue: 145,
    tagline: '恐竜が目の前まで近づいて咆哮。素手で骨付き肉を差し出して食べさせ、下げた頭をなでる。',
    description:
      'ジャングルの空き地で、大きな T-Rex と出会う体験です。咆哮の地響き、頭をなでる感触を Hapbeat の振動で体に返します。コントローラは使わず、ハンドトラッキングの素手で操作します。',
    flow: [
      '人差し指を立てて合図すると始まる',
      'T-Rex が近づき、目の前で咆哮する',
      '台に置かれた骨付き肉をつかんで差し出すと、T-Rex が食べに来る',
      '食べ終わって下げた頭を、手でなでる',
      'T-Rex が向きを変えて去っていく',
    ],
    haptics: [
      '咆哮の振動を首まわりに。恐竜のいる方向に左右の強さを寄せる',
      '頭をなでると、触れている側の手首にこする感触。速くなでるほど強い',
    ],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat（首・両手首）' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（コントローラなし）' },
    ],
    meta: ['VR', '素手で操作', '1 人'],
    thumbnail: '/showcase/trex-encounter/thumb.webp',
    video: '/showcase/trex-encounter/pv.mp4',
    screenshots: [
      { src: '/showcase/trex-encounter/shot-1.webp', caption: 'ジャングルの空き地を近づくT-Rex', step: 2 },
      { src: '/showcase/trex-encounter/shot-2.webp', caption: '目の前で大きく口を開けて咆哮', step: 2 },
      { src: '/showcase/trex-encounter/shot-3.webp', caption: 'ハッチから肉のトレイがせり上がる', step: 3 },
      { src: '/showcase/trex-encounter/shot-4.webp', caption: '手に持った肉にかぶりつく', step: 3 },
      { src: '/showcase/trex-encounter/shot-5.webp', caption: 'なでた後の下げた頭と目が合う', step: 4 },
    ],
  },
  {
    id: 'ripple',
    title: 'Ripple',
    subtitle: '波紋',
    categories: ['space'],
    icon: '🌊',
    hue: 220,
    tagline: '画面の水面に広がる波紋が届いた瞬間、その人の Hapbeat が振動する。2〜4 人が同時に、ヘッドセットなしで。',
    description:
      '暗い水面に生まれた波紋が広がり、波面が人に届いた瞬間にその人の Hapbeat が振動します。カメラで一人ひとりの位置を捉えて画面に表示し、見えた波と感じる振動が同じタイミングで重なります。一人ずつ順に届く場面と、全員に同時に届く場面を、音楽つき約 90 秒のパフォーマンスとして見せます。映像と複数台の Hapbeat を Python SDK から同期させており、映像演出に触覚を組み込む例にもなります。',
    flow: [
      '体験者が Hapbeat を着けて画面の前に並ぶ（カメラが位置を捉え、画面に丸で表示）',
      '画面のあちこちから波紋が生まれ、届いた人から順に振動する',
      '音楽に合わせて、一人ずつ・全員同時の波が続く（約 90 秒）',
    ],
    haptics: [
      '波が丸の縁を横切る瞬間に振動。かすかな波はかすかに、大きなうねりは長く',
      '波が来た方向に合わせて、振動が体の左から右へ（右から左へ）移っていく',
      '近くにいる人ほど少し強く感じる',
    ],
    specs: [
      { label: '機材', value: 'PC ＋ カメラ ＋ 画面（モニタ等）＋ Hapbeat（人数分）' },
      { label: '人数', value: '2〜4 人で同時に（会議室程度の広さ）' },
      { label: 'ヘッドセット', value: '不要' },
    ],
    meta: ['ヘッドセットなし', '2〜4 人同時', '約 90 秒'],
    thumbnail: '/showcase/ripple/thumb.webp',
    video: '/showcase/ripple/pv.mp4',
    screenshots: [
      { src: '/showcase/ripple/shot-1.webp', caption: '雫の波面が人を通り抜ける瞬間', step: 2 },
      { src: '/showcase/ripple/shot-2.webp', caption: '同心円の輪が3人に届く', step: 2 },
      { src: '/showcase/ripple/shot-3.webp', caption: '深海背景で大きな揺らぎが通過', step: 3 },
      { src: '/showcase/ripple/shot-4.webp', caption: '平面波が画面を横切り頭に触れる', step: 3 },
      { src: '/showcase/ripple/shot-5.webp', caption: 'ビッグバンで全員に同時に届く', step: 3 },
    ],
  },
  {
    id: 'energy-duel',
    hubDemoId: 'energy-duel',
    hubOptions: [
      { id: 'tutorial', label: 'チュートリアル', default: 'on', values: [{ value: 'on', label: 'あり' }, { value: 'off', label: 'なし' }] },
      { id: 'round_seconds', label: '試合の長さ', default: '30', values: [{ value: '30', label: '30秒' }, { value: '60', label: '60秒' }] },
      { id: 'difficulty', label: '相手の強さ', default: 'normal', values: [{ value: 'normal', label: 'ふつう' }, { value: 'strong', label: '強い' }] },
      { id: 'mode', label: 'モード', default: 'match', values: [{ value: 'match', label: '試合' }, { value: 'free', label: 'フリープレイ' }] },
    ],
    title: 'Energy Duel',
    subtitle: 'エナジーデュエル',
    categories: ['vr-hands', 'game'],
    icon: '⚡',
    hue: 290,
    tagline: '手を握って溜め、突き出して開けばエネルギー弾。腕を横に構えればシールド。動き回る AI と撃ち合う 1 人用対戦。',
    description:
      'ハンドトラッキングで遊ぶ 1 対 1 の撃ち合いです。何も持たない手からエネルギー弾を放ち、相手の弾は腕のシールドで受けるか、体をかわして避けます。溜め・発射・ガード・ガード割れ・被弾を、それぞれ違う触覚で返すのが主役です。',
    flow: [
      'チュートリアル: 撃つ → 最大まで溜めて当てる → ガード → 相手の弾を撃ち消す',
      '30 秒の試合で AI の相手と撃ち合う',
      '結果のあと、もう一試合またはフリープレイ',
    ],
    haptics: [
      '溜めの段階が上がるたびに合図、最大まで溜まると完了の触覚',
      '発射・ガードで受けた手応え・シールドが割れる衝撃・被弾をそれぞれ別の触覚で',
      '弾同士がぶつかって消えると、首にかすかな余韻',
    ],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（コントローラでも可）' },
    ],
    meta: ['VR', '素手で操作', '1 人'],
    thumbnail: '/showcase/energy-duel/thumb.webp',
    video: '/showcase/energy-duel/pv.mp4',
    screenshots: [
      { src: '/showcase/energy-duel/shot-1.webp', caption: '拳にLv2のエネルギー球とリング', step: 1 },
      { src: '/showcase/energy-duel/shot-2.webp', caption: 'パーに開いてLv3弾を発射', step: 1 },
      { src: '/showcase/energy-duel/shot-3.webp', caption: '前腕の八角形シールドが割れる瞬間', step: 2 },
      { src: '/showcase/energy-duel/shot-4.webp', caption: '自分の弾と相手の弾がぶつかる', step: 2 },
      { src: '/showcase/energy-duel/shot-5.webp', caption: '相手に迫るLv3弾（相手アップ）', step: 2 },
    ],
  },
  {
    id: 'boxing',
    hubDemoId: 'boxing',
    hubOptions: [{ id: 'round', label: 'ラウンド', default: '90', values: [{ value: '60', label: '60秒' }, { value: '90', label: '90秒' }] }],
    title: 'Boxing',
    subtitle: 'ボクシング',
    categories: ['vr-hands', 'game'],
    icon: '🥊',
    hue: 25,
    tagline: '90 秒の VR スパーリング。左右のグローブで打ち込み、ガードし、頭を動かして相手のパンチをかわす。',
    description:
      'リングで相手と向き合う 90 秒のスパーリングです。手の動きがそのままグローブになり、打ち込んだ手応えも、腕で受けたパンチも Hapbeat で返します。HP が 0 になるとノックアウトで終了します。',
    flow: [
      'リング上の開始位置に立ち、3 カウントでラウンド開始',
      '左右のグローブで攻撃・ガード、頭を動かして相手のパンチを避ける',
      '90 秒またはノックアウトで終了し、スコアを表示',
    ],
    haptics: [
      'パンチが当たった手応えを、打った側の手首に',
      'グローブや腕でガードした衝撃と、ガードしきれなかった被弾',
    ],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat' },
      { label: '人数', value: '1 人ずつ' },
      { label: '注意', value: '周囲に人や物がない場所で、弱いパンチから始める' },
    ],
    meta: ['VR', '90 秒', '1 人'],
    thumbnail: '/showcase/boxing/thumb.webp',
    video: '/showcase/boxing/pv.mp4',
    screenshots: [
      { src: '/showcase/boxing/shot-5.webp', caption: '開始カウントダウンで相手と対峙', step: 1 },
      { src: '/showcase/boxing/shot-1.webp', caption: '左フックが相手の頭にヒット', step: 2 },
      { src: '/showcase/boxing/shot-2.webp', caption: '相手のフックが顔面へ迫る', step: 2 },
      { src: '/showcase/boxing/shot-3.webp', caption: '相手のフックを左グローブでブロック', step: 2 },
      { src: '/showcase/boxing/shot-4.webp', caption: '決め手のフックでKO勝利', step: 3 },
    ],
  },
  {
    id: 'volley',
    hubDemoId: 'volley',
    hubOptions: [
      {
        id: 'scene',
        label: 'モード',
        default: 'block',
        values: [{ value: 'block', label: 'スパイク＋ブロック' }, { value: 'match', label: '6人制の試合' }, { value: 'receive', label: 'レシーブ' }],
      },
      {
        id: 'points',
        label: '点数',
        default: '7',
        values: [{ value: '3', label: '3点先取' }, { value: '5', label: '5点先取' }, { value: '7', label: '7点先取' }],
        when: { scene: ['block', 'match'] },
      },
      { id: 'balls', label: '球数', default: '10', values: [{ value: '10', label: '10球' }, { value: '20', label: '20球' }], when: { scene: ['receive'] } },
    ],
    title: 'Volley',
    subtitle: 'バレーボール',
    categories: ['vr-hands', 'game'],
    icon: '🏐',
    hue: 60,
    tagline: '飛んでくるボールを素手でレシーブ・スパイク・ブロック。手や腕、体に当たる衝撃を触覚で返す。',
    description:
      'アリーナでバレーボールを体験する 1 人プレイのデモです。ボールを受ける手の向きと振りの速さでボールの行き先が決まり、当たった場所に応じた衝撃を Hapbeat で返します。',
    flow: [
      'モードを選ぶ: スパイク＋ブロック / レシーブ / 6 人制の試合',
      '相手のサーブやスパイクを、手のひらや腕でレシーブする',
      '味方のトスに合わせて、ボールを打ち下ろすスパイク',
      'ネット際で両手を上げて、相手のスパイクをブロック',
    ],
    haptics: ['左右どちらの手・腕で受けたかに合わせた打球の衝撃', '体にボールが当たったときの衝撃'],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（コントローラでも可）' },
    ],
    meta: ['VR', '素手で操作', '1 人'],
    thumbnail: '/showcase/volley/thumb.webp',
    video: '/showcase/volley/pv.mp4',
    screenshots: [
      { src: '/showcase/volley/shot-1.webp', caption: 'サーブのトス、6対6の試合コート全景', step: 1 },
      { src: '/showcase/volley/shot-3.webp', caption: '相手スパイクを正面でレシーブ', step: 2 },
      { src: '/showcase/volley/shot-5.webp', caption: 'ネット際で味方セッターがトス', step: 3 },
      { src: '/showcase/volley/shot-2.webp', caption: '右手でボールを捉えるスパイク', step: 3 },
      { src: '/showcase/volley/shot-4.webp', caption: 'ネット越しに両手でブロック', step: 4 },
    ],
  },
  {
    id: 'hand-demo',
    hubDemoId: 'handdemo',
    title: 'Hand Demo',
    subtitle: 'つかむ・押す',
    categories: ['vr-hands'],
    icon: '✋',
    hue: 190,
    tagline: '机の上の物をつかむ・押す・はめ込む・スライドさせる。手で触れるたびに手首へ触覚が返る、最初の体験向け。',
    description:
      '机に並んだ箱・ボタン・スライダー・パネルを素手で操作します。つかむ、離す、スロットにはめる、ボタンを押し込む、といった一つひとつの操作に、触れた側の手首へ触覚が返ります。音声と手の見本で一つずつ案内するので、VR や触覚が初めての方の最初の体験に向きます。',
    flow: [
      '音声と手の見本の案内に沿って、一つずつ操作する',
      'ボタン・スクロール・箱・円柱・スロット・スライダー・押しボタンなど',
      '最後は自由に触って遊ぶ',
    ],
    haptics: ['つかむ・離す・はめ込む・押し込むなど、操作ごとに違う触覚', '左右の手首それぞれに、触れた側の手だけ返す'],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat（両手首）' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手' },
    ],
    meta: ['VR', '初めての方向け', '1 人'],
    thumbnail: '/showcase/hand-demo/thumb.webp',
    video: '/showcase/hand-demo/pv.mp4',
    screenshots: [
      { src: '/showcase/hand-demo/shot-1.webp', caption: '目線から見た体験テーブル全景', step: 1 },
      { src: '/showcase/hand-demo/shot-5.webp', caption: '青いお手本の手がボタン押しを実演', step: 1 },
      { src: '/showcase/hand-demo/shot-2.webp', caption: '自分の手で箱をつかんで持ち上げる', step: 2 },
      { src: '/showcase/hand-demo/shot-3.webp', caption: '赤いポークボタンを指で押す', step: 2 },
      { src: '/showcase/hand-demo/shot-4.webp', caption: 'ブロックをスナップソケットへ差し込む', step: 2 },
    ],
  },
  {
    id: 'fps',
    hubDemoId: 'fps',
    title: 'FPS',
    subtitle: 'VR シューター',
    categories: ['vr-hands', 'game'],
    icon: '🎯',
    hue: 0,
    tagline: 'アリーナで敵を倒し、ボスのタレットを破壊する VR シューター。発射・チャージ・被弾を手首と首で感じる。',
    description:
      '武器を持ってアリーナを進み、ゴールのボス（タレット）を破壊する一人称シューティングです。武器ごとに違う発射の反動、チャージの高まり、被弾を、手首と首の Hapbeat で返します。プレイヤーは倒れないので、最後まで遊べます。',
    flow: ['最初に移動・武器の取り方・撃ち方を案内', 'アリーナの敵を倒しながら進む', 'ボスのタレットを破壊してクリア'],
    haptics: [
      'ブラスター・ランチャー・ショットガンで違う発射の反動（手首と首）',
      'ランチャーのチャージと発射・着弾',
      '被弾・高所からの着地',
    ],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S ＋ Hapbeat（手首・首）' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（コントローラでも可）' },
    ],
    meta: ['VR', '素手で操作', '1 人'],
    thumbnail: '/showcase/fps/thumb.webp',
    video: '/showcase/fps/pv.mp4',
    screenshots: [
      { src: '/showcase/fps/shot-5.webp', caption: '溶岩に囲まれたアリーナ全景', step: 1 },
      { src: '/showcase/fps/shot-2.webp', caption: '素手で腰のラックから銃を取る', step: 1 },
      { src: '/showcase/fps/shot-3.webp', caption: 'ブラスターがロボットに命中', step: 2 },
      { src: '/showcase/fps/shot-4.webp', caption: 'ランチャーのディスクが炸裂', step: 2 },
      { src: '/showcase/fps/shot-1.webp', caption: 'チャージディスクをボス砲台へ発射', step: 3 },
    ],
  },
  {
    id: 'safety-mill',
    hubDemoId: 'safety-mill',
    title: 'Safety Mill VR',
    subtitle: 'フライス盤の安全教育',
    categories: ['training', 'vr-hands'],
    icon: '⚙️',
    hue: 85,
    tagline: '回転中の刃物の近くで切り粉を払うと「巻き込まれ」を衝撃で体感。その後、正しい手順で作業をやり直す安全教育。',
    description:
      '小型フライス盤でアルミブロックを削る作業を VR で行います。切り粉が次のけがき線を隠したとき、回転中の刃物のそばでブラシを使うと巻き込まれ、手首と首への衝撃で危険を体で覚えます。そのあと、主軸を止める・止まるのを待つ・切り粉を払う・再始動する、という安全な手順で作業を仕上げます。',
    flow: [
      'ハンドルを回してテーブルを送り、ブロックを削る',
      '回転中の刃物の近くで切り粉を払い、巻き込まれを体感する',
      '主軸を止めて、止まるのを待ってから切り粉を払う',
      '再始動して切削を仕上げる',
    ],
    haptics: [
      'ハンドルのクリック感、刃が当たる瞬間、送りの速さと負荷に応じた切削の振動',
      '巻き込まれの衝撃を、操作していた手首と首に',
      'ボタン操作・つかむ・ブラシが触れる感触',
    ],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat（手首・首）' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（音声で手順を案内）' },
    ],
    meta: ['VR 研修', '素手で操作', '1 人'],
    thumbnail: '/showcase/safety-mill/thumb.webp',
    video: '/showcase/safety-mill/pv.mp4',
    screenshots: [
      { src: '/showcase/safety-mill/shot-1.webp', caption: '工房の小型フライス盤とアルミブロック', step: 1 },
      { src: '/showcase/safety-mill/shot-2.webp', caption: 'ハンドルを回し切削、切粉が飛ぶ', step: 1 },
      { src: '/showcase/safety-mill/shot-3.webp', caption: '回転する刃物の周りに切粉が積もる', step: 1 },
      { src: '/showcase/safety-mill/shot-4.webp', caption: '回転中の刃物にブラシが巻き込まれる', step: 2 },
      { src: '/showcase/safety-mill/shot-5.webp', caption: '停止後にブラシで払い青線が出る', step: 3 },
    ],
  },
];

export const PUBLISHED_SHOWCASE_DEMOS = SHOWCASE_DEMOS.filter((d) => d.published !== false);

export function categoryLabel(id: ShowcaseCategory): string {
  return SHOWCASE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** リモコン用プラン作成ページ・受け取りページ (クライアント側の JS) に渡す、Hub に入れられるデモの一覧。 */
export interface RemoteCatalogEntry {
  demoId: string;
  showcaseId: string;
  title: string;
  subtitle?: string;
  icon: string;
  hue: number;
  thumbnail?: string;
  options: HubOption[];
}

export function remoteCatalog(): RemoteCatalogEntry[] {
  return PUBLISHED_SHOWCASE_DEMOS.filter((d) => d.hubDemoId).map((d) => ({
    demoId: d.hubDemoId!,
    showcaseId: d.id,
    title: d.title,
    subtitle: d.subtitle,
    icon: d.icon,
    hue: d.hue,
    thumbnail: d.thumbnail,
    options: d.hubOptions ?? [],
  }));
}

/** <script type="application/json"> に埋め込める JSON (</script> で閉じられないよう < をエスケープ)。 */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
