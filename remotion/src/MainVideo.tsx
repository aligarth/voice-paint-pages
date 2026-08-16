import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./components/PersistentBackground";
import { WelcomeScene } from "./scenes/WelcomeScene";
import { SayItScene } from "./scenes/SayItScene";
import { DrawItScene } from "./scenes/DrawItScene";
import { ColorItScene } from "./scenes/ColorItScene";
import { SnapItScene } from "./scenes/SnapItScene";
import { BooksScene } from "./scenes/BooksScene";
import { EndCardScene } from "./scenes/EndCardScene";

const transitionDuration = 22;
const sceneTiming = springTiming({ config: { damping: 22, stiffness: 120 } });

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <WelcomeScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <SayItScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <DrawItScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <ColorItScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <SnapItScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <BooksScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-top" })}
          timing={sceneTiming}
          durationInFrames={transitionDuration}
        />

        <TransitionSeries.Sequence durationInFrames={150}>
          <EndCardScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
