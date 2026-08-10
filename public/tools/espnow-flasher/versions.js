// bin/versions.json (scripts/fetch-flash-bins.mjs が生成) を読んで、
// 各カードのバージョン行を埋める。取り込み前 / 取得失敗時は「不明」にする。

const GROUPS = {
  tx: ['m5stack_audio_tx', 'm5stack_cores3_audio_tx'],
  repeater: ['m5stack_repeater', 'xiao_c6_repeater'],
};

// 表示は基板名を短く。env 名そのままだと横に長すぎて折り返す。
const SHORT_NAME = {
  m5stack_audio_tx: 'Basic/Core2',
  m5stack_cores3_audio_tx: 'CoreS3',
  m5stack_repeater: 'Basic/Core2',
  xiao_c6_repeater: 'XIAO C6',
};

function render(group, text) {
  const el = document.querySelector(`[data-version-for="${group}"] span`);
  if (el) el.textContent = text;
}

try {
  const res = await fetch('./bin/versions.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  for (const [group, envs] of Object.entries(GROUPS)) {
    const parts = envs
      .filter((env) => data.builds?.[env])
      .map((env) => `${SHORT_NAME[env]} ${data.builds[env].fwVersion ?? '不明'}`);
    render(group, parts.length > 0 ? parts.join(' / ') : '不明');
  }
} catch {
  for (const group of Object.keys(GROUPS)) render(group, '不明');
}
