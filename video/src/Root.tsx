// Root.tsx — Remotion entry point. Registers all compositions.
import { Composition } from "remotion";
import ProductStoryDesktop from "./compositions/ProductStoryDesktop";
import ProductStoryMobile from "./compositions/ProductStoryMobile";
import { FPS, DURATION } from "./story/frames";

export default function RemotionRoot() {
  return (
    <>
      <Composition
        id="ApplyGuardProductStoryDesktop"
        component={ProductStoryDesktop}
        durationInFrames={DURATION}
        fps={FPS}
        width={1600}
        height={900}
      />
      <Composition
        id="ApplyGuardProductStoryMobile"
        component={ProductStoryMobile}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1350}
      />
    </>
  );
}
