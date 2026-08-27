import { BAUD_RATE, ProvisioningResponseError, SerialProvisioningClient, redactedSetConfigFields } from './protocol.js';

const status = document.getElementById('connection-status');
const activity = document.getElementById('activity');
const connectButton = document.getElementById('connect');
const disconnectButton = document.getElementById('disconnect');
const readButton = document.getElementById('read-config');
const configForm = document.getElementById('config-form');
const unsignedWarning = document.getElementById('unsigned-warning');
let client;
let configLoaded = false;

const unverifiedFlashAllowed = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && new URLSearchParams(window.location.search).get('allowUnverified') === '1';
if (unverifiedFlashAllowed) {
  document.getElementById('unverified-flashers').hidden = false;
  document.getElementById('hardware-gate').textContent = '実機検証モードです。接続した M5 の機種を確認してから書き込んでください。';
}

function setStatus(text, kind = 'muted') {
  status.textContent = text;
  status.dataset.kind = kind;
}

function appendActivity(text, kind = 'info') {
  const line = document.createElement('li');
  line.dataset.kind = kind;
  line.textContent = text;
  activity.prepend(line);
  while (activity.children.length > 8) activity.lastElementChild.remove();
}

function updateConnection(connected) {
  connectButton.disabled = connected;
  disconnectButton.disabled = !connected;
  readButton.disabled = !connected;
  configForm.querySelectorAll('button, input, select').forEach((element) => {
    element.disabled = !connected || !configLoaded;
  });
}

function renderConfig(config) {
  for (const field of ['wifi_ssid', 'hmd_ip', 'controller_id', 'target_a_demo_id', 'target_b_demo_id', 'target_c_demo_id']) {
    const input = configForm.elements.namedItem(field);
    input.value = config[field] ?? '';
  }
  configForm.elements.namedItem('allow_unsigned').checked = config.allow_unsigned;
  configForm.elements.namedItem('isolated_lan').checked = config.isolated_lan;
  document.getElementById('wifi-password-state').textContent = config.wifi_password_set ? '設定済み' : '未設定';
  document.getElementById('shared-secret-state').textContent = config.shared_secret_set ? '設定済み' : '未設定';
  unsignedWarning.hidden = !config.allow_unsigned;
  configForm.querySelectorAll('input[name^="clear_"]').forEach((input) => { input.checked = false; });
  appendActivity(`設定を読み込みました（controller_id: ${config.controller_id}、next sequence: ${config.next_sequence}）。`);
}

function handleSerialEvent(event) {
  if (event.kind === 'line-too-long') appendActivity('1024 byte を超えるシリアル行を破棄しました。', 'error');
  if (event.kind === 'invalid-json') appendActivity('壊れたシリアル応答を破棄しました。', 'error');
  if (event.kind === 'read-error') appendActivity('シリアル接続が切れました。', 'error');
}

async function loadConfig() {
  const response = await client.getConfig();
  renderConfig(response.config);
  configLoaded = true;
  updateConnection(true);
}

function buildConfigUpdate() {
  const config = {};
  for (const field of ['wifi_ssid', 'hmd_ip', 'controller_id', 'target_a_demo_id', 'target_b_demo_id', 'target_c_demo_id']) {
    const input = configForm.elements.namedItem(field);
    const clear = configForm.elements.namedItem(`clear_${field}`);
    if (clear.checked) config[`clear_${field}`] = true;
    else if (input.value.trim()) config[field] = input.value.trim();
  }
  for (const field of ['wifi_password', 'shared_secret']) {
    const input = configForm.elements.namedItem(field);
    const clear = configForm.elements.namedItem(`clear_${field}`);
    const value = input.value;
    input.value = ''; // Do not retain secrets in the DOM after the outgoing frame is created.
    if (clear.checked) config[`clear_${field}`] = true;
    else if (value) config[field] = value;
  }
  config.allow_unsigned = configForm.elements.namedItem('allow_unsigned').checked;
  config.isolated_lan = configForm.elements.namedItem('isolated_lan').checked;
  if (config.allow_unsigned && !config.isolated_lan) throw new Error('未署名モードには「隔離したデモ LAN」を明示的に選ぶ必要があります。');
  if (config.allow_unsigned && 'shared_secret' in config) throw new Error('未署名モードと shared secret の設定は同時に保存できません。');
  return config;
}

function checkBrowserSupport() {
  if (!window.isSecureContext) return 'このページは HTTPS で開いてください。';
  if (!navigator.serial) return 'Web Serial API が必要です。Chrome または Edge のデスクトップ版で開いてください。';
  return null;
}

const unsupported = checkBrowserSupport();
if (unsupported) {
  setStatus(unsupported, 'error');
  connectButton.disabled = true;
} else {
  setStatus(`未接続（USB CDC serial、${BAUD_RATE} baud）`);
}
updateConnection(false);

connectButton.addEventListener('click', async () => {
  const message = checkBrowserSupport();
  if (message) return setStatus(message, 'error');
  try {
    const port = await navigator.serial.requestPort();
    client = new SerialProvisioningClient(port, { onEvent: handleSerialEvent });
    await client.open();
    updateConnection(true);
    setStatus(`接続済み（USB CDC serial、${BAUD_RATE} baud）`, 'ok');
    appendActivity('controller に接続しました。');
    try {
      await loadConfig();
    } catch (error) {
      setStatus(`接続済みですが設定を取得できません: ${error.message}`, 'error');
    }
  } catch (error) {
    setStatus(`シリアルポートを開けませんでした: ${error.message}`, 'error');
  }
});

disconnectButton.addEventListener('click', async () => {
  await client?.close();
  client = undefined;
  configLoaded = false;
  updateConnection(false);
  setStatus(`未接続（USB CDC serial、${BAUD_RATE} baud）`);
});

readButton.addEventListener('click', async () => {
  try {
    await loadConfig();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

configForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const config = buildConfigUpdate();
    const fields = redactedSetConfigFields(config).join(', ');
    await client.setConfig(config);
    appendActivity(`設定を保存しました: ${fields}。`);
    setStatus('設定を保存しました。', 'ok');
    await loadConfig();
  } catch (error) {
    setStatus(error instanceof ProvisioningResponseError ? `${error.code}: ${error.message}` : error.message, 'error');
  }
});

document.getElementById('factory-reset').addEventListener('click', async () => {
  if (!window.confirm('Wi-Fi、接続先、A/B/C、秘密鍵を消去します。続行しますか？')) return;
  try {
    await client.factoryReset();
    appendActivity('出荷時設定に戻しました。');
    await loadConfig();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('reboot').addEventListener('click', async () => {
  try {
    await client.reboot();
    appendActivity('再起動を要求しました。接続が切れたら再接続してください。');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});
