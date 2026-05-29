"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { BookOpenCheck, CheckCircle2, Loader2, X, XCircle } from "lucide-react";

interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface QuizState {
  questions: QuizQuestion[];
  answers: (number | null)[];
  submitted: boolean;
  provider: string;
}

interface QuizModalProps {
  itemId: string;
  itemTitle: string;
}

export function QuizModal({ itemId, itemTitle }: QuizModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<QuizState | null>(null);
  const toast = useToast();

  async function startQuiz() {
    setOpen(true);
    setLoading(true);
    setState(null);
    try {
      const res = await fetch(`/api/items/${itemId}/quiz`, { method: "POST" });
      if (!res.ok) throw new Error("Quiz failed");
      const json = await res.json();
      setState({
        questions: json.questions,
        answers: json.questions.map(() => null),
        submitted: false,
        provider: json.provider ?? "mock",
      });
    } catch (err: any) {
      toast({ kind: "error", title: "Couldn't generate quiz", body: err.message });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function pick(qi: number, oi: number) {
    setState((prev) => {
      if (!prev || prev.submitted) return prev;
      const answers = [...prev.answers];
      answers[qi] = oi;
      return { ...prev, answers };
    });
  }

  function submit() {
    setState((prev) => (prev ? { ...prev, submitted: true } : prev));
  }

  // Radix drives close on Esc, overlay click, and the close buttons. Reset the
  // quiz whenever the dialog leaves the screen so reopening starts fresh.
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setState(null);
  }

  const score =
    state?.submitted
      ? state.answers.reduce<number>(
          (acc, a, i) => acc + (a === state.questions[i].answerIndex ? 1 : 0),
          0,
        )
      : 0;
  const total = state?.questions.length ?? 0;
  const allAnswered = state?.answers.every((a) => a !== null) ?? false;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button size="sm" onClick={startQuiz}>
          <BookOpenCheck className="h-3.5 w-3.5" /> Quiz me
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto panel bg-bg-raised/95 p-5 shadow-glow focus:outline-none data-[state=open]:animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="field-label">Quiz</div>
              <Dialog.Title className="mt-1 text-lg font-semibold text-ink">
                {itemTitle}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close quiz" className="btn-icon h-8 w-8">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-ink-soft">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <p className="text-sm">Generating quiz from your saved notes…</p>
            </div>
          ) : state ? (
            <div className="mt-4 space-y-5">
              {state.questions.map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-xl border border-line-soft bg-bg-soft/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[11px] text-accent">
                      {qi + 1}
                    </span>
                    <div className="text-sm font-medium text-ink">{q.q}</div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const picked = state.answers[qi] === oi;
                      const correct = oi === q.answerIndex;
                      const showResult = state.submitted;
                      return (
                        <li key={oi}>
                          <button
                            type="button"
                            onClick={() => pick(qi, oi)}
                            disabled={state.submitted}
                            className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              showResult && correct
                                ? "border-success/50 bg-success/10 text-ink"
                                : showResult && picked && !correct
                                  ? "border-danger/50 bg-danger/10 text-ink"
                                  : picked
                                    ? "border-accent/50 bg-accent/10 text-ink"
                                    : "border-line-soft bg-bg-soft/40 text-ink-soft hover:border-line"
                            }`}
                            aria-pressed={picked}
                          >
                            <span className="mt-0.5">
                              {showResult && correct ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              ) : showResult && picked && !correct ? (
                                <XCircle className="h-3.5 w-3.5 text-danger" />
                              ) : (
                                <span
                                  className={`block h-3 w-3 rounded-full border ${
                                    picked ? "border-accent bg-accent" : "border-line"
                                  }`}
                                />
                              )}
                            </span>
                            <span>{opt}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {state.submitted && q.explanation ? (
                    <p className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.06] p-2.5 text-xs text-ink-soft">
                      <span className="font-semibold text-accent">Why:</span> {q.explanation}
                    </p>
                  ) : null}
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                <div className="text-xs text-ink-mute">
                  {state.submitted ? (
                    <>
                      Score{" "}
                      <span className="font-semibold text-ink">
                        {score}/{total}
                      </span>
                    </>
                  ) : (
                    <>
                      {state.answers.filter((a) => a !== null).length} / {total} answered
                    </>
                  )}
                  <Badge tone={state.provider === "mock" ? "muted" : "accent"} className="ml-2">
                    {state.provider === "mock" ? "Offline mode" : "AI ready"}
                  </Badge>
                </div>
                {state.submitted ? (
                  <Dialog.Close asChild>
                    <Button variant="primary">Close</Button>
                  </Dialog.Close>
                ) : (
                  <Button
                    variant="primary"
                    onClick={submit}
                    disabled={!allAnswered}
                    title={
                      allAnswered ? "Submit quiz" : "Answer every question to submit"
                    }
                  >
                    Submit answers
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
