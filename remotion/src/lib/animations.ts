import { interpolate, spring, SpringConfig } from "remotion";

export const enterSpring = (
  frame: number,
  fps: number,
  delay = 0,
  config: SpringConfig = { damping: 12, stiffness: 200, mass: 0.8 }
): number => {
  return spring({ frame: frame - delay, fps, config });
};

export const fadeIn = (
  frame: number,
  start: number,
  duration: number,
  delay = 0
): number => {
  return interpolate(frame - delay, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const slideUp = (
  frame: number,
  fps: number,
  delay = 0,
  distance = 80
): { opacity: number; y: number } => {
  const progress = Math.min(1, enterSpring(frame, fps, delay, { damping: 15, stiffness: 180 }));
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, y };
};

export const scaleIn = (
  frame: number,
  fps: number,
  delay = 0
): { opacity: number; scale: number } => {
  const progress = Math.min(1, enterSpring(frame, fps, delay, { damping: 12, stiffness: 220 }));
  const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, scale };
};
