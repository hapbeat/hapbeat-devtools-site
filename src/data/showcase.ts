/**
 * /demos/showcase/ (デモ一覧) のデータ。一覧カードと詳細ページ (/demos/showcase/<id>/) は
 * すべてここから生成する。デモの追加・文言修正・サムネイル差し替えはこの
 * ファイルだけを編集すればよい。
 *
 * 掲載対象は hapbeat-demos 配下の Hapbeat 製デモ。内容の正本は各デモ repo の
 * README。仕様が変わったら README を見てここを追従させる。
 * 各デモの repo へのリンクは載せない (ソースは非公開のものが多い)。
 *
 * サムネイル:
 *   - 画像は public/showcase/ に置き、`thumbnail: '/showcase/<id>.webp'` のように
 *     サイトルートからのパスで指定する (jpg / png / webp)。16:9 推奨。
 *     (public/demos/ は fetch-demos が毎回作り直すので、素材はそこに置かない)
 *   - 短いプレイ動画は `video: '/showcase/<id>.mp4'` (H.264 MP4。無音で自動再生する)。
 *     video があればカード・詳細ページとも動画を優先し、thumbnail はポスター
 *     (読み込み前に出る静止画) として使う。
 *   - どちらも無いデモは、タイトル入りの単色プレースホルダを表示する。
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

export interface ShowcaseDemo {
  /** URL slug (/demos/showcase/<id>/) */
  id: string;
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
  /** 触覚の見どころ */
  haptics: string[];
  /** 体験に使うもの・人数など (ラベル → 値) */
  specs: { label: string; value: string }[];
  /** カード下部の短い要点 (2〜3 個) */
  meta: string[];
  thumbnail?: string;
  video?: string;
  /** false にすると一覧・詳細ページとも生成しない (展示会ごとに一時的に外す等) */
  published?: boolean;
}

export const SHOWCASE_DEMOS: ShowcaseDemo[] = [
  {
    id: 'trex-encounter',
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
  },
  {
    id: 'energy-duel',
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
  },
  {
    id: 'boxing',
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
  },
  {
    id: 'volley',
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
      '飛んでくるボールを、手のひらや腕で打ち返す',
    ],
    haptics: ['左右どちらの手・腕で受けたかに合わせた打球の衝撃', '体にボールが当たったときの衝撃'],
    specs: [
      { label: '機材', value: 'Meta Quest 3 / 3S（ハンドトラッキング）＋ Hapbeat' },
      { label: '人数', value: '1 人ずつ' },
      { label: '操作', value: '素手（コントローラでも可）' },
    ],
    meta: ['VR', '素手で操作', '1 人'],
  },
  {
    id: 'hand-demo',
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
  },
  {
    id: 'fps',
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
  },
  {
    id: 'safety-mill',
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
  },
];

export const PUBLISHED_SHOWCASE_DEMOS = SHOWCASE_DEMOS.filter((d) => d.published !== false);

export function categoryLabel(id: ShowcaseCategory): string {
  return SHOWCASE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
