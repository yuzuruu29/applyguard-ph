// Root.tsx — Remotion entry point. Registers all compositions.
import { Composition } from "remotion";
import ProductStoryDesktop from "./compositions/ProductStoryDesktop";
import ProductStoryMobile from "./compositions/ProductStoryMobile";
import HowItWorks from "./compositions/HowItWorks";
import { FPS, DURATION } from "./story/frames";
import { FPS as HOWTO_FPS, DURATION as HOWTO_DURATION } from "./howto/script";

export default function RemotionRoot() {
  return (
    <>
      {/* The instructional walkthrough shown in the site's
          "See how ApplyGuard works" section. */}
      <Composition
        id="HowItWorksDesktop"
        component={HowItWorks}
        durationInFrames={HOWTO_DURATION}
        fps={HOWTO_FPS}
        width={1600}
        height={900}
        defaultProps={{ isMobile: false }}
      />
      <Composition
        id="HowItWorksMobile"
        component={HowItWorks}
        durationInFrames={HOWTO_DURATION}
        fps={HOWTO_FPS}
        width={1080}
        height={1350}
        defaultProps={{ isMobile: true }}
      />

      {/* The original cream-palette product story, kept for reference. */}
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
