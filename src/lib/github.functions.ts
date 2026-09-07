import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/github";

export type Repo = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  updatedAt: string;
  htmlUrl: string;
};

export type Issue = {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  createdAt: string;
  comments: number;
};

async function gatewayGet(path: string): Promise<unknown> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const githubKey = process.env["GITHUB_API_KEY"];
  if (!lovableKey || !githubKey) {
    throw new Error("GitHub is not connected yet.");
  }

  const response = await fetch(`${GATEWAY_URL}/${path}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": githubKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`GitHub gateway request failed [${response.status}]: ${body}`);
    if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub is busy right now (rate limit reached). Try again in a few minutes.");
    }
    throw new Error(`GitHub request failed [${response.status}]: ${body}`);
  }

  return response.json();
}

/** Repositories belonging to the connected GitHub account, most recently updated first. */
export const listRepos = createServerFn({ method: "GET" }).handler(async (): Promise<Repo[]> => {
  const raw = (await gatewayGet("user/repos?per_page=50&sort=updated&affiliation=owner,collaborator,organization_member")) as Array<
    Record<string, unknown>
  >;

  return raw.map((r) => ({
    id: Number(r["id"]),
    name: String(r["name"]),
    fullName: String(r["full_name"]),
    description: (r["description"] as string | null) ?? null,
    private: Boolean(r["private"]),
    updatedAt: String(r["updated_at"] ?? ""),
    htmlUrl: String(r["html_url"] ?? ""),
  }));
});

/** Open issues for one repository. */
export const listIssues = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ owner: z.string().min(1), repo: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }): Promise<Issue[]> => {
    const raw = (await gatewayGet(
      `repos/${encodeURIComponent(data.owner)}/${encodeURIComponent(data.repo)}/issues?state=open&per_page=30`,
    )) as Array<Record<string, unknown>>;

    return raw
      .filter((i) => !i["pull_request"])
      .map((i) => ({
        id: Number(i["id"]),
        number: Number(i["number"]),
        title: String(i["title"]),
        htmlUrl: String(i["html_url"] ?? ""),
        createdAt: String(i["created_at"] ?? ""),
        comments: Number(i["comments"] ?? 0),
      }));
  });
