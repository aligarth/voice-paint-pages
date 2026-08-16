import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { palette } from "../lib/colors";
import { slideUp, scaleIn } from "../lib/animations";
import { FootageLayer, footageTextShadow } from "../components/FootageLayer";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
const { fontFamily: bodyFont } = loadNunito("normal", { weights: ["700"], subsets: ["latin"] });

export const SayItScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.13 : Math.min(width, height) * 0.11;
  const bubbleScale = isVertical ? 0.85 : 0.7;

  const titleAnim = slideUp(frame, 30, 0, 60);
  const bubbleAnim = scaleIn(frame, 30, 25);
  const captionAnim = slideUp(frame, 30, 45, 40);

  const micPulse = interpolate(frame, [0, 30, 60], [1, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "repeat",
  });

  const captionText = "a dragon eating pizza";
  const charsToShow = Math.floor(interpolate(frame, [50, 110], [0, captionText.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FootageLayer src="say-it.mp4" dim={0.18} zoom={0.07} />

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
          top: isVertical ? height * 0.09 : height * 0.07,
        }}
      >
        Say it.
      </div>

      <div
        style={{
          position: "absolute",
          bottom: isVertical ? height * 0.2 : height * 0.16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: bubbleAnim.opacity,
          transform: `scale(${bubbleAnim.scale * bubbleScale})`,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: `0 12px 40px rgba(232,90,79,0.45)`,
            transform: `scale(${micPulse})`,
          }}
        >
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={palette.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </div>

        <div
          style={{
            marginTop: 24,
            padding: "18px 32px",
            background: palette.white,
            borderRadius: 24,
            border: `3px solid ${palette.charcoal}`,
            boxShadow: `8px 8px 0 ${palette.accent}`,
            fontFamily: bodyFont,
            fontSize: isVertical ? width * 0.055 : height * 0.05,
            color: palette.charcoal,
            fontWeight: 700,
            minWidth: 260,
            textAlign: "center",
          }}
        >
          "{captionText.slice(0, charsToShow)}"
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: isVertical ? height * 0.06 : height * 0.05,
          fontFamily: bodyFont,
          fontSize: isVertical ? width * 0.04 : height * 0.035,
          color: palette.white,
          textShadow: footageTextShadow,
          opacity: captionAnim.opacity,
          transform: `translateY(${captionAnim.y}px)`,
          textAlign: "center",
          maxWidth: width * 0.8,
        }}
      >
        Tap the mic and describe anything you want to color.
      </div>
    </AbsoluteFill>
  );
};
