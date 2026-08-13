// MarketingAd.tsx — the promotional film.
//
// A 65-second story in three acts: a Quezon City VA nearly caught by an
// advance-fee "hiring" post, the quiet legit job ApplyGuard helps her say yes
// to, and the wider world of VAs the scanner works for. Scene order and
// timing come from ad/script.ts; the 16:9 and 9:16 cuts share every scene
// through the `vertical` prop.

import { Sequence } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadStamp } from "@remotion/google-fonts/Fraunces";

import { AdFurniture, AdStage } from "../ad/chrome";
import { SCENES, type SceneId } from "../ad/script";
import {
  Bait,
  Cta,
  GroupChat,
  Hook,
  RealOne,
  Scan,
  Trust,
  VerdictBad,
  World,
  type SceneProps,
} from "../ad/scenes";

// Fonts must resolve before the first frame rasterises, otherwise the render
// silently falls back to a system face.
loadDisplay();
loadBody();
loadMono();
loadStamp();

const COMPONENTS: Record<SceneId, (p: SceneProps) => React.ReactNode> = {
  hook: Hook,
  bait: Bait,
  scan: Scan,
  verdict: VerdictBad,
  groupchat: GroupChat,
  real: RealOne,
  world: World,
  trust: Trust,
  cta: Cta,
};

type Props = { vertical?: boolean };

export default function MarketingAd({ vertical = false }: Props) {
  return (
    <AdStage>
      {SCENES.map((s) => {
        const SceneComponent = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id}>
            <SceneComponent vertical={vertical} />
          </Sequence>
        );
      })}
      <AdFurniture vertical={vertical} />
    </AdStage>
  );
}
