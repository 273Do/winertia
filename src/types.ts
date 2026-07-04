/* オプション */
export type WindowTrackerOptions = {
  /** 速度・加速度の平滑化に使う指数移動平均の係数 (0〜1) */
  emaAlpha?: number;
  /** 保持する加速度履歴の最大件数 */
  historyLength?: number;
  /** この速度(px/s)を下回ったらアイドル状態とみなす */
  idleSpeedThreshold?: number;
  /** シェイク検出のクールダウン時間(ms) */
  shakeCooldownMs?: number;
};

export type WindowTrackerObj = {
  /** トラッカーを1フレーム進めて新しい状態を返す。dtが0以下の場合はnull */
  update: (now: number, shakeAccelThreshold: number) => MotionStateObj | null;
};

/** 位置 */
export type CoordObj = {
  /** x 座標 */
  x: number;
  /** y 座標 */
  y: number;
};

/** 速度 */
export type VelocityObj = {
  /** 速度の大きさ */
  speed: number;
} & CoordObj;

/** 加速度 */
export type AccelerationObj = {
  /** 加速度の大きさ */
  magnitude: number;
} & CoordObj;

/** 方向 */
export type DirectionObj = {
  /** アイドル状態かどうか */
  idle: boolean;
  /** 角度(度) */
  angleDeg: number;
  /** X 成分の単位ベクトル (-1 <= unitX <= 1) */
  unitX: number;
  /** Y 成分の単位ベクトル (-1 <= unitY <= 1) */
  unitY: number;
};

/** モーションの状態 */
export type MotionStateObj = {
  /** 位置 */
  coord: CoordObj;
  /** 速度 */
  velocity: VelocityObj;
  /** 加速度 */
  acceleration: AccelerationObj;
  /** 方向 */
  direction: DirectionObj;
  /** シェイク検出の回数 */
  shakeCount: number;
  /** シェイク検出が発生したかどうか */
  didShake: boolean;
  /** 加速度の履歴 */
  history: readonly AccelerationObj[];
  /** 加速度の履歴の上限 */
  historyLength: number;
};
