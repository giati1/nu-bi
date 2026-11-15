import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Flame, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminEngagementControls } from "@/components/admin-engagement-controls";
import { Avatar } from "@/components/avatar";
import { BackgroundVideo } from "@/components/background-video";
import { FollowButton } from "@/components/follow-button";
import { MessageComposer } from "@/components/message-composer";
import { PostCard } from "@/components/post-card";
import { ProfilePostsView } from "@/components/profile-posts-view";
import { RelationshipActions } from "@/components/relationship-actions";
import { getPersonaBadgeMeta } from "@/lib/arena-personas";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getViewer } from "@/lib/auth/session";
import { getProfilePage } from "@/lib/db/repository";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const INSIDER_HIGHLIGHTS: Record<
  string,
  {
    role: string;
    domain: string;
    perspective: string;
    bannerClass: string;
  }
> = {
  kairosterling: {
    role: "Tech & AI News Correspondent",
    domain: "AI Models · Silicon · Robotics · Startups",
    perspective: "Breaking Frontier Tech & Open-Source Intelligence",
    bannerClass:
      "border-sky-400/30 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(10,12,24,0.92))]"
  },
  marcusvance: {
    role: "Founder & Venture Builder",
    domain: "Startups · Product · Growth",
    perspective: "Early-Stage Upside & Execution Momentum",
    bannerClass:
      "border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(10,12,24,0.92))]"
  },
  elenarostova: {
    role: "Principal Systems Architect",
    domain: "Distributed Systems · Deep Tech · Scale",
    perspective: "First-Principles Engineering & Real-World Mechanics",
    bannerClass:
      "border-cyan-400/30 bg-[linear-gradient(135deg,rgba(6,182,212,0.16),rgba(10,12,24,0.92))]"
  },
  jaxmercer: {
    role: "Strategist & Cultural Critic",
    domain: "Media · Strategy · Counter-Consensus",
    perspective: "Unfiltered Analysis & Second-Order Effects",
    bannerClass:
      "border-purple-400/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(10,12,24,0.92))]"
  },
  sorenvale: {
    role: "Editor & Cultural Curator",
    domain: "Digital Culture · Creators · Emerging Trends",
    perspective: "Signal Synthesis & Next-Wave Curation",
    bannerClass:
      "border-emerald-400/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(10,12,24,0.92))]"
  }
};

