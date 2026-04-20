import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Get Bridge",
  description: "Download Bridge for iPhone or Android, or open Bridge in your browser.",
};

export default function DownloadPage() {
  const ios = process.env.NEXT_PUBLIC_IOS_APP_URL?.trim();
  const play =
    process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ??
    process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim();

  return (
    <main className="min-h-screen bg-bridge-cream px-4 py-16 text-bridge-ink">
      <div className="mx-auto max-w-md rounded-2xl border border-bridge-mist bg-white p-8 shadow-md">
        <h1 className="font-display text-2xl tracking-tight">Get Bridge</h1>
        <p className="mt-3 text-sm leading-relaxed text-bridge-stone">
          Use Bridge in your browser on any device — or install from your app store when Bridge is
          listed there.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild className="w-full rounded-full">
            <Link href="/">Open Bridge in browser</Link>
          </Button>
          {ios ? (
            <Button asChild variant="secondary" className="w-full rounded-full">
              <a href={ios} target="_blank" rel="noopener noreferrer">
                Download on the App Store
              </a>
            </Button>
          ) : null}
          {play ? (
            <Button asChild variant="secondary" className="w-full rounded-full">
              <a href={play} target="_blank" rel="noopener noreferrer">
                Get it on Google Play
              </a>
            </Button>
          ) : null}
        </div>
        {!ios && !play ? (
          <p className="mt-6 text-xs leading-relaxed text-bridge-stone">
            App Store and Google Play links appear here automatically when your team configures them
            — until then, use Bridge in your browser; it works on phones and tablets.
          </p>
        ) : (
          <p className="mt-6 text-xs leading-relaxed text-bridge-stone">
            After installing, open your invite link again — or sign in with the same browser session
            you used to create or join the room.
          </p>
        )}
      </div>
    </main>
  );
}
