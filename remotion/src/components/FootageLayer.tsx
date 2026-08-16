import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette } from "../lib/colors";

type Props = {
  /** file name inside public/video, e.g. "say-it.mp4" */
  src: string;
  /** 0 = footage fully visible, 1 = fully washed out to paper tone */
  dim?: number;
  /** slow push-in amount */
  zoom?: number;
  /** seconds to skip at the head of the clip */
  startFrom?: number;
};

export const FootageLayer: React.FC<Props> = ({
  src,
  dim = 0.3,
  zoom = 0.08,
  startFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1.02, 1.02 + zoom], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: palette.paperDark }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, opacity: fadeIn }}>
        <OffthreadVideo
          src={staticFile(`video/${src}`)}
          muted
          trimBefore={Math.round(startFrom * fps)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* warm paper wash so the brand palette carries through */}
      <AbsoluteFill
        style={{
          background: palette.paper,
          opacity: dim,
          mixBlendMode: "screen",
        }}
      />

      {/* readability scrim: darker at top and bottom where copy sits */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(45,42,38,0.62) 0%, rgba(45,42,38,0.12) 34%, rgba(45,42,38,0.14) 62%, rgba(45,42,38,0.68) 100%)`,
        }}
      />

      {/* soft vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 45%, rgba(45,42,38,0.35) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const footageTextShadow = "0 3px 18px rgba(45,42,38,0.75), 0 1px 3px rgba(45,42,38,0.6)";
