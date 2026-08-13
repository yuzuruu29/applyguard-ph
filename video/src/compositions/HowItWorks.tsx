// HowItWorks.tsx — the comprehensive instructional film.
//
// Twelve chapters walk a viewer through the whole product: paste a post, add
// optional details, read the verdict, understand the score, review the scam
// signals and the gaps, copy the prompt, background-check the link, track the
// application, and see where the data lives.
//
// Structure: <Stage> paints the aurora backdrop once, each chapter renders
// inside its own <Sequence> (so chapter code sees local frames), and
// <Furniture> draws the persistent header, chapter title, caption, and
// progress rail on top. Chapter order and timing come from howto/script.ts.

import { Sequence } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadStamp } from "@remotion/google-fonts/Fraunces";

import { Furniture, Stage } from "../howto/chrome";
import { CHAPTERS, type ChapterId } from "../howto/script";
import {
  Closing,
  Details,
  Flags,
  Intro,
  LinkCheck,
  Missing,
  Paste,
  Privacy,
  Prompt,
  Score,
  Tracker,
  Verdict,
} from "../howto/chapters";

// Fonts must resolve before the first frame rasterises, otherwise the render
// silently falls back to a system face. @remotion/google-fonts handles the
// delayRender/continueRender handshake for us.
loadDisplay();
loadBody();
loadMono();
loadStamp();

type Props = { isMobile?: boolean };

const SCENES: Record<ChapterId, (p: { isMobile: boolean }) => React.ReactNode> = {
  intro: Intro,
  paste: Paste,
  details: Details,
  verdict: Verdict,
  score: Score,
  flags: Flags,
  missing: Missing,
  prompt: Prompt,
  link: LinkCheck,
  tracker: Tracker,
  privacy: Privacy,
  closing: Closing,
};

export default function HowItWorks({ isMobile = false }: Props) {
  return (
    <Stage>
      {CHAPTERS.map((ch) => {
        const Scene = SCENES[ch.id];
        return (
          <Sequence key={ch.id} from={ch.from} durationInFrames={ch.durationInFrames} name={ch.title}>
            <Scene isMobile={isMobile} />
          </Sequence>
        );
      })}
      <Furniture isMobile={isMobile} />
    </Stage>
  );
}