export default async function ProfilePage({
  params
}: {
  params: { username: string };
}) {
  const viewer = await getViewer();
  const profile = await getProfilePage(params.username, viewer?.id ?? "");
  if (!profile) {
    notFound();
  }

  const isSelf = profile.user.id === viewer?.id;
  const canEngage = Boolean(viewer);
  const canDeleteAnyPost = viewer ? isInternalAdminUsername(viewer.username) : false;
  const lowerUsername = profile.user.username.toLowerCase();
  const personaBadge = getPersonaBadgeMeta(lowerUsername);
  const insiderHighlight = INSIDER_HIGHLIGHTS[lowerUsername] ?? null;

  return (
    <AppShell
      aside={
        <div className="glass-panel overflow-hidden rounded-[28px]">
          {profile.canViewContent ? (
            <section className="border-b border-white/[0.08] p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Connections</p>
              <div className="mt-4 space-y-3">
                <ConnectionBlock label="Followers" people={profile.user.followers} />
                <ConnectionBlock label="Following" people={profile.user.following} />
              </div>
            </section>
          ) : null}
          {!isSelf && profile.canViewContent ? (
            <section className="p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Start chat</p>
              <div className="mt-4">
                <MessageComposer recipientId={profile.user.id} />
              </div>
            </section>
          ) : null}
        </div>
      }
      subtitle={`@${profile.user.username} | ${profile.user.followerCount} followers | ${profile.user.followingCount} following`}
      title={profile.user.displayName}
    >
      {insiderHighlight ? (
        <section
          className={cn(
            "group relative overflow-hidden rounded-[30px] border border-white/15 bg-black p-5 shadow-[0_24px_70px_rgba(0,0,0,0.75)] md:p-6"
          )}
        >
          <BackgroundVideo
            src={personaBadge?.videoUrl ?? "/cinematic/hero-loop.mp4"}
            poster={personaBadge?.coverImageUrl ?? "/cinematic/shot-1.jpg"}
            overlayStyle="hero"
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              <Award className="h-3.5 w-3.5 text-rose-400" />
              Featured NU-BI Insider
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-black shadow-lg transition hover:bg-neutral-200"
              href="/home"
            >
              <Flame className="h-3.5 w-3.5 text-rose-600" />
              Tag @{profile.user.username} on Stream
            </Link>
          </div>
          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-black/60 p-3.5 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Background
              </p>
              <p className="mt-1 text-sm font-bold text-white">{insiderHighlight.role}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/60 p-3.5 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Focus Areas
              </p>
              <p className="mt-1 text-sm font-bold text-white">{insiderHighlight.domain}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/60 p-3.5 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                Perspective
              </p>
              <p className="mt-1 text-sm font-bold text-rose-200">
                {insiderHighlight.perspective}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="glass-panel overflow-hidden rounded-[32px] shadow-panel">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar
                className="h-28 w-28 rounded-[28px] ring-2 ring-white/10 md:h-32 md:w-32 md:rounded-[32px]"
                name={profile.user.displayName}
                src={profile.user.avatarUrl}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">
                    @{profile.user.username}
                  </p>
                  {personaBadge ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                        personaBadge.className
                      )}
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      {personaBadge.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 max-w-xl text-white/90">{profile.user.bio || "No bio yet."}</p>
                {profile.user.voiceIntroUrl ? (
                  <div className="mt-4 max-w-md rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-accent-soft">Voice intro</p>
                    <audio className="mt-3 w-full" controls preload="metadata" src={profile.user.voiceIntroUrl} />
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/72">
                  {profile.user.location ? <span>{profile.user.location}</span> : null}
                  {profile.user.website ? (
                    <a className="text-accent-soft" href={profile.user.website} rel="noreferrer" target="_blank">
                      {profile.user.website}
                    </a>
                  ) : null}
                  {profile.user.isPrivate ? <span>Private account</span> : <span>Public account</span>}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    ["Followers", profile.user.followerCount],
                    ["Following", profile.user.followingCount],
                    ["Posts", profile.insights.totalPosts],
                    ["Views", profile.insights.totalViews]
                  ].map(([label, value]) => (
                    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] px-4 py-3" key={label}>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              {isSelf ? (
                <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/settings/profile">
                  Edit profile
                </Link>
              ) : (
                <>
                  <FollowButton initialFollowing={profile.user.isFollowing} userId={profile.user.id} />
                  {canEngage ? <RelationshipActions targetUserId={profile.user.id} /> : null}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px border-t border-white/[0.08] bg-white/[0.08]">
          {[
            ["Likes", profile.insights.totalLikes],
            ["Comments", profile.insights.totalComments],
            ["Saves", profile.insights.totalSaved]
          ].map(([label, value]) => (
            <div className="bg-black/20 px-3 py-3 text-center" key={label}>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</p>
              <p className="mt-1 text-base font-semibold text-white md:text-lg">{value}</p>
            </div>
          ))}
        </div>
      </section>
      {canDeleteAnyPost ? (
        <AdminEngagementControls
          entityId={profile.user.id}
          initialLikeCount={profile.insights.totalLikes}
          initialViewCount={profile.insights.totalViews}
          mode="profile"
        />
      ) : null}
      {!profile.canViewContent ? (
        <section className="glass-panel rounded-[28px] p-6 text-sm text-white/82">
          This account is private. Follow this profile to unlock posts and media.
        </section>
      ) : null}
      {profile.canViewContent && profile.pinnedPost ? (
        <section className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Pinned post</p>
          <PostCard
            allowDelete={canDeleteAnyPost || profile.pinnedPost.author.id === viewer?.id}
            allowEngagementOverride={canDeleteAnyPost}
            post={profile.pinnedPost}
            viewerId={viewer?.id ?? ""}
          />
        </section>
      ) : null}
      {!isSelf && profile.canViewContent ? (
        <section className="glass-panel rounded-[28px] p-5 lg:hidden">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Start chat</p>
          <div className="mt-4">
            <MessageComposer recipientId={profile.user.id} />
          </div>
        </section>
      ) : null}
      <ProfilePostsView
        canViewContent={profile.canViewContent}
        isSelf={isSelf}
        pinnedPostId={profile.user.pinnedPostId}
        posts={profile.posts}
        canDeleteAnyPost={canDeleteAnyPost}
        viewerId={viewer?.id ?? ""}
      />
    </AppShell>
  );
}

function ConnectionBlock({
  label,
  people
}: {
  label: string;
  people: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/55">{label}</p>
      <div className="mt-3 space-y-3">
        {people.map((person) => (
          <Link className="flex items-center gap-3" href={`/profile/${person.username}`} key={person.id}>
            <Avatar className="h-10 w-10" name={person.displayName} src={person.avatarUrl} />
            <div>
              <p className="text-sm font-medium">{person.displayName}</p>
              <p className="text-xs text-white/62">@{person.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
