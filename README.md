# winertia

[English](./README.md) | [日本語](./README.ja.md)

Measures the position, velocity, acceleration, and direction in real time when you physically drag a browser window.

## Installation

```bash
npm install @273do/winertia
```

## Usage

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

Creates a tracker instance. The `options` argument is optional, and so is each of its properties. Returns a `WindowTrackerObj` with the following properties:

| Property           | Type       | Description                                                                                                                                                |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supportsWinertia` | `boolean`  | Whether the current environment supports winertia — requires a non-SSR context, `screenX`/`screenY` availability, and a non-touch (coarse pointer) device. |
| `update`           | `Function` | Advances the tracker by one frame. See below.                                                                                                              |

| Option               | Type     | Default | Description                                                                               |
| -------------------- | -------- | ------- | ----------------------------------------------------------------------------------------- |
| `emaAlpha`           | `number` | `0.25`  | Smoothing factor (0-1) for the exponential moving average used for velocity/acceleration. |
| `historyLength`      | `number` | `50`    | Maximum number of acceleration samples kept in `history`.                                 |
| `idleSpeedThreshold` | `number` | `40`    | Speed (px/s) below which direction is considered idle.                                    |
| `shakeCooldownMs`    | `number` | `300`   | Cooldown (ms) between shake detections.                                                   |

### `update`

```ts
update(now: number, shakeAccelThreshold: number): MotionStateObj | null
```

Advances the tracker by one frame and returns the current state. Call this every frame (e.g. inside `requestAnimationFrame`).

| Parameter             | Type     | Description                                                                                             |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `now`                 | `number` | Current timestamp, typically `performance.now()`. Used to compute elapsed time since the previous call. |
| `shakeAccelThreshold` | `number` | Acceleration magnitude (px/s²) above which a shake is detected.                                         |

Returns `null` if `supportsWinertia` is `false`, or if the elapsed time since the previous call is zero or negative (e.g. `update` called twice with the same timestamp). Otherwise returns a `MotionStateObj`:

| Field           | Type                               | Description                                                                    |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `coord`         | `{ x, y }`                         | Current window position.                                                       |
| `velocity`      | `{ x, y, speed }`                  | Smoothed velocity (px/s) and its magnitude.                                    |
| `acceleration`  | `{ x, y, magnitude }`              | Smoothed acceleration (px/s²) and its magnitude.                               |
| `direction`     | `{ idle, angleDeg, unitX, unitY }` | Movement direction. `idle` is `true` when speed is below `idleSpeedThreshold`. |
| `shakeCount`    | `number`                           | Total number of shakes detected so far.                                        |
| `didShake`      | `boolean`                          | Whether a shake was detected on this call.                                     |
| `history`       | `{ x, y, magnitude }[]`            | Recent acceleration samples, up to `historyLength`.                            |
| `historyLength` | `number`                           | The configured history size limit.                                             |

## Disclaimer

I, those associated with me, and any organization or group I belong to accept no responsibility whatsoever for any faults, damages, or defects arising from the use of this work and its accompanying materials. Use it at your own risk.
