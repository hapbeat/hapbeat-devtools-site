/**
 * @typedef {object} SearchRoute
 * @property {string} canonicalQuery
 * @property {readonly string[]} aliases
 */

/** @type {Record<string, SearchRoute>} */
const searchRoutesByPath = {
  '/docs/start-here/getting-started/': { canonicalQuery: 'Hapbeat Getting Started', aliases: ['Hapbeatを初めて使う', 'Hapbeatを始めるには', '初めて振動を試したい'] },
  '/docs/concepts/architecture/': { canonicalQuery: 'アーキテクチャ全体像', aliases: ['Hapbeatの仕組みを知りたい', 'Hapbeatの全体構成', 'Studio Helper SDKの違い'] },
  '/docs/concepts/event-id-and-kit/': { canonicalQuery: 'Event ID Kit', aliases: ['イベントIDで振動したい', 'Kitを作りたい', '触覚イベントを登録したい'] },
  '/docs/tools/studio/initial-setup/': { canonicalQuery: 'Hapbeat を初期設定する', aliases: ['HapbeatをWi-Fiに接続したい', 'HapbeatのWi-Fi設定', 'Studioで初期設定したい'] },
  '/docs/tools/helper/getting-started/': { canonicalQuery: 'Helper インストール', aliases: ['Helperをインストールしたい', 'StudioがHelperに接続できない', 'hapbeat-helperを起動したい'] },
  '/docs/hardware/troubleshooting/': { canonicalQuery: 'トラブルを解決する', aliases: ['Hapbeatが振動しない', 'Hapbeatが振動しません', 'Hapbeatが動かない', 'デバイスのトラブルを直したい'] },
  '/docs/sdk-integration/unity-sdk/getting-started/': { canonicalQuery: 'Unity SDK Getting Started', aliases: ['UnityでHapbeatを使い始める', 'UnityにHapbeatを入れたい', 'Unityから振動を出したい'] },
  '/docs/sdk-integration/unity-sdk/targeting/': { canonicalQuery: 'Unity ターゲティング', aliases: ['Unityで振動先を指定したい', '特定のHapbeatだけ振動させたい', 'Unityのターゲット設定'] },
  '/docs/sdk-integration/python-sdk/getting-started/': { canonicalQuery: 'Python SDK Getting Started', aliases: ['PythonでHapbeatを使いたい', 'Pythonから振動を出したい', 'Python SDKを始める'] },
  '/docs/sdk-integration/js-sdk/getting-started/': { canonicalQuery: 'JavaScript SDK Getting Started', aliases: ['JavaScriptでHapbeatを使いたい', 'Webから振動を出したい', 'JavaScript SDKを始める'] },
  '/docs/sdk-integration/arduino-sdk/getting-started/': { canonicalQuery: 'Arduino SDK Getting Started', aliases: ['ArduinoでHapbeatを使いたい', 'ESP32から振動を出したい', 'Arduino SDKを始める'] },
  '/en/docs/start-here/getting-started/': { canonicalQuery: 'Hapbeat Getting Started', aliases: ['how do I get started with Hapbeat', 'use Hapbeat for the first time', 'set up Hapbeat', 'try haptics'] },
  '/en/docs/concepts/architecture/': { canonicalQuery: 'Hapbeat Architecture', aliases: ['how does Hapbeat work', 'Hapbeat system architecture', 'difference between Studio Helper and SDK'] },
  '/en/docs/concepts/event-id-and-kit/': { canonicalQuery: 'Event ID Kit', aliases: ['trigger haptics by event ID', 'create a Hapbeat Kit', 'register a haptic event'] },
  '/en/docs/tools/studio/initial-setup/': { canonicalQuery: 'Set Up Hapbeat', aliases: ['connect Hapbeat to Wi-Fi', 'set up Hapbeat Wi-Fi', 'initial setup in Studio'] },
  '/en/docs/tools/helper/getting-started/': { canonicalQuery: 'Install Helper', aliases: ['install hapbeat-helper', 'Studio cannot connect to Helper', 'start hapbeat-helper'] },
  '/en/docs/hardware/troubleshooting/': { canonicalQuery: 'Troubleshooting Hapbeat', aliases: ['Hapbeat is not vibrating', 'Hapbeat is not working', 'fix my Hapbeat device'] },
  '/en/docs/sdk-integration/unity-sdk/getting-started/': { canonicalQuery: 'Unity SDK Getting Started', aliases: ['make Unity vibrate', 'add haptics to a Unity game', 'get started with the Unity SDK'] },
  '/en/docs/sdk-integration/unity-sdk/targeting/': { canonicalQuery: 'Unity Targeting', aliases: ['target a specific Hapbeat in Unity', 'choose which device vibrates', 'Unity haptic targeting'] },
  '/en/docs/sdk-integration/python-sdk/getting-started/': { canonicalQuery: 'Python SDK Getting Started', aliases: ['use Hapbeat from Python', 'make Python vibrate Hapbeat', 'get started with the Python SDK'] },
  '/en/docs/sdk-integration/js-sdk/getting-started/': { canonicalQuery: 'JavaScript SDK Getting Started', aliases: ['use Hapbeat from JavaScript', 'add haptics to a web app', 'get started with the JavaScript SDK'] },
  '/en/docs/sdk-integration/arduino-sdk/getting-started/': { canonicalQuery: 'Arduino SDK Getting Started', aliases: ['use Hapbeat from Arduino', 'make an ESP32 vibrate Hapbeat', 'get started with the Arduino SDK'] },
};

export function searchTermsForPath(pathname) {
  return searchRoutesByPath[pathname]?.aliases;
}

function normalizePhrase(value) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
}

/** Convert explicit natural-language aliases to terms already present in the target page. */
export function normalizeSearchTerm(term) {
  const normalizedTerm = normalizePhrase(term);
  for (const route of Object.values(searchRoutesByPath)) {
    for (const alias of route.aliases) {
      const normalizedAlias = normalizePhrase(alias);
      if (normalizedTerm === normalizedAlias || normalizedTerm.includes(normalizedAlias)) {
        return route.canonicalQuery;
      }
    }
  }
  return term;
}
