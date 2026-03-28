"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useRef, useState, useTransition } from "react";

export function ProfileEditor({
  profile
}: {
  profile: {
    username: string;
    displayName: string;
    bio: string;
    website: string | null;
    location: string | null;
    avatarUrl: string | null;
    isPrivate: boolean;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [website, setWebsite] = useState(profile.website ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
  const [vibe, setVibe] = useState("premium");

  return (
    <form
      className="glass-panel rounded-[32px] p-6 shadow-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
          let avatarUrl = profile.avatarUrl;
          const file = fileRef.current?.files?.[0];
          if (file) {
            const upload = new FormData();
            upload.set("file", file);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Avatar upload failed.");
              return;
            }
            avatarUrl = uploadPayload.file.url;
          }

          const response = await fetch("/api/settings/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              displayName,
              bio,
              website,
              location,
              avatarUrl,
              isPrivate
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to save profile.");
            return;
          }

          router.refresh();
        });
      }}
    >
      <div className="grid gap-4">
        <div className="rounded-[24px] border border-accent/15 bg-accent/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">AI profile polish</p>
              <p className="mt-1 text-sm text-white/60">Rewrite your bio into something cleaner and more credible.</p>
            </div>
            <div className="flex gap-3">
              <input
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none focus:border-accent"
                onChange={(event) => setVibe(event.target.value)}
                placeholder="Vibe"
                value={vibe}
              />
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/85 hover:bg-white/5"
                disabled={aiPending}
                onClick={() =>
                  startAITransition(async () => {
                    setError(null);
                    const response = await fetch("/api/ai/profile", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        displayName,
                        bio,
                        website,
                        location,
                        vibe
                      })
                    });
                    const payload = await response.json();
                    if (!response.ok) {
                      setError(payload.error ?? "Profile rewrite failed.");
                      return;
                    }
                    setDisplayName(payload.displayName);
                    setBio(payload.bio);
                  })
                }
                type="button"
              >
                <Sparkles className="h-4 w-4 text-accent-soft" />
                {aiPending ? "Rewriting..." : "Rewrite with AI"}
              </button>
            </div>
          </div>
        </div>
        <Field label="Display name" name="displayName" onChange={setDisplayName} value={displayName} />
        <Field label="Username" name="username" onChange={setUsername} value={username} />
        <Field label="Website" name="website" onChange={setWebsite} value={website} />
        <Field label="Location" name="location" onChange={setLocation} value={location} />
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Bio</span>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setBio(event.target.value)}
            name="bio"
            value={bio}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Avatar</span>
          <input accept="image/*" ref={fileRef} type="file" />
        </label>
        <label className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
          <div>
            <p className="text-sm font-medium">Private account</p>
            <p className="mt-1 text-sm text-white/55">Hide your posts from people who do not follow you.</p>
          </div>
          <input
            checked={isPrivate}
            className="h-5 w-5 accent-red-500"
            onChange={(event) => setIsPrivate(event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <button
        className="mt-6 rounded-2xl bg-accent px-5 py-3 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
