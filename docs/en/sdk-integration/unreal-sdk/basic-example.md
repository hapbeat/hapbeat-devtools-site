---
kind: tutorial
sidebar:
  order: 2
  label: BasicExample
---

# BasicExample (sample level)

`BasicExample` is included with the plugin. It is the smallest way to try Hapbeat's two playback paths: Stream and Fire (Command). For installation and the first playback, see [Getting Started](./getting-started.md).

## Open the level

In the Content Browser, enable **Show Plugin Content** from Settings, then open `Plugins/HapbeatSDK/Content/HapbeatSamples/BasicExample/Maps/BasicExample`.

## Controls

| Input | Playback / action | Kit deployment |
| --- | --- | --- |
| `Space` | Play a 100 Hz Stream once | Not required |
| `R` | Loop a 100 Hz Stream | Not required |
| `F` | Fire `basic-exam-kit.sine_200hz_1s` as a Command | Required |
| `S` | Stop every Stream and Fire playback | Not required |
| `C` | Ping Hapbeat | Not required |

Before trying `F`, open `Plugins/HapbeatSDK/Content/HapbeatSamples/BasicExample/Kit/basic-exam-kit/` in Hapbeat Studio and deploy it to the connected Hapbeat. `Space` sends raw PCM as a Stream, so it can play without installing a Kit.

## Structure

`HapbeatBasicExampleActor` in the World Outliner references `EM_BasicExample`. Triggers in that Actor receive the inputs and send a Stream or Fire through an Event Map entry.

```text
Input
  → Trigger in HapbeatBasicExampleActor
  → EM_BasicExample
  → Hapbeat SDK
```
