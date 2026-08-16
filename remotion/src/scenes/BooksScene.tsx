import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";
import { loadFont } from "@remotion/google-fonts/Fredoka";
import { palette } from "../lib/colors";
import { slideUp } from "../lib/animations";

const { fontFamily: displayFont } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });

export const BooksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isVertical = width < height;
  const titleSize = isVertical ? width * 0.1 : Math.min(width, height) * 0.09;

  const titleAnim = slideUp(frame, 30, 0, 60);

  const pages = [
    { src: "images/dragon-colored.jpg", rotate: -8, y: 0 },
    { src: "images/toy-lineart.jpg", rotate: 4, y: 20 },
    { src: "images/dragon-lineart.jpg", rotate: -3, y: 40 },
  ];

  const pageSize = Math.min(width, height) * (isVertical ? 0.28 : 0.22);
  const shelfY = isVertical ? height * 0.42 : height * 0.4;

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
          top: isVertical ? height * 0.1 : height * 0.1,
        }}
      >
        Keep every book.
      </div>

      <div
        style={{
          position: "absolute",
          top: shelfY,
          left: width / 2,
          width: pageSize * 3.4,
          height: pageSize * 1.4,
          transform: "translateX(-50%)",
        }}
      >
        {pages.map((page, i) => {
          const delay = i * 12;
          const progress = interpolate(frame, [20 + delay, 55 + delay], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x = (i - 1) * (pageSize * 1.05) + width / 2 - pageSize / 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - width / 2 + pageSize * 1.7,
                top: page.y,
                width: pageSize,
                height: pageSize * 1.2,
                borderRadius: 12,
                background: palette.white,
                border: `3px solid ${palette.charcoal}`,
                boxShadow: `0 8px 20px rgba(45,42,38,0.12)`,
                opacity: progress,
                transform: `rotate(${page.rotate}deg) translateY(${(1 - progress) * 60}px)`,
                overflow: "hidden",
              }}
            >
              <Img
                src={staticFile(page.src)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: shelfY + pageSize * 1.25,
          left: width / 2,
          width: pageSize * 3.6,
          height: 14,
          transform: "translateX(-50%)",
          background: palette.accentDark,
          borderRadius: 7,
          opacity: interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
