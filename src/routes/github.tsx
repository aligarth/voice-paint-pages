import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Github, Lock, MessageSquare, Unlock } from "lucide-react";
import { listIssues, listRepos } from "@/lib/github.functions";

export const Route = createFileRoute("/github")({
  head: () => ({
    meta: [
      { title: "GitHub — Color My World" },
      {
        name: "description",
        content:
          "See the repositories on your connected GitHub account and peek at the open issues in any of them, right inside Color My World.",
      },
      { property: "og:title", content: "GitHub — Color My World" },
      {
        property: "og:description",
        content: "Browse your GitHub repositories and their open issues from inside Color My World.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GithubPage,
});

function friendly(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (text.includes("not connected")) return "GitHub isn't connected yet.";
  if (text.toLowerCase().includes("rate limit")) return text;
  return "We couldn't reach GitHub just now. Please try again.";
}

function GithubPage() {
  const fetchRepos = useServerFn(listRepos);
  const fetchIssues = useServerFn(listIssues);
  const [open, setOpen] = useState<{ owner: string; repo: string; fullName: string } | null>(null);

  const repos = useQuery({ queryKey: ["gh-repos"], queryFn: () => fetchRepos() });
  const issues = useQuery({
    queryKey: ["gh-issues", open?.fullName],
    queryFn: () => fetchIssues({ data: { owner: open!.owner, repo: open!.repo } }),
    enabled: !!open,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <Link to="/" className="btn-crayon mb-5 inline-flex text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="flex items-center gap-2 text-3xl font-extrabold">
          <Github className="h-7 w-7" /> GitHub
        </h1>
        <p className="mt-2 text-muted-foreground">
          The projects on your connected GitHub account. Tap one to see what still needs doing.
        </p>
      </header>

      {repos.isLoading && <p className="text-muted-foreground">Loading your projects…</p>}
      {repos.isError && <p className="font-bold text-destructive">{friendly(repos.error)}</p>}
      {repos.data?.length === 0 && (
        <p className="text-muted-foreground">This account doesn't have any projects yet.</p>
      )}

      <ul className="space-y-3">
        {repos.data?.map((repo) => {
          const [owner, name] = repo.fullName.split("/");
          const isOpen = open?.fullName === repo.fullName;
          return (
            <li key={repo.id} className="paper-card p-4">
              <button
                type="button"
                onClick={() =>
                  setOpen(isOpen ? null : { owner: owner ?? "", repo: name ?? repo.name, fullName: repo.fullName })
                }
                className="w-full text-left"
                aria-expanded={isOpen}
              >
                <span className="flex flex-wrap items-center gap-2 font-extrabold">
                  {repo.private ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {repo.fullName}
                  <span className="rounded-full border-2 border-border px-2 py-0.5 text-xs font-bold">
                    {repo.private ? "Private" : "Public"}
                  </span>
                </span>
                {repo.description && (
                  <span className="mt-1 block text-sm text-muted-foreground">{repo.description}</span>
                )}
                {repo.updatedAt && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Updated {new Date(repo.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="mt-4 border-t-2 border-border pt-3">
                  {issues.isLoading && <p className="text-sm text-muted-foreground">Loading open items…</p>}
                  {issues.isError && (
                    <p className="text-sm font-bold text-destructive">{friendly(issues.error)}</p>
                  )}
                  {issues.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nothing open here — all clear.</p>
                  )}
                  <ul className="space-y-2">
                    {issues.data?.map((issue) => (
                      <li key={issue.id} className="text-sm">
                        <a
                          href={issue.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 font-bold underline underline-offset-4"
                        >
                          #{issue.number} {issue.title}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" /> {issue.comments}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
