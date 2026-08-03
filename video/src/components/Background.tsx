// Background.tsx — Full-frame paper texture background.
// Subtle warm gradient over cream base. No animation.
import { AbsoluteFill } from "remotion";
import { colors } from "../design/tokens";

export default function Background() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${colors.card} 0%, ${colors.paper} 70%)`,
      }}
    />
  );
}
