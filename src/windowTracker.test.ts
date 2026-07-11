import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { createWindowTracker } from "./windowTracker.js";

let currentNow = 0;

const setScreenCoord = (x: number, y: number) => {
  Object.defineProperty(window, "screenX", { value: x, configurable: true });
  Object.defineProperty(window, "screenY", { value: y, configurable: true });
};

beforeEach(() => {
  currentNow = 0;

  vi.spyOn(performance, "now").mockImplementation(() => currentNow);

  setScreenCoord(0, 0);

  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockReturnValue({ matches: false }),
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createWindowTracker", () => {
  it("経過時間が0以下の場合はnullを返す", () => {
    const tracker = createWindowTracker();

    currentNow = 1000;
    setScreenCoord(10, 0);
    expect(tracker.update(currentNow, 999999)).not.toBeNull();

    // 時刻を進めずに再度呼び出す
    expect(tracker.update(currentNow, 999999)).toBeNull();
  });

  it("移動量と経過時間から速度・加速度を計算する (emaAlpha:1で平滑化なし)", () => {
    const tracker = createWindowTracker({ emaAlpha: 1 });

    currentNow = 1000; // 1秒後
    setScreenCoord(100, 0); // x方向に100px移動
    const state = tracker.update(currentNow, 999999);

    expect(state).not.toBeNull();
    expect(state?.coord).toEqual({ x: 100, y: 0 });
    expect(state?.velocity.x).toBeCloseTo(100); // 100px / 1s
    expect(state?.velocity.y).toBeCloseTo(0);
    expect(state?.velocity.speed).toBeCloseTo(100);
    // 初速0からの立ち上がりなので加速度は速度と同じ値になる
    expect(state?.acceleration.x).toBeCloseTo(100);
    expect(state?.acceleration.magnitude).toBeCloseTo(100);
  });

  it("速度が idleSpeedThreshold 未満なら方向は idle 扱いになる", () => {
    const tracker = createWindowTracker({
      emaAlpha: 1,
      idleSpeedThreshold: 40,
    });

    currentNow = 1000;
    setScreenCoord(10, 0); // 10px/s < 40 のしきい値
    const state = tracker.update(currentNow, 999999);

    expect(state?.direction.idle).toBe(true);
    expect(state?.direction.angleDeg).toBeCloseTo(0);
    expect(state?.direction.unitX).toBeCloseTo(0);
    expect(state?.direction.unitY).toBeCloseTo(0);
    // idleでも速度そのものの値はゼロ化されない
    expect(state?.velocity.x).toBeCloseTo(10);
  });

  it("移動方向に応じた角度・単位ベクトルを計算する", () => {
    const tracker = createWindowTracker({
      emaAlpha: 1,
      idleSpeedThreshold: 0,
    });

    currentNow = 1000;
    setScreenCoord(100, 0); // 右方向
    const state = tracker.update(currentNow, 999999);

    expect(state?.direction.idle).toBe(false);
    expect(state?.direction.angleDeg).toBeCloseTo(0);
    expect(state?.direction.unitX).toBeCloseTo(1);
    expect(state?.direction.unitY).toBeCloseTo(0);
  });

  it("加速度がしきい値を超え、クールダウン経過後に再びシェイクを検出する", () => {
    const tracker = createWindowTracker({
      emaAlpha: 1,
      shakeCooldownMs: 500,
    });
    const shakeAccelThreshold = 1000;

    // 1回目: 大きく加速 -> シェイク検出
    // ( lastShakeAt の初期値は0なので、cooldown 分は経過させておく)
    currentNow = 600;
    setScreenCoord(1000, 0);
    const first = tracker.update(currentNow, shakeAccelThreshold);
    expect(first?.didShake).toBe(true);
    expect(first?.shakeCount).toBe(1);

    // 2回目: クールダウン中(100ms後)に再び大きく加速 -> 検出されない
    currentNow = 700;
    setScreenCoord(5000, 0);
    const second = tracker.update(currentNow, shakeAccelThreshold);
    expect(second?.didShake).toBe(false);
    expect(second?.shakeCount).toBe(1);

    // 3回目: クールダウン経過後(600ms後)に大きく加速 -> 再び検出される
    currentNow = 1300;
    setScreenCoord(20000, 0);
    const third = tracker.update(currentNow, shakeAccelThreshold);
    expect(third?.didShake).toBe(true);
    expect(third?.shakeCount).toBe(2);
  });

  it("supportsWinertia が false の場合、update は常に null を返す", () => {
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockReturnValue({ matches: true }), // タッチデバイス扱い
      configurable: true,
    });
    const tracker = createWindowTracker();

    expect(tracker.supportsWinertia).toBe(false);

    currentNow = 1000;
    setScreenCoord(100, 0);
    expect(tracker.update(currentNow, 999999)).toBeNull();
  });
});
