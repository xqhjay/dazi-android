import { describe, it, expect } from "vitest";
import {
  calcWpm,
  calcAccuracy,
  levelSpeedMult,
  levelName,
  formatDuration,
  formatNumber,
} from "@/lib/wpm";

describe("wpm utils", () => {
  it("calcWpm", () => {
    expect(calcWpm(0, 60)).toBe(0);
    expect(calcWpm(60, 60)).toBe(60);
    expect(calcWpm(30, 30)).toBe(60);
    expect(calcWpm(100, 0)).toBe(0);
  });

  it("calcAccuracy", () => {
    expect(calcAccuracy(0, 0)).toBe(0);
    expect(calcAccuracy(90, 10)).toBeCloseTo(0.9);
    expect(calcAccuracy(1, 1)).toBeCloseTo(0.5);
  });

  it("levelSpeedMult", () => {
    expect(levelSpeedMult(1)).toBe(0.5);
    expect(levelSpeedMult(4)).toBe(2);
    expect(levelSpeedMult(8)).toBe(4);
    expect(levelSpeedMult(100)).toBe(4);
  });

  it("levelName", () => {
    expect(levelName(1)).toBe("入门");
    expect(levelName(8)).toBe("大师");
    expect(levelName(99)).toBe("大师");
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(3600)).toBe("60:00");
  });

  it("formatNumber", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(10000)).toBe("1.0万");
    expect(formatNumber(15000)).toBe("1.5万");
  });
});
