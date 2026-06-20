import { describe, it, expect } from "vitest";
import {
  createInitialState,
  tick,
  inputChar,
  spawnChar,
  speedForLevel,
  endlessLevelFromTime,
  endlessSpeedMult,
  ReinforcePool,
} from "@/lib/fallingEngine";

describe("fallingEngine", () => {
  it("createInitialState", () => {
    const s = createInitialState(100, 1);
    expect(s.hp).toBe(100);
    expect(s.maxHp).toBe(100);
    expect(s.chars).toEqual([]);
    expect(s.level).toBe(1);
  });

  it("speedForLevel", () => {
    expect(speedForLevel(1)).toBe(0.04); // 0.08 * 0.5
    expect(speedForLevel(2)).toBe(0.08); // 0.08 * 1.0
    expect(speedForLevel(4)).toBe(0.16); // 0.08 * 2.0
    expect(speedForLevel(8)).toBe(0.32); // 0.08 * 4.0
    expect(speedForLevel(100)).toBe(0.32);
  });

  it("endlessSpeedMult", () => {
    expect(endlessSpeedMult(0)).toBe(0.5);
    expect(endlessSpeedMult(15)).toBe(0.6);
    expect(endlessSpeedMult(30)).toBe(0.7);
  });

  it("endlessLevelFromTime", () => {
    expect(endlessLevelFromTime(0)).toBe(1);
    expect(endlessLevelFromTime(150)).toBeGreaterThanOrEqual(3);
  });

  it("spawnChar adds char", () => {
    const s = createInitialState();
    const s2 = spawnChar(s, "的", 0.1, 0.5);
    expect(s2.chars).toHaveLength(1);
    expect(s2.chars[0].char).toBe("的");
    expect(s2.nextId).toBe(2);
  });

  it("tick moves chars down and removes off-screen", () => {
    let s = createInitialState();
    s = spawnChar(s, "的", 1.0, 0); // 速度 1.0/秒
    s = tick(s, 0.5);
    expect(s.chars[0].y).toBeCloseTo(0.5);
    s = tick(s, 0.6); // y = 1.1，超出
    expect(s.chars).toHaveLength(0);
    expect(s.hp).toBe(90); // 扣 10 血
  });

  it("inputChar hits lowest matching char", () => {
    let s = createInitialState();
    s = spawnChar(s, "的", 0.1, 0);
    s = tick(s, 0.3, );
    // 手动设置 y
    s = { ...s, chars: [{ ...s.chars[0], y: 0.3 }] };
    s = spawnChar(s, "的", 0.1, 0);
    s = { ...s, chars: [{ ...s.chars[0], y: 0.3 }, { ...s.chars[1], y: 0.6 }] };
    const { state: s2, hit } = inputChar(s, "的");
    expect(hit).toBe(true);
    expect(s2.chars).toHaveLength(1);
    expect(s2.chars[0].y).toBe(0.3); // 消除较高的（y=0.6）
    expect(s2.score).toBe(10);
    expect(s2.charsCorrect).toBe(1);
  });

  it("inputChar miss increments wrong", () => {
    let s = createInitialState();
    s = spawnChar(s, "的", 0.1, 0);
    const { state: s2, hit } = inputChar(s, "了");
    expect(hit).toBe(false);
    expect(s2.charsWrong).toBe(1);
    expect(s2.chars).toHaveLength(1);
  });
});

describe("ReinforcePool", () => {
  it("add and remove on 2 consecutive correct", () => {
    const p = new ReinforcePool();
    p.add("的", 0);
    expect(p.size).toBe(1);
    p.recordCorrect("的");
    expect(p.size).toBe(1);
    p.recordCorrect("的");
    expect(p.size).toBe(0);
  });

  it("wrong resets consecutive", () => {
    const p = new ReinforcePool();
    p.add("了", 0);
    p.recordCorrect("了");
    p.recordWrong("了", 5);
    expect(p.size).toBe(1);
    p.recordCorrect("了");
    expect(p.size).toBe(1);
    p.recordCorrect("了");
    expect(p.size).toBe(0);
  });

  it("shouldReinforce respects 10s delay and 70% prob", () => {
    const p = new ReinforcePool();
    p.add("我", 0);
    expect(p.shouldReinforce(5, 0.5)).toBeNull();
    expect(p.shouldReinforce(10, 0.5)).toBe("我");
    expect(p.shouldReinforce(10, 0.8)).toBeNull();
  });
});
