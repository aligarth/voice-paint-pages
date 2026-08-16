import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

const DURATION = 120 + 130 + 130 + 130 + 130 + 130 + 150 - 22 * 6;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="vertical"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="square"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="horizontal"
        component={MainVideo}
        durationInFrames={DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
