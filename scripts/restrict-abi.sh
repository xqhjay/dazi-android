#!/usr/bin/env bash
# 限制 Android 构建仅 arm64-v8a ABI
# 在 `tauri android init` 之后运行
set -euo pipefail

GRADLE_FILE="src-tauri/gen/android/app/build.gradle.kts"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "Error: $GRADLE_FILE not found. Run 'tauri android init' first." >&2
  exit 1
fi

# 在 defaultConfig { } 块内注入 ndk { abiFilters }
# 查找 defaultConfig { 行，在其后插入 ndk 块
if ! grep -q "abiFilters" "$GRADLE_FILE"; then
  # 使用 python 精确插入到 defaultConfig { 之后
  python3 - "$GRADLE_FILE" <<'PYEOF'
import sys, re
path = sys.argv[1]
with open(path) as f:
    content = f.read()
# 在 defaultConfig { 后插入 ndk 块
inject = """    ndk {
        abiFilters += "arm64-v8a"
    }
"""
# 匹配 defaultConfig { 可能有空格
new = re.sub(
    r'(defaultConfig\s*\{)',
    r'\1\n' + inject,
    content,
    count=1,
)
if new == content:
    # 如果没有 defaultConfig，尝试在 android { 后插入
    new = re.sub(
        r'(android\s*\{)',
        r'\1\n    defaultConfig {\n' + inject + '    }',
        content,
        count=1,
    )
with open(path, 'w') as f:
    f.write(new)
print("Injected abiFilters += \"arm64-v8a\" into defaultConfig")
PYEOF
else
  echo "abiFilters already present in $GRADLE_FILE"
fi

echo "--- $GRADLE_FILE (relevant block) ---"
grep -n -A 2 -B 1 "abiFilters\|defaultConfig\|ndk" "$GRADLE_FILE" | head -20
