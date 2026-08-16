import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { palette } from "../lib/colors";

const Pencil = ({
  x,
  y,
  rotation,
  color,
  size,
  delay,
}: {
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const drift = interpolate(
    frame,
    [0, durationInFrames],
    [0, 360],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const bob = Math.sin((frame + delay) * 0.03) * 12;
  const sway = Math.cos((frame + delay) * 0.025) * 6;

  return (
    <div
      style={{
        position: "absolute",
        left: x + sway,
        top: y + bob,
        width: size,
        height: size * 4,
        transform: `rotate(${rotation + Math.sin((frame + delay) * 0.02) * 4}deg)`,
        opacity: 0.18,
        borderRadius: size / 2,
        background: `linear-gradient(180deg, ${color} 70%, ${palette.charcoal} 70%)`,
        boxShadow: `0 4px 12px rgba(45,42,38,0.08)`,
      }}
    />
  );
};

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const gradientShift = interpolate(
    frame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + gradientShift * 20}deg, ${palette.paper} 0%, ${palette.paperDark} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${palette.softGray} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          opacity: 0.08,
        }}
      />
      <Pencil x={60} y={120} rotation={-25} color={palette.primary} size={18} delay={0} />
      <Pencil x={90} y={300} rotation={15} color={palette.accent} size={16} delay={40} />
      <Pencil x={-20} y={500} rotation={-40} color={palette.green} size={20} delay={80} />
      <Pencil x={80} y={720} rotation={30} color={palette.blue} size={15} delay={120} />
      <Pencil x={40} y={900} rotation={-10} color={palette.purple} size={17} delay={160} />
    </AbsoluteFill>
  );
};
