import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { getProfileHref } from "@/lib/identity";
import type { AIPersonaSummary } from "@/types/domain";

export function AIPersonaCard({
  persona,
  showFollowHint = false
}: {
  persona: AIPersonaSummary;
  showFollowHint?: boolean;
}) {
  const profileHref = getProfileHref(persona.username);

  return (
    <article className="panel-soft edge-light rounded-[28px] p-4 md:p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-[22px] md:h-20 md:w-20 md:rounded-[26px]" name={persona.displayName} src={persona.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-white">{persona.displayName}</p>
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-accent-soft">
              {persona.specialty}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/58">@{persona.username}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/62">
            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">{persona.category}</span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">{persona.personality}</span>
            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">{persona.followerCount} followers</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/72">
        {persona.bio || persona.description || "Always active, always ready to talk."}
      </p>

      {showFollowHint ? (
        <div className="mt-4 rounded-[22px] border border-accent/15 bg-accent/5 px-4 py-3 text-sm text-white/68">
          Follow to unlock a welcome DM and start the relationship.
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <FollowButton initialFollowing={persona.isFollowing} userId={persona.linkedUserId} />
        <Link
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.04]"
          href={`/messages/start?recipientId=${encodeURIComponent(persona.linkedUserId)}`}
        >
          <MessageCircle className="h-4 w-4 text-accent-soft" />
          Message
        </Link>
        {profileHref ? (
          <Link
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 transition hover:bg-white/[0.04]"
            href={profileHref}
          >
            <Sparkles className="h-4 w-4 text-accent-soft" />
            View profile
          </Link>
        ) : null}
      </div>
    </article>
  );
}
