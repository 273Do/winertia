# winertia

[English](./README.md) | [日本語](./README.ja.md)

ブラウザウィンドウを物理的にドラッグしたときの位置・速度・加速度・方向をリアルタイムに計測します。

## インストール

```bash
npm install @273do/winertia
```

## 使い方

```ts
import { createWindowTracker } from "@273do/winertia";

const tracker = createWindowTracker();

const loop = () => {
  const state = tracker.update(performance.now(), 4000);

  if (state) {
    const {
      coord,
      velocity,
      acceleration,
      direction,
      shakeCount,
      didShake,
      history,
      historyLength,
    } = state;

    console.log(coord);
    console.log(velocity);
    console.log(acceleration);
    console.log(direction);
    console.log(shakeCount, didShake);
    console.log(history, historyLength);
  }

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
```

### `createWindowTracker`

```ts
createWindowTracker(options?: WindowTrackerOptions): WindowTrackerObj
```

トラッカーのインスタンスを生成します。引数は省略可能で、各プロパティも省略可能です。戻り値は `update` メソッドを1つ持つオブジェクト(以下の `WindowTrackerObj` )です。

| オプション           | 型       | デフォルト | 詳細                                                  |
| -------------------- | -------- | ---------- | ----------------------------------------------------- |
| `emaAlpha`           | `number` | `0.25`     | 速度・加速度の平滑化に使う指数移動平均の係数 (0〜1)。 |
| `historyLength`      | `number` | `50`       | `history`に保持する加速度サンプルの最大件数。         |
| `idleSpeedThreshold` | `number` | `40`       | これを下回るとアイドル状態とみなす速度 (px/s)。       |
| `shakeCooldownMs`    | `number` | `300`      | シェイク検出のクールダウン時間 (ms)。                 |

### `update`

```ts
update(now: number, shakeAccelThreshold: number): MotionStateObj | null
```

現在のタイムスタンプとシェイク検出の閾値を指定してトラッカーを1フレーム進め、現在の状態を返します。`requestAnimationFrame` の中などで毎フレーム呼び出してください。

| 引数                  | 型       | 詳細                                                                                      |
| --------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `now`                 | `number` | 現在のタイムスタンプ。通常は`performance.now()`。前回呼び出しからの経過時間の計算に使う。 |
| `shakeAccelThreshold` | `number` | シェイクと判定する加速度の大きさ (px/s²)。                                                |

前回の呼び出しからの経過時間が0以下の場合(同じタイムスタンプで`update`が2回呼ばれた場合など)は`null`を返します。それ以外は`MotionStateObj`を返します。

| フィールド      | 型                                 | 説明                                                                 |
| --------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `coord`         | `{ x, y }`                         | 現在のウィンドウ位置。                                               |
| `velocity`      | `{ x, y, speed }`                  | 平滑化された速度 (px/s) とその大きさ。                               |
| `acceleration`  | `{ x, y, magnitude }`              | 平滑化された加速度 (px/s²) とその大きさ。                            |
| `direction`     | `{ idle, angleDeg, unitX, unitY }` | 移動方向。速度が`idleSpeedThreshold`未満の場合`idle`が`true`になる。 |
| `shakeCount`    | `number`                           | これまでに検出されたシェイクの累計回数。                             |
| `didShake`      | `boolean`                          | 今回の呼び出しでシェイクを検出したかどうか。                         |
| `history`       | `{ x, y, magnitude }[]`            | 直近の加速度サンプル履歴。                                           |
| `historyLength` | `number`                           | 加速度サンプル履歴の保持上限件数。                                   |
