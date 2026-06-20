#!/usr/bin/env bash
# 限制 Android 构建仅 arm64-v8a ABI
# 在 `tauri android init` 之后运行
set -euo pipefail

GRADLE_FILE="src-tauri/gen/android/app/build.gradle.kts"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "Error: $GRADLE_FILE not found. Run 'tauri android init' first." >&2
  exit 1
fi

# 在 android { } 块内注入 abiFilters
# 使用 ndk { abiFilters += "arm64-v8a" }
if ! grep -q "abiFilters" "$GRADLE_FILE"; then
  # 在 android { 之后插入 ndk 块
  sed -i '/^android {/a\    ndk {\n        abiFilters += "arm64-v8a"\n    }' "$GRADLE_FILE"
  echo "Injected abiFilters += \"arm64-v8a\" into $GRADLE_FILE"
else
  echo "abiFilters already present in $GRADLE_FILE"
fi

echo "--- $GRADLE_FILE (android block) ---"
sed -n '/^android {/,/^}/p' "$GRADLE_FILE" | head -20
