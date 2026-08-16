import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { scaleIn } from "../lib/animations";
import { FootageLayer, footageTextShadow } from "../components/FootageLayer";

const { fontFamily } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const WelcomeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;

  const titleAnim = scaleIn(frame, 30, 0);
  const subtitleAnim = scaleIn(frame, 30, 20);

  const orbit = interpolate(frame, [0, 120], [0, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const pencilColors = [palette.primary, palette.accent, palette.green, palette.blue, palette.purple];

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FootageLayer src="together.webm" dim={0.34} zoom={0.1} startFrom={1.2} />

      {pencilColors.map((color, i) => {
        const angle = orbit + i * (360 / pencilColors.length);
        const radius = Math.min(width, height) * 0.22;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: centerX + x - 10,
              top: centerY + y - 35,
              width: 20,
              height: 70,
              borderRadius: 10,
              background: `linear-gradient(180deg, ${color} 70%, ${palette.charcoal} 70%)`,
              transform: `rotate(${angle + 90}deg)`,
              opacity: 0.95,
              boxShadow: "0 8px 20px rgba(45,42,38,0.4)",
            }}
          />
        );
      })}

      <div
        style={{
          fontFamily,
          fontSize: Math.min(width, height) * 0.09,
          fontWeight: 600,
          color: palette.white,
          textShadow: footageTextShadow,
          textAlign: "center",
          opacity: titleAnim.opacity,
          transform: `scale(${titleAnim.scale})`,
          lineHeight: 1.2,
        }}
      >
        Welcome to
      </div>
      <div
        style={{
          fontFamily,
          fontSize: Math.min(width, height) * 0.13,
          fontWeight: 600,
          color: palette.accent,
          textShadow: footageTextShadow,
          textAlign: "center",
          opacity: subtitleAnim.opacity,
          transform: `scale(${subtitleAnim.scale})`,
          lineHeight: 1.1,
          marginTop: 8,
        }}
      >
        Color My World
      </div>
    </AbsoluteFill>
  );
};
