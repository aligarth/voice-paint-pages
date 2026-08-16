import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { slideUp } from "../lib/animations";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const DrawItScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.11 : Math.min(width, height) * 0.09;

  const titleAnim = slideUp(frame, 30, 0, 60);

  const drawProgress = interpolate(frame, [20, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imageSize = Math.min(width, height) * (isVertical ? 0.72 : 0.55);
  const imageX = width / 2 - imageSize / 2;
  const imageY = isVertical ? height * 0.28 : height * 0.22;

  const clipReveal = interpolate(frame, [40, 120], [0, imageSize], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const penX = imageX + clipReveal;
  const penY = imageY + imageSize * 0.5 + Math.sin(frame * 0.15) * 8;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          fontFamily: displayFont,
          fontSize: titleSize,
          fontWeight: 600,
          color: palette.charcoal,
          textAlign: "center",
          opacity: titleAnim.opacity,
          transform: `translateY(${titleAnim.y}px)`,
          position: "absolute",
          top: isVertical ? height * 0.08 : height * 0.08,
        }}
      >
        We draw it.
      </div>

      <div
        style={{
          position: "absolute",
          left: imageX,
          top: imageY,
          width: imageSize,
          height: imageSize,
          borderRadius: 24,
          background: palette.white,
          border: `4px solid ${palette.charcoal}`,
          boxShadow: `12px 12px 0 rgba(45,42,38,0.12)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.15 + drawProgress * 0.85,
            transform: `scale(${0.98 + drawProgress * 0.02})`,
          }}
        >
          <Img
            src={staticFile("images/dragon-lineart.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: clipReveal,
            height: "100%",
            background: palette.white,
            mixBlendMode: "destination-out",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: penX,
          top: penY,
          width: 28,
          height: 90,
          borderRadius: 14,
          background: `linear-gradient(180deg, ${palette.accent} 70%, ${palette.charcoal} 70%)`,
          transform: `rotate(-35deg)`,
          boxShadow: `0 6px 16px rgba(45,42,38,0.2)`,
          opacity: interpolate(frame, [30, 45, 115, 125], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
