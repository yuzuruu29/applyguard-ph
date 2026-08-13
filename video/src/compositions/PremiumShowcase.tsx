// PremiumShowcase.tsx — the Premium features film.
//
// A 58-second showcase of the five Premium AI features, with the voice mock
// interview as the hero beat, closing on the honest one-time pricing. Picks
// up the Harbourline application from the marketing ad so the two films share
// one continuity. Scene order and timing come from premium/script.ts; the
// desktop (1600×900) and mobile (1080×1350) cuts share every scene through
// the `mobile` prop. Embedded on the Offers page by PremiumShowcaseVideo.jsx.

import { Sequence } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadStamp } from "@remotion/google-fonts/Fraunces";

import { SCENES, type SceneId } from "../premium/script";
import {
  Cta,
  DeepScan,
  Interview,
  Intro,
  Message,
  Plans,
  PremiumFurniture,
  PremiumStage,
  Resume,
  Setup,
  type SceneProps,
} from "../premium/scenes";

// Fonts must resolve before the first frame rasterises, otherwise the render
// silently falls back to a system face.
loadDisplay();
loadBody();
loadMono();
loadStamp();

const COMPONENTS: Record<SceneId, (p: SceneProps) => React.ReactNode> = {
  intro: Intro,
  message: Message,
  deepscan: DeepScan,
  resume: Resume,
  setup: Setup,
  interview: Interview,
  plans: Plans,
  cta: Cta,
};

type Props = { mobile?: boolean };

export default function PremiumShowcase({ mobile = false }: Props) {
  return (
    <PremiumStage>
      {SCENES.map((s) => {
        const SceneComponent = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
            <SceneComponent mobile={mobile} />
          </Sequence>
        );
      })}
      <PremiumFurniture mobile={mobile} />
    </PremiumStage>
  );
}
