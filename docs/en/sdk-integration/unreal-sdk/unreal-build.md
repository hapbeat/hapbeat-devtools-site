---
kind: howto
sidebar:
  label: Build the project
---

# Build the project

This is how to add the source version of Hapbeat SDK to a Windows C++ project. Install the **Game development with C++** workload for Visual Studio 2022 first.

## Build the plugin

1. Close Unreal Editor.
2. Right-click the project's `.uproject` file and select **Generate Visual Studio project files**.
3. Open the generated `.sln`, choose **Development Editor / Win64**, and build the project.
4. Open the `.uproject` and continue with plugin enablement in [Getting Started](./getting-started.md).

If the build fails, inspect the first compiler error in **Output > Build** in Visual Studio. `could not be compiled` alone does not identify the cause.

## Use the SDK from C++

Open **Tools → Open Visual Studio** and add `HapbeatSDK` to the dependencies in `Source/<Project>/<Project>.Build.cs`.

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "Core", "CoreUObject", "Engine", "HapbeatSDK"
});
```

Close the Editor and rebuild with the steps above. See [C++ API](./cpp-api.md) for includes and playback calls.
