import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { slideUp, scaleIn } from "../lib/animations";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const ColorItScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.11 : Math.min(width, height) * 0.09;

  const titleAnim = slideUp(frame, 30, 0, 60);

  const colorProgress = interpolate(frame, [25, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imageSize = Math.min(width, height) * (isVertical ? 0.72 : 0.55);
  const imageX = width / 2 - imageSize / 2;
  const imageY = isVertical ? height * 0.28 : height * 0.22;

  const swatchScale = scaleIn(frame, 30, 60);

  const colors = [palette.primary, palette.accent, palette.green, palette.blue, palette.purple, "#FF6B9D", "#40E0D0"];

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
        You color it.
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
            position: "absolute",
            inset: 0,
            opacity: colorProgress,
            clipPath: `circle(${colorProgress * 150}% at 50% 50%)`,
          }}
        >
          <Img
            src={staticFile("images/dragon-colored.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - colorProgress * 0.8,
          }}
        >
          <Img
            src={staticFile("images/dragon-lineart.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: isVertical ? height * 0.1 : height * 0.08,
          display: "flex",
          gap: 14,
          opacity: swatchScale.opacity,
          transform: `scale(${swatchScale.scale})`,
        }}
      >
        {colors.map((color, i) => (
          <div
            key={i}
            style={{
              width: isVertical ? width * 0.09 : height * 0.07,
              height: isVertical ? width * 0.09 : height * 0.07,
              borderRadius: "50%",
              background: color,
              border: `3px solid ${palette.white}`,
              boxShadow: `0 4px 12px rgba(45,42,38,0.15)`,
              transform: `translateY(${Math.sin((frame + i * 20) * 0.1) * 4}px)`,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
