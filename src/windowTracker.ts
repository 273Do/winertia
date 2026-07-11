import type {
  AccelerationObj,
  CoordObj,
  MotionStateObj,
  WindowTrackerObj,
  WindowTrackerOptions,
} from "./types.js";

/** 指数移動平均で prev を target に近づける */
const ema = (prev: number, target: number, alpha: number): number => prev + (target - prev) * alpha;

export const createWindowTracker = ({
  emaAlpha = 0.25,
  historyLength = 50,
  idleSpeedThreshold = 40,
  shakeCooldownMs = 300,
}: WindowTrackerOptions = {}): WindowTrackerObj => {
  let lastTime: number = performance.now();
  const lastCoord: CoordObj = { x: window.screenX, y: window.screenY };

  const prevSmoothVelocity: CoordObj = { x: 0, y: 0 };
  const smoothVelocity: CoordObj = { x: 0, y: 0 };
  const smoothAccel: CoordObj = { x: 0, y: 0 };

  let shakeCount: number = 0;
  let lastShakeAt: number = 0;

  const history: AccelerationObj[] = [];

  const supportsWinertia: boolean =
    typeof window !== "undefined" &&
    "screenX" in window &&
    "screenY" in window &&
    !window.matchMedia("(pointer: coarse)").matches;

  const update = (now: number, shakeAccelThreshold: number): MotionStateObj | null => {
    if (!supportsWinertia) return null;

    // 前フレームからの経過時間(秒)。0以下なら同一/逆行タイムスタンプなのでスキップ
    const dt = (now - lastTime) / 1000;
    if (dt <= 0) return null;

    const x: number = window.screenX;
    const y: number = window.screenY;

    // 前フレームからの移動量(px)
    const dx: number = x - lastCoord.x;
    const dy: number = y - lastCoord.y;

    // 瞬間速度(px/s) = 移動量/経過時間 をEMAで平滑化し、フレーム間のノイズを抑える
    smoothVelocity.x = ema(smoothVelocity.x, dx / dt, emaAlpha);
    smoothVelocity.y = ema(smoothVelocity.y, dy / dt, emaAlpha);

    // 平滑化速度の変化率(=瞬間加速度)を求め、さらにEMAで平滑化する
    smoothAccel.x = ema(smoothAccel.x, (smoothVelocity.x - prevSmoothVelocity.x) / dt, emaAlpha);
    smoothAccel.y = ema(smoothAccel.y, (smoothVelocity.y - prevSmoothVelocity.y) / dt, emaAlpha);

    // 加速度・速度それぞれのベクトルの大きさ
    const accelMagnitude = Math.hypot(smoothAccel.x, smoothAccel.y);
    const speed = Math.hypot(smoothVelocity.x, smoothVelocity.y);

    // 速度がしきい値未満ならほぼ静止しているとみなす
    const idle = speed < idleSpeedThreshold;

    // 移動方向の角度。screenYは下方向が正なので符号を反転して数学的な座標系に合わせる
    const angleDeg = idle ? 0 : (Math.atan2(-smoothVelocity.y, smoothVelocity.x) * 180) / Math.PI;

    // 単位ベクトル算出用に速度の逆数を先に1回だけ計算し、割り算を減らす
    const invSpeed = idle ? 0 : 1 / speed;

    // 直近historyLength件分の加速度サンプルだけ保持する（古いものから捨てる）
    history.push({
      x: smoothAccel.x,
      y: smoothAccel.y,
      magnitude: accelMagnitude,
    });
    if (history.length > historyLength) history.shift();

    // 加速度が閾値を超え、かつ前回検出からクールダウン時間が経過していればシェイクとみなす
    let didShake = false;
    if (accelMagnitude > shakeAccelThreshold && now - lastShakeAt > shakeCooldownMs) {
      lastShakeAt = now;
      shakeCount += 1;
      didShake = true;
    }

    // 次フレームの差分計算のために今回の値を保存
    lastCoord.x = x;
    lastCoord.y = y;
    lastTime = now;
    prevSmoothVelocity.x = smoothVelocity.x;
    prevSmoothVelocity.y = smoothVelocity.y;

    const result: MotionStateObj = {
      coord: { x, y },
      velocity: { x: smoothVelocity.x, y: smoothVelocity.y, speed },
      acceleration: {
        x: smoothAccel.x,
        y: smoothAccel.y,
        magnitude: accelMagnitude,
      },
      direction: {
        idle,
        angleDeg,
        unitX: smoothVelocity.x * invSpeed,
        unitY: -smoothVelocity.y * invSpeed,
      },
      shakeCount,
      didShake,
      history: [...history],
      historyLength,
    };

    return result;
  };

  return { supportsWinertia, update };
};
