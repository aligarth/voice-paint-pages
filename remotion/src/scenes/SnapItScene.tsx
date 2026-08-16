import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { slideUp, scaleIn } from "../lib/animations";
import { FootageLayer, footageTextShadow } from "../components/FootageLayer";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const SnapItScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.11 : Math.min(width, height) * 0.09;

  const titleAnim = slideUp(frame, 30, 0, 60);

  const photoScale = scaleIn(frame, 30, 15);
  const lineArtScale = scaleIn(frame, 30, 65);

  const flash = interpolate(frame, [50, 55, 62], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imageSize = Math.min(width, height) * (isVertical ? 0.36 : 0.34);
  const gap = isVertical ? 24 : 40;
  const totalWidth = imageSize * 2 + gap;
  const startX = (width - totalWidth) / 2;
  const imageY = isVertical ? height * 0.58 : height * 0.55;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FootageLayer src="snap-it.mp4" dim={0.18} zoom={0.06} />

      {/* camera shutter flash across the whole frame */}
      <AbsoluteFill style={{ background: palette.white, opacity: flash * 0.75 }} />

      <div
        style={{
          fontFamily: displayFont,
          fontSize: titleSize,
          fontWeight: 600,
          color: palette.white,
          textShadow: footageTextShadow,
          textAlign: "center",
          opacity: titleAnim.opacity,
          transform: `translateY(${titleAnim.y}px)`,
          position: "absolute",
          top: isVertical ? height * 0.08 : height * 0.07,
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
          boxShadow: `0 20px 50px rgba(45,42,38,0.45)`,
          overflow: "hidden",
          opacity: photoScale.opacity,
          transform: `scale(${photoScale.scale}) rotate(-3deg)`,
        }}
      >
        <Img
          src={staticFile("images/toy-photo.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
          boxShadow: `0 20px 50px rgba(45,42,38,0.45)`,
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
          filter: "drop-shadow(0 2px 6px rgba(45,42,38,0.6))",
        }}
        viewBox="0 0 24 24"
        fill="none"
        stroke={palette.white}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </AbsoluteFill>
  );
};
