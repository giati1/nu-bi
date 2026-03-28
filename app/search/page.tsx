import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { getViewer } from "@/lib/auth/session";
import { searchAll } from "@/lib/db/repository";

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const viewer = await getViewer();
  if (!viewer) {
    return null;
  }
  const query = searchParams.q?.trim() ?? "";
  const results = query ? await searchAll(query, viewer.id) : { users: [], posts: [] };

  return (
    <AppShell
      subtitle="Search users by identity and posts by text. Built for lightweight local search now and D1-backed extension later."
      title="Search"
    >
      <form action="/search" className="glass-panel rounded-[28px] p-4">
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 outline-none focus:border-accent"
          defaultValue={query}
          name="q"
          placeholder="Search users, bios, or posts"
        />
      </form>
      {!query ? (
        <EmptyState
          description="Search creators, profiles, or specific post text."
          title="Start with a name, keyword, or idea"
        />
      ) : (
        <>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Users</p>
            <div className="mt-4 grid gap-3">
              {results.users.map((user) => (
                <Link
                  className="flex items-center gap-3 rounded-2xl border border-white/10 p-4"
                  href={`/profile/${user.username}`}
                  key={user.id}
                >
                  <Avatar className="h-12 w-12" name={user.displayName} src={user.avatarUrl} />
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-white/50">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            {results.posts.map((post) => (
              <PostCard key={post.id} post={post} viewerId={viewer.id} />
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}
