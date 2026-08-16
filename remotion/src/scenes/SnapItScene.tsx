import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { slideUp, scaleIn } from "../lib/animations";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const SnapItScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.11 : Math.min(width, height) * 0.09;

  const titleAnim = slideUp(frame, 30, 0, 60);

  const photoScale = scaleIn(frame, 30, 15);
  const lineArtScale = scaleIn(frame, 30, 65);

  const flash = interpolate(frame, [50, 55, 60], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imageSize = Math.min(width, height) * (isVertical ? 0.42 : 0.45);
  const gap = isVertical ? 24 : 40;
  const totalWidth = imageSize * 2 + gap;
  const startX = (width - totalWidth) / 2;
  const imageY = isVertical ? height * 0.3 : height * 0.25;

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
        Or snap it.
      </div>

      <div
        style={{
          position: "absolute",
          left: startX,
          top: imageY,
          width: imageSize,
          height: imageSize,
          borderRadius: 20,
          background: palette.white,
          border: `4px solid ${palette.charcoal}`,
          boxShadow: `8px 8px 0 ${palette.accent}`,
          overflow: "hidden",
          opacity: photoScale.opacity,
          transform: `scale(${photoScale.scale}) rotate(-3deg)`,
        }}
      >
        <Img
          src={staticFile("images/toy-photo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: palette.white,
            opacity: flash,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: startX + imageSize + gap,
          top: imageY,
          width: imageSize,
          height: imageSize,
          borderRadius: 20,
          background: palette.white,
          border: `4px solid ${palette.charcoal}`,
          boxShadow: `8px 8px 0 ${palette.primary}`,
          overflow: "hidden",
          opacity: lineArtScale.opacity,
          transform: `scale(${lineArtScale.scale}) rotate(3deg)`,
        }}
      >
        <Img
          src={staticFile("images/toy-lineart.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      <svg
        style={{
          position: "absolute",
          left: startX + imageSize + gap / 2 - 30,
          top: imageY + imageSize / 2 - 30,
          width: 60,
          height: 60,
          opacity: interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(frame, [55, 75], [0.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke={palette.charcoal}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </AbsoluteFill>
  );
};
