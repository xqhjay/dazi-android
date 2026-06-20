// 下落式游戏引擎：纯逻辑，可测试
export interface FallingChar {
  id: number;
  char: string;
  x: number; // 0-1 比例
  y: number; // 0-1 比例（0 顶部，1 底部）
  speed: number; // 每秒下落比例
}

export interface GameState {
  chars: FallingChar[];
  hp: number;
  maxHp: number;
  score: number;
  charsCorrect: number;
  charsWrong: number;
  level: number;
  nextId: number;
}

export function createInitialState(maxHp = 100, level = 1): GameState {
  return {
    chars: [],
    hp: maxHp,
    maxHp,
    score: 0,
    charsCorrect: 0,
    charsWrong: 0,
    level,
    nextId: 1,
  };
}

// 根据等级生成下落速度（每秒下落比例）
// 基础 0.08/秒，乘以速度倍率
export function speedForLevel(level: number): number {
  const mult = level >= 8 ? 4.0 : level * 0.5;
  return 0.08 * mult;
}

// 无尽模式：每 15 秒 +0.1 倍
export function endlessSpeedMult(elapsedSec: number): number {
  return 0.5 + Math.floor(elapsedSec / 15) * 0.1;
}

export function endlessLevelFromTime(elapsedSec: number): number {
  const mult = endlessSpeedMult(elapsedSec);
  return Math.max(1, Math.round(mult / 0.5));
}

// 生成新字符
export function spawnChar(
  state: GameState,
  char: string,
  speed: number,
  rng: number = Math.random()
): GameState {
  const newChar: FallingChar = {
    id: state.nextId,
    char,
    x: 0.1 + rng * 0.8,
    y: 0,
    speed,
  };
  return {
    ...state,
    chars: [...state.chars, newChar],
    nextId: state.nextId + 1,
  };
}

// 推进一帧
export function tick(state: GameState, dt: number): GameState {
  const moved = state.chars.map((c) => ({
    ...c,
    y: c.y + c.speed * dt,
  }));
  // 超出底部的字扣血并移除
  let hp = state.hp;
  const remaining: FallingChar[] = [];
  for (const c of moved) {
    if (c.y >= 1) {
      hp -= 10;
    } else {
      remaining.push(c);
    }
  }
  return {
    ...state,
    chars: remaining,
    hp: Math.max(0, hp),
  };
}

// 输入字符：消除匹配的字
export function inputChar(state: GameState, input: string): {
  state: GameState;
  hit: boolean;
} {
  // 找最低的匹配字（最先消除）
  let target: FallingChar | null = null;
  for (const c of state.chars) {
    if (c.char === input) {
      if (!target || c.y > target.y) target = c;
    }
  }
  if (!target) {
    return {
      state: { ...state, charsWrong: state.charsWrong + 1 },
      hit: false,
    };
  }
  return {
    state: {
      ...state,
      chars: state.chars.filter((c) => c.id !== target!.id),
      score: state.score + 10,
      charsCorrect: state.charsCorrect + 1,
    },
    hit: true,
  };
}

// 错字强化池（前端版，与 Rust mastery 对齐）
export class ReinforcePool {
  private entries: Map<string, { addedAt: number; consecutive: number }> = new Map();

  add(char: string, now: number) {
    this.entries.set(char, { addedAt: now, consecutive: 0 });
  }

  recordCorrect(char: string) {
    const e = this.entries.get(char);
    if (e) {
      e.consecutive++;
      if (e.consecutive >= 2) this.entries.delete(char);
    }
  }

  recordWrong(char: string, now: number) {
    this.entries.set(char, { addedAt: now, consecutive: 0 });
  }

  shouldReinforce(now: number, rng: number): string | null {
    const eligible = Array.from(this.entries.entries())
      .filter(([, e]) => now - e.addedAt >= 10)
      .sort((a, b) => a[1].addedAt - b[1].addedAt);
    if (eligible.length === 0) return null;
    if (rng < 0.7) return eligible[0][0];
    return null;
  }

  get size() {
    return this.entries.size;
  }
}
