// Root.tsx — Remotion entry point. Registers all compositions.
import { Composition } from "remotion";
import ProductStoryDesktop from "./compositions/ProductStoryDesktop";
import ProductStoryMobile from "./compositions/ProductStoryMobile";
import HowItWorks from "./compositions/HowItWorks";
import MarketingAd from "./compositions/MarketingAd";
import PremiumShowcase from "./compositions/PremiumShowcase";
import { FPS, DURATION } from "./story/frames";
import { FPS as HOWTO_FPS, DURATION as HOWTO_DURATION } from "./howto/script";
import { FPS as AD_FPS, DURATION as AD_DURATION } from "./ad/script";
import { FPS as PREMIUM_FPS, DURATION as PREMIUM_DURATION } from "./premium/script";

export default function RemotionRoot() {
  return (
    <>
      {/* The promotional ad — Maya's story, for social distribution.
          Landscape for YouTube/Facebook (render with --scale=1.2 for
          1920×1080), vertical for Reels/TikTok. 1600×900 keeps the shared
          howto furniture at its designed proportions. */}
      <Composition
        id="MarketingAd"
        component={MarketingAd}
        durationInFrames={AD_DURATION}
        fps={AD_FPS}
        width={1600}
        height={900}
        defaultProps={{ vertical: false }}
      />
      <Composition
        id="MarketingAdVertical"
        component={MarketingAd}
        durationInFrames={AD_DURATION}
        fps={AD_FPS}
        width={1080}
        height={1920}
        defaultProps={{ vertical: true }}
      />

      {/* The Premium features showcase embedded on the Offers page —
          five AI features with the voice mock interview as the hero beat. */}
      <Composition
        id="PremiumShowcaseDesktop"
        component={PremiumShowcase}
        durationInFrames={PREMIUM_DURATION}
        fps={PREMIUM_FPS}
        width={1600}
        height={900}
        defaultProps={{ mobile: false }}
      />
      <Composition
        id="PremiumShowcaseMobile"
        component={PremiumShowcase}
        durationInFrames={PREMIUM_DURATION}
        fps={PREMIUM_FPS}
        width={1080}
        height={1350}
        defaultProps={{ mobile: true }}
      />

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
