import { HomeMarketingShell } from "@/components/home/HomeMarketingShell";
import { WarmPageFrame } from "@/components/WarmPageFrame";

export default function HomePage() {
  return (
    <WarmPageFrame className="bridge-home-root min-h-screen" contentVeil="none" emphasis="soft">
      <HomeMarketingShell />
    </WarmPageFrame>
  );
}
