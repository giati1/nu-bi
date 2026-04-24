"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Mic, Sparkles, Square, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { MicrophoneLevel } from "@/components/microphone-level";
import { useMicrophoneLevel } from "@/hooks/use-microphone-level";

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
    voiceIntroUrl: string | null;
    voiceIntroMimeType: string | null;
    isPrivate: boolean;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const voiceFileRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [website, setWebsite] = useState(profile.website ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(profile.website || profile.location || profile.voiceIntroUrl || profile.isPrivate)
  );
  const [vibe, setVibe] = useState("premium");
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [voiceIntro, setVoiceIntro] = useState<{
    url: string | null;
    mimeType: string | null;
    name: string;
  } | null>(
    profile.voiceIntroUrl
      ? {
          url: profile.voiceIntroUrl,
          mimeType: profile.voiceIntroMimeType ?? "audio/webm",
          name: "Current voice intro"
        }
      : null
  );
  const micLevel = useMicrophoneLevel(recordingStream);
  const checklist = [
    { label: "Username", complete: username.trim().length >= 3 },
    { label: "Display name", complete: displayName.trim().length >= 2 },
    { label: "Bio", complete: bio.trim().length >= 16 },
    { label: "Avatar", complete: Boolean(profile.avatarUrl || fileRef.current?.files?.[0]) },
    { label: "Location or website", complete: location.trim().length > 0 || website.trim().length > 0 }
  ];
  const completedCount = checklist.filter((item) => item.complete).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <form
      className="glass-panel rounded-[32px] p-6 shadow-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        startTransition(async () => {
          let avatarUrl = profile.avatarUrl;
          const avatarFile = fileRef.current?.files?.[0];
          if (avatarFile) {
            const upload = new FormData();
            upload.set("file", avatarFile);
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

          let voiceIntroUrl = voiceIntro?.url ?? null;
          let voiceIntroMimeType = voiceIntro?.mimeType ?? null;
          const voiceFile = voiceFileRef.current?.files?.[0];
          if (voiceFile) {
            const upload = new FormData();
            upload.set("file", voiceFile);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Voice intro upload failed.");
              return;
            }
            voiceIntroUrl = uploadPayload.file.url;
            voiceIntroMimeType = uploadPayload.file.mimeType;
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
              voiceIntroUrl,
              voiceIntroMimeType,
              isPrivate
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to save profile.");
            return;
          }

          setSuccess("Profile saved. Your public page now reflects these changes.");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4">
        <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Profile setup</p>
              <p className="mt-1 text-sm text-white/60">
                Finish the basics so people immediately know who you are and why to follow.
              </p>
            </div>
            <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-accent-soft">
              {completedCount}/{checklist.length} complete
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {checklist.map((item) => (
              <div
                className={`rounded-2xl border px-3 py-3 text-sm ${
                  item.complete
                    ? "border-accent/20 bg-accent/5 text-white"
                    : "border-white/10 bg-black/20 text-white/62"
                }`}
                key={item.label}
              >
                {item.complete ? "Done" : "Next"}: {item.label}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/72" href={`/profile/${username || profile.username}`}>
              Preview public profile
            </Link>
            <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/creator">
              Create a post
            </Link>
          </div>
        </section>
        <Field label="Display name" name="displayName" onChange={setDisplayName} value={displayName} />
        <Field label="Username" name="username" onChange={setUsername} value={username} />
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
        <section className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <button
            className="flex w-full items-center justify-between gap-4 text-left"
            onClick={() => setAdvancedOpen((value) => !value)}
            type="button"
          >
            <div>
              <p className="text-sm font-medium text-white">Optional profile extras</p>
              <p className="mt-1 text-sm text-white/58">
                Add links, AI polish, a voice intro, or privacy controls after the basics are done.
              </p>
            </div>
            {advancedOpen ? <ChevronUp className="h-4 w-4 text-white/65" /> : <ChevronDown className="h-4 w-4 text-white/65" />}
          </button>

          {advancedOpen ? (
            <div className="mt-4 grid gap-4">
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

              <Field label="Website" name="website" onChange={setWebsite} value={website} />
              <Field label="Location" name="location" onChange={setLocation} value={location} />

              <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Voice intro</p>
                    <p className="mt-1 text-sm text-white/58">
                      Add a short voice trailer so people hear your energy before they message you.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/5"
                      onClick={async () => {
                        if (recordingVoice) {
                          recorderRef.current?.stop();
                          return;
                        }
                        setError(null);
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          setRecordingStream(stream);
                          const recorder = new MediaRecorder(stream);
                          voiceChunksRef.current = [];
                          recorder.ondataavailable = (event) => {
                            if (event.data.size > 0) {
                              voiceChunksRef.current.push(event.data);
                            }
                          };
                          recorder.onstop = () => {
                            const blob = new Blob(voiceChunksRef.current, {
                              type: recorder.mimeType || "audio/webm"
                            });
                            const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
                            const voiceFile = new File([blob], `profile-voice-intro.${extension}`, {
                              type: recorder.mimeType || "audio/webm"
                            });
                            const transfer = new DataTransfer();
                            transfer.items.add(voiceFile);
                            if (voiceFileRef.current) {
                              voiceFileRef.current.files = transfer.files;
                            }
                            const previewUrl = URL.createObjectURL(voiceFile);
                            setVoiceIntro({
                              url: previewUrl,
                              mimeType: voiceFile.type,
                              name: voiceFile.name
                            });
                            recorder.stream.getTracks().forEach((track) => track.stop());
                            setRecordingStream(null);
                            setRecordingVoice(false);
                          };
                          recorderRef.current = recorder;
                          recorder.start();
                          setRecordingVoice(true);
                        } catch {
                          setError("Microphone access was blocked or unavailable.");
                        }
                      }}
                      type="button"
                    >
                      {recordingVoice ? <Square className="h-3.5 w-3.5 text-accent-soft" /> : <Mic className="h-3.5 w-3.5 text-accent-soft" />}
                      {recordingVoice ? "Stop intro" : "Record intro"}
                    </button>
                    <input
                      accept="audio/webm,audio/mp4,audio/mpeg,audio/wav"
                      className="block text-sm text-white/60"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (!file) {
                          return;
                        }
                        setVoiceIntro({
                          url: URL.createObjectURL(file),
                          mimeType: file.type,
                          name: file.name
                        });
                      }}
                      ref={voiceFileRef}
                      type="file"
                    />
                  </div>
                </div>
                {recordingVoice ? (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <MicrophoneLevel active level={micLevel} />
                    <p className="text-sm text-white/72">Mic live. The bars should move with your voice.</p>
                  </div>
                ) : null}
                {voiceIntro ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{voiceIntro.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">Profile voice intro</p>
                      </div>
                      <button
                        className="rounded-full border border-white/10 p-2 text-white/65 transition hover:text-white"
                        onClick={() => {
                          if (voiceFileRef.current) {
                            voiceFileRef.current.value = "";
                          }
                          setVoiceIntro(null);
                        }}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {voiceIntro.url ? <audio className="mt-3 w-full" controls preload="metadata" src={voiceIntro.url} /> : null}
                  </div>
                ) : null}
              </section>

              <label className="flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
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
          ) : null}
        </section>
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-300">{success}</p> : null}
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
