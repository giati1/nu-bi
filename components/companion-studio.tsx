"use client";

import { useEffect, useState, type FormEvent } from "react";

type Companion = { id: string; name: string; personality: string; appearance: string; createdAt: string };
type Message = { id: string; role: "user" | "assistant"; body: string; createdAt: string };

async function readJson<T>(response: Response): Promise<T> {
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export function CompanionStudio() {
  const [adultAcknowledged, setAdultAcknowledged] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [selected, setSelected] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [appearance, setAppearance] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!adultAcknowledged) return;
    let live = true;
    fetch("/api/companions", { cache: "no-store" })
      .then((response) => readJson<{ companions: Companion[] }>(response))
      .then((result) => { if (live) setCompanions(result.companions); })
      .catch((cause) => { if (live) setError(cause instanceof Error ? cause.message : "Could not load companions."); });
    return () => { live = false; };
  }, [adultAcknowledged]);

  async function openCompanion(companion: Companion) {
    setError("");
    setBusy(true);
    try {
      const result = await readJson<{ messages: Message[] }>(await fetch(`/api/companions/${companion.id}`, { cache: "no-store" }));
      setSelected(companion);
      setMessages(result.messages);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open companion.");
    } finally {
      setBusy(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await readJson<{ companion: Companion }>(await fetch("/api/companions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, personality, appearance, adultAcknowledged, characterConfirmed: true })
      }));
      setCompanions((current) => [result.companion, ...current]);
      setSelected(result.companion);
      setMessages([]);
      setName("");
      setPersonality("");
      setAppearance("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create companion.");
    } finally {
      setBusy(false);
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setError("");
    setBusy(true);
    try {
      const result = await readJson<{ userMessage: Message; assistantMessage: Message }>(await fetch(`/api/companions/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim(), adultAcknowledged })
      }));
      setMessages((current) => [...current, result.userMessage, result.assistantMessage]);
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!selected || !window.confirm(`Delete ${selected.name} and all messages? This cannot be undone.`)) return;
    setError("");
    setBusy(true);
    try {
      await readJson(await fetch(`/api/companions/${selected.id}`, { method: "DELETE" }));
      setCompanions((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null);
      setMessages([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete companion.");
    } finally {
      setBusy(false);
    }
  }

  if (!adultAcknowledged) return (
    <section className="glass-panel mx-auto max-w-xl rounded-[30px] p-6 shadow-panel sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-accent-soft">Private local prototype</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Adult companion studio</h2>
      <p className="mt-3 text-sm leading-6 text-white/65">This area is for adults 18 and older. Companions are fictional AI characters, not real people. This local prototype uses self-attestation; it is unavailable on the production website until proper age verification is added.</p>
      <label className="mt-6 flex items-start gap-3 text-sm text-white/80">
        <input className="mt-1 h-4 w-4" type="checkbox" checked={adultAcknowledged} onChange={(event) => setAdultAcknowledged(event.target.checked)} />
        <span>I confirm that I am at least 18 and understand these companions are AI.</span>
      </label>
    </section>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.6fr)]">
      <section className="glass-panel rounded-[30px] p-5 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-accent-soft">Your companions</p>
        <div className="mt-4 space-y-2">
          {companions.length === 0 ? <p className="text-sm text-white/55">Create your first companion below.</p> : companions.map((companion) => (
            <button key={companion.id} type="button" onClick={() => void openCompanion(companion)} className={`w-full rounded-2xl border px-4 py-3 text-left ${selected?.id === companion.id ? "border-accent bg-accent/10" : "border-white/10 bg-white/[0.03]"}`}>
              <span className="block font-semibold text-white">{companion.name}</span>
              <span className="mt-1 block line-clamp-2 text-xs text-white/55">{companion.personality}</span>
            </button>
          ))}
        </div>
        <form className="mt-7 space-y-3 border-t border-white/10 pt-6" onSubmit={(event) => void create(event)}>
          <h2 className="font-semibold text-white">Create a companion</h2>
          <input required minLength={2} maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" aria-label="Companion name" className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent" />
          <textarea required minLength={8} maxLength={600} value={personality} onChange={(event) => setPersonality(event.target.value)} placeholder="Personality and interests" aria-label="Personality and interests" rows={3} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent" />
          <textarea required minLength={8} maxLength={600} value={appearance} onChange={(event) => setAppearance(event.target.value)} placeholder="Fictional adult appearance concept" aria-label="Fictional adult appearance concept" rows={3} className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent" />
          <p className="text-xs leading-5 text-white/55">Create only fictional adults. Do not copy a real person without their consent.</p>
          <button disabled={busy} className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">Create companion</button>
        </form>
      </section>
      <section className="glass-panel flex min-h-[520px] min-w-0 flex-col rounded-[30px] p-5 shadow-panel">
        {selected ? <>
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div><h2 className="text-xl font-semibold text-white">{selected.name}</h2><p className="mt-1 text-xs text-white/55">Fictional AI companion · private conversation</p></div>
            <button type="button" disabled={busy} onClick={() => void remove()} className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/70">Delete</button>
          </div>
          <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto py-5">
            {messages.length === 0 ? <p className="text-sm text-white/55">Start a conversation with {selected.name}.</p> : messages.map((message) => (
              <div key={message.id} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-accent text-black" : "border border-white/10 bg-white/[0.05] text-white/85"}`}>{message.body}</div>
            ))}
          </div>
          <form className="flex gap-2 border-t border-white/10 pt-4" onSubmit={(event) => void send(event)}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Write a message" aria-label="Message" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent" />
            <button disabled={busy || !draft.trim()} className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Thinking…" : "Send"}</button>
          </form>
        </> : <div className="m-auto max-w-sm text-center"><h2 className="text-xl font-semibold text-white">Choose or create a companion</h2><p className="mt-2 text-sm leading-6 text-white/55">Your conversations stay in your local NOMI database.</p></div>}
        {error ? <p role="alert" className="mt-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}
      </section>
    </div>
  );
}
