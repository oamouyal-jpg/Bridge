import { HomeMarketingShell } from "@/components/home/HomeMarketingShell";
import { WarmPageFrame } from "@/components/WarmPageFrame";

export default function HomePage() {
  return (
    <WarmPageFrame className="bridge-home-root min-h-svh" contentVeil="none" emphasis="soft">
      <HomeMarketingShell />
    </WarmPageFrame>
  );
}
