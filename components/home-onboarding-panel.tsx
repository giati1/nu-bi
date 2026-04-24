"use client";

import Link from "next/link";
import { Compass, PenSquare, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { InterestPicker } from "@/components/interest-picker";
import type { OnboardingSummary, UserSummary } from "@/types/domain";

export function HomeOnboardingPanel({
  summary,
  suggestions,
  interests,
  viewerUsername
}: {
  summary: OnboardingSummary;
  suggestions: UserSummary[];
  interests: string[];
  viewerUsername: string;
}) {
  const steps = [
    {
      label: "Finish your profile",
      done: summary.profileScore === 3,
      href: "/settings/profile",
      description: "Add a photo, a real bio, and one extra detail so people know who you are.",
      Icon: UserRound,
      cta: "Open profile"
    },
    {
      label: "Tune your interests",
      done: summary.interestCount >= 3,
      href: "/explore",
      description: "Pick a few topics so discovery and suggestions stop feeling random.",
      Icon: Compass,
      cta: "Explore interests"
    },
    {
      label: "Publish your first post",
      done: summary.publishedPostCount >= 1,
      href: "/creator#post-composer",
      description: "A short text post is enough. You do not need a perfect launch piece.",
      Icon: PenSquare,
      cta: "Create post"
    }
  ];

  const completedSteps = steps.filter((step) => step.done).length;

  if (completedSteps === steps.length && summary.followingCount >= 3) {
    return null;
  }

  return (
    <section className="panel-soft edge-light overflow-hidden rounded-[28px] p-4 md:rounded-[30px] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Get started</p>
          <h3 className="mt-2 text-xl font-semibold text-white md:mt-3 md:text-2xl">Get set up in three steps</h3>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/60 md:text-sm md:leading-6 md:text-white/64">
            Add your profile details, choose a few interests, and share your first post.
          </p>
        </div>
        <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-accent-soft">
          {completedSteps}/{steps.length} core steps done
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="grid gap-3">
          {steps.map(({ label, done, href, description, Icon, cta }) => (
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3.5 md:rounded-[24px] md:p-4" key={label}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-white/[0.05] p-2.5 md:p-3">
                    <Icon className="h-4 w-4 text-accent-soft" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white md:text-base">{label}</p>
                    <p className="mt-1.5 text-xs leading-5 text-white/58 md:mt-2 md:text-sm md:leading-6 md:text-white/62">{description}</p>
                  </div>
                </div>
                <div
                  className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    done ? "bg-accent text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  {done ? "Done" : "Next"}
                </div>
              </div>
              {!done ? (
                <div className="mt-3 md:mt-4">
                  <Link className="inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black md:py-3" href={href}>
                    {cta}
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-3.5 md:rounded-[24px] md:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">Interests</p>
                <p className="mt-1 text-xs text-white/56 md:text-sm md:text-white/58">Pick at least three to improve what you see in your feed.</p>
              </div>
              <Link className="text-xs uppercase tracking-[0.16em] text-white/50 hover:text-white" href="/explore">
                Open explore
              </Link>
            </div>
            <div className="mt-4">
              <InterestPicker active={interests} />
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-black/20 p-3.5 md:rounded-[24px] md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Suggested people to follow</p>
              <p className="mt-1 text-xs text-white/56 md:text-sm md:text-white/58">Follow a few people to get your feed going.</p>
            </div>
            <Link className="text-xs uppercase tracking-[0.16em] text-white/50 hover:text-white" href={`/profile/${viewerUsername}`}>
              View profile
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {suggestions.slice(0, 3).map((user) => (
              <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-3" key={user.id}>
                <Link className="flex min-w-0 flex-1 items-center gap-3" href={`/profile/${user.username}`}>
                  <Avatar className="h-11 w-11" name={user.displayName} src={user.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user.displayName}</p>
                    <p className="truncate text-sm text-white/55">@{user.username}</p>
                    <p className="truncate text-xs text-white/45 md:text-sm">{user.bio || "Open profile and see what they post."}</p>
                  </div>
                </Link>
                <FollowButton initialFollowing={false} userId={user.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
