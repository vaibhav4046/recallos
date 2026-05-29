import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  ShieldCheck,
  Database,
  Bot,
  Youtube,
  Server,
  Lock,
  Download,
  Trash2,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Musemint handles your saved ideas, what third-party processors it uses, and the controls you have over your data.",
};

const LAST_UPDATED = "May 29, 2026";
const CONTACT_EMAIL = "privacy@musemint.app";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
        <Icon className="h-5 w-5 text-accent" />
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-mute">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
          <ShieldCheck className="h-4 w-4" />
          Privacy
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Privacy Policy</h1>
        <p className="text-sm text-ink-mute">Last updated {LAST_UPDATED}</p>
        <p className="text-sm leading-relaxed text-ink-mute">
          Musemint is a personal memory layer for ideas you want to build. You save a post, video,
          screenshot, link, or note; Musemint classifies and scores it, and keeps it until you turn
          it into a real project. This policy explains exactly what data that involves, who processes
          it, and the controls you have.
        </p>
      </header>

      <Card className="space-y-7">
        <Section icon={Database} title="What Musemint stores">
          <p>
            Musemint stores only the content you choose to save and the metadata derived from it:
            the title, summary, category, tags, and relevance scores it generates for each item, plus
            any notes or intent you attach. This is kept in a Postgres database so your memory
            persists across devices.
          </p>
          <p>
            Musemint does not build advertising profiles, does not sell data, and does not track you
            across other sites.
          </p>
        </Section>

        <Section icon={Bot} title="AI processors">
          <p>
            To classify, summarize, score, generate build packs, read screenshots (OCR), and create
            embeddings, Musemint sends the relevant saved content to whichever AI provider you have
            configured. Depending on your settings that may be:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google (Gemini) — classification, summaries, vision/OCR, and embeddings</li>
            <li>OpenAI — classification, summaries, and build-pack generation</li>
            <li>Anthropic (Claude) — classification, summaries, and build-pack generation</li>
            <li>Mistral — classification and summaries</li>
          </ul>
          <p>
            Only the content needed for the requested task is sent, and only to the provider in your
            configured chain. Each provider processes that content under its own terms and privacy
            policy. If no provider key is set, Musemint falls back to an offline, built-in mode and
            no content leaves the server for AI processing.
          </p>
        </Section>

        <Section icon={Youtube} title="Enrichment">
          <p>
            When you save a YouTube link, Musemint calls the YouTube Data API to fetch public
            metadata (title, channel, description) so the saved item is useful later. It requests
            only public information about the video you saved.
          </p>
          <p>
            Musemint never logs into Instagram or LinkedIn on your behalf and never scrapes private
            data from any platform. It works from the content you explicitly hand it.
          </p>
        </Section>

        <Section icon={Server} title="Hosting and infrastructure">
          <p>
            The app and its database are hosted on Vercel, including Vercel Postgres. Standard
            server logs (request times, error traces) are processed by the hosting platform to keep
            the service running.
          </p>
        </Section>

        <Section icon={Lock} title="Access and security">
          <p>
            Musemint is a single-user product: your instance holds your memory only. You can set an
            optional password to gate access. Signing material for the Android app and any provider
            API keys are stored as server-side secrets, never exposed to the browser, and never
            embedded in saved items.
          </p>
          <p>
            Do not save passwords, financial account numbers, or government IDs into Musemint — it is
            built for ideas, not credentials.
          </p>
        </Section>

        <Section icon={Download} title="Exporting your data">
          <p>
            You can export your saved items at any time from Settings. Your data stays portable —
            it is yours.
          </p>
        </Section>

        <Section icon={Trash2} title="Deleting your data">
          <p>
            You can delete individual items, or wipe your data from Settings. Deletion removes the
            item and its derived metadata from the database.
          </p>
        </Section>

        <Section icon={Mail} title="Contact">
          <p>
            Questions about this policy or your data? Reach out at{" "}
            <a className="text-accent hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </Card>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-mute">
        <Link className="text-accent hover:underline" href="/terms">
          Terms of Service
        </Link>
        <span className="text-line">·</span>
        <Link className="text-accent hover:underline" href="/">
          Back to Musemint
        </Link>
      </footer>
    </div>
  );
}
