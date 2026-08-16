import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { palette } from "../lib/colors";
import { scaleIn, slideUp } from "../lib/animations";
import { FootageLayer, footageTextShadow } from "../components/FootageLayer";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
const { fontFamily: bodyFont } = loadNunito("normal", { weights: ["700"], subsets: ["latin"] });

export const EndCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.12 : Math.min(width, height) * 0.1;
  const sloganSize = isVertical ? width * 0.055 : Math.min(width, height) * 0.045;

  const logoAnim = scaleIn(frame, 30, 0);
  const sloganAnim = slideUp(frame, 30, 25, 50);
  const ctaAnim = slideUp(frame, 30, 45, 50);

  const orbit = interpolate(frame, [0, 120], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pencilColors = [palette.primary, palette.accent, palette.green, palette.blue, palette.purple];
  const centerX = width / 2;
  const centerY = height / 2 - (isVertical ? height * 0.05 : 0);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FootageLayer src="together.mp4" dim={0.36} zoom={0.12} startFrom={0.4} />

      {pencilColors.map((color, i) => {
        const angle = orbit + i * (360 / pencilColors.length);
        const radius = Math.min(width, height) * 0.18;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: centerX + x - 8,
              top: centerY + y - 28,
              width: 16,
              height: 56,
              borderRadius: 8,
              background: `linear-gradient(180deg, ${color} 70%, ${palette.charcoal} 70%)`,
              transform: `rotate(${angle + 90}deg)`,
              opacity: 0.85,
            }}
          />
        );
      })}

      <div
        style={{
          fontFamily: displayFont,
          fontSize: titleSize,
          fontWeight: 600,
          color: palette.accent,
          textShadow: footageTextShadow,
          textAlign: "center",
          opacity: logoAnim.opacity,
          transform: `scale(${logoAnim.scale})`,
          lineHeight: 1.1,
        }}
      >
        Color My World
      </div>

      <div
        style={{
          fontFamily: bodyFont,
          fontSize: sloganSize,
          fontWeight: 700,
          color: palette.white,
          textShadow: footageTextShadow,
          textAlign: "center",
          marginTop: 16,
          opacity: sloganAnim.opacity,
          transform: `translateY(${sloganAnim.y}px)`,
          maxWidth: width * 0.85,
        }}
      >
        Say it or snap it. We draw it. You color it.
      </div>

      <div
        style={{
          marginTop: 32,
          padding: "14px 36px",
          borderRadius: 40,
          background: palette.charcoal,
          color: palette.white,
          fontFamily: bodyFont,
          fontSize: isVertical ? width * 0.04 : height * 0.035,
          fontWeight: 700,
          opacity: ctaAnim.opacity,
          transform: `translateY(${ctaAnim.y}px)`,
          boxShadow: `0 10px 30px rgba(45,42,38,0.25)`,
        }}
      >
        Download now
      </div>
    </AbsoluteFill>
  );
};
