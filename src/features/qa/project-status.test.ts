import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  checkStatusFile,
  compareStatus,
  extractStatusJson,
  readPreviousFromGit,
  validateStatus,
} from "../../../scripts/status/check-status.mjs";

// Organisation check only (docs/status-format.md): it does not prove that a task is really done.
const STATUS_FILE = path.join(process.cwd(), "docs", "project-status.md");

const BEGIN = "<!-- STATUS-DATA:BEGIN -->";
const END = "<!-- STATUS-DATA:END -->";
const FENCE = "```";

function wrap(json: unknown): string {
  return `${BEGIN}\n${FENCE}json\n${JSON.stringify(json)}\n${FENCE}\n${END}`;
}

const task = {
  id: "RAD-001",
  title: "t",
  status: "planned",
  priority: "low",
  description: "d",
  source_ref: "s",
};
const base = {
  project: "RAD-LAB",
  format_version: "1.0",
  revision: 1,
  updated_at: "2026-10-13T02:40:00Z",
  timezone: "UTC",
  next_id: "RAD-002",
  tasks: [task],
};

describe("docs/project-status.md", () => {
  it("is organised correctly", () => {
    expect(validateStatus(readFileSync(STATUS_FILE, "utf8"))).toEqual([]);
  });
});

describe("status validator", () => {
  it("accepts a minimal valid file", () => {
    expect(validateStatus(wrap(base))).toEqual([]);
  });

  it("reports a missing block, invalid JSON and duplicate ids", () => {
    expect(validateStatus("nothing")).toHaveLength(1);
    expect(validateStatus("<!-- STATUS-DATA:BEGIN -->\n```json\n{\n```\n<!-- STATUS-DATA:END -->")[0]).toMatch(/invalid JSON/);
    const dup = validateStatus(wrap({ ...base, next_id: "RAD-003", tasks: [task, { ...task }] }));
    expect(dup.some((e) => e.includes("duplicate id"))).toBe(true);
  });

  it("rejects unknown statuses and priorities", () => {
    const errors = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "finished", priority: "urgent" }] }));
    expect(errors.some((e) => e.includes("status"))).toBe(true);
    expect(errors.some((e) => e.includes("priority"))).toBe(true);
  });

  it("requires evidence for done, a reason for deferred and a blocker for blocked", () => {
    const done = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "done" }] }));
    expect(done.some((e) => e.includes("completion_evidence"))).toBe(true);
    const deferred = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "deferred" }] }));
    expect(deferred.some((e) => e.includes("defer_reason"))).toBe(true);
    const blocked = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "blocked" }] }));
    expect(blocked.some((e) => e.includes("blocker"))).toBe(true);
    const ok = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "done", completion_evidence: "e" }] }));
    expect(ok).toEqual([]);
  });

  it("keeps ids below next_id so an id is never reused", () => {
    expect(validateStatus(wrap({ ...base, next_id: "RAD-001" })).some((e) => e.includes("next_id"))).toBe(true);
  });

  it("rejects a revision below 1 and a time without an offset", () => {
    const errors = validateStatus(wrap({ ...base, revision: 0, updated_at: "2026-10-13T02:40:00" }));
    expect(errors.some((e) => e.includes("revision"))).toBe(true);
    expect(errors.some((e) => e.includes("updated_at"))).toBe(true);
  });
});

describe("STATUS-DATA block extraction", () => {
  const block = `${FENCE}json\n${JSON.stringify(base)}\n${FENCE}`;

  it("allows a summary and history outside the markers and blank lines inside", () => {
    const md = `# summary\n\ntext\n\n${BEGIN}\n\n${block}\n\n${END}\n\n## history\n| a | b |\n`;
    expect(validateStatus(md)).toEqual([]);
  });

  it("rejects repeated markers", () => {
    expect(extractStatusJson(`${BEGIN}\n${block}\n${END}\n${END}`).error).toMatch(/more than one .*END/);
    expect(extractStatusJson(`${BEGIN}\n${BEGIN}\n${block}\n${END}`).error).toMatch(/more than one .*BEGIN/);
    expect(extractStatusJson(`${BEGIN}\n${block}\n${END}\n${BEGIN}\n${block}\n${END}`).error).toMatch(/more than one/);
  });

  it("rejects markers in the wrong order or missing", () => {
    expect(extractStatusJson(`${END}\n${block}\n${BEGIN}`).error).toMatch(/before/);
    expect(extractStatusJson(`${BEGIN}\n${block}`).error).toMatch(/missing/);
    expect(extractStatusJson(`${block}\n${END}`).error).toMatch(/missing/);
  });

  it("rejects a second JSON block", () => {
    const errors = validateStatus(`${BEGIN}\n${block}\n\n${block}\n${END}`);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/extra content after/);
  });

  it("rejects extra text before or after the block inside the section", () => {
    expect(validateStatus(`${BEGIN}\nnote\n${block}\n${END}`)[0]).toMatch(/before/);
    expect(validateStatus(`${BEGIN}\n${block}\nnote\n${END}`)[0]).toMatch(/extra content after/);
    expect(validateStatus(`${BEGIN}\n<!-- c -->\n${block}\n${END}`)[0]).toMatch(/before/);
  });

  it("rejects an empty section and an unclosed fence", () => {
    expect(validateStatus(`${BEGIN}\n\n${END}`)[0]).toMatch(/no .*json/);
    expect(validateStatus(`${BEGIN}\n${FENCE}json\n{}\n${END}`)[0]).toMatch(/not closed/);
  });
});

describe("status transition (previous -> new)", () => {
  const t2 = { ...task, id: "RAD-002", title: "second" };
  const prev = { ...base, revision: 3, next_id: "RAD-003", tasks: [task, t2] };
  const later = "2026-10-14T09:00:00Z";
  const run = (next: unknown, previous: unknown = prev) => compareStatus(wrap(previous), wrap(next));

  it("accepts a valid transition: new task from next_id, revision and time bumped", () => {
    const next = {
      ...prev,
      revision: 4,
      updated_at: later,
      next_id: "RAD-004",
      tasks: [task, { ...t2, status: "in_progress" }, { ...task, id: "RAD-003", title: "third" }],
    };
    expect(run(next)).toEqual([]);
  });

  it("accepts an unchanged status, even with revision and time kept", () => {
    expect(run({ ...prev })).toEqual([]);
  });

  it("accepts a title change (not id reuse) with revision and time bumped", () => {
    const next = { ...prev, revision: 4, updated_at: later, tasks: [{ ...task, title: "renamed" }, t2] };
    expect(run(next)).toEqual([]);
  });

  it("rejects deleting a task", () => {
    const errors = run({ ...prev, revision: 4, updated_at: later, tasks: [task] });
    expect(errors.some((e) => e.includes("RAD-002") && e.includes("deleted"))).toBe(true);
  });

  it("rejects next_id going back", () => {
    const errors = run({ ...prev, revision: 4, updated_at: later, next_id: "RAD-002" });
    expect(errors.some((e) => e.includes("next_id went back"))).toBe(true);
  });

  it("rejects revision going back and time going back", () => {
    const errors = run({ ...prev, revision: 2, updated_at: "2026-10-12T00:00:00Z" });
    expect(errors.some((e) => e.includes("revision went back"))).toBe(true);
    expect(errors.some((e) => e.includes("updated_at went back"))).toBe(true);
  });

  it("rejects a new task that takes a number below the previous counter", () => {
    // the previous status had issued numbers up to RAD-004 (next_id RAD-005), so RAD-003 is not free to take
    const previous = { ...prev, next_id: "RAD-005" };
    const next = { ...previous, revision: 4, updated_at: later, next_id: "RAD-006", tasks: [task, t2, { ...task, id: "RAD-003", title: "reused" }] };
    const errors = run(next, previous);
    expect(errors.some((e) => e.includes("RAD-003") && e.includes("below the previous next_id"))).toBe(true);
  });

  it("rejects changed tasks without a new revision or time", () => {
    const changed = { ...prev, tasks: [{ ...task, status: "in_progress" }, t2] };
    const errors = run(changed);
    expect(errors.some((e) => e.includes("revision was not increased"))).toBe(true);
    expect(errors.some((e) => e.includes("updated_at was not updated"))).toBe(true);
    const onlyRevision = run({ ...changed, revision: 4 });
    expect(onlyRevision.some((e) => e.includes("revision"))).toBe(false);
    expect(onlyRevision.some((e) => e.includes("updated_at was not updated"))).toBe(true);
    const onlyTime = run({ ...changed, updated_at: later });
    expect(onlyTime.some((e) => e.includes("revision was not increased"))).toBe(true);
    expect(onlyTime.some((e) => e.includes("updated_at"))).toBe(false);
  });

  it("treats a changed counter as a data change", () => {
    expect(run({ ...prev, next_id: "RAD-004" }).some((e) => e.includes("revision was not increased"))).toBe(true);
  });

  it("does not skip an unreadable previous or new status", () => {
    expect(compareStatus("nothing", wrap(prev))[0]).toMatch(/^previous status/);
    expect(compareStatus(wrap(prev), `${BEGIN}\n${FENCE}json\n{\n${FENCE}\n${END}`)[0]).toMatch(/^new status: invalid JSON/);
  });
});

describe("status transition from git", () => {
  const dirs: string[] = [];
  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });
  const git = (cwd: string, ...args: string[]) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  function repo(): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), "status-git-"));
    dirs.push(dir);
    git(dir, "init", "-q", "-b", "main");
    mkdirSync(path.join(dir, "docs"));
    writeFileSync(path.join(dir, "README.md"), "x");
    git(dir, "add", ".");
    git(dir, "commit", "-q", "-m", "init");
    return dir;
  }
  const file = "docs/project-status.md";

  it("uses the fork point: the file absent there means initial setup (structure only, stated)", () => {
    const dir = repo();
    git(dir, "checkout", "-q", "-b", "feature");
    writeFileSync(path.join(dir, file), wrap(base));
    const result = checkStatusFile(path.join(dir, file), { base: "main", cwd: dir });
    expect(result.errors).toEqual([]);
    expect(result.notes.join(" ")).toMatch(/initial setup/);
    expect(checkStatusFile(path.join(dir, file), { base: "main", cwd: dir, requirePrevious: true }).errors[0]).toMatch(/--require-previous/);
  });

  it("compares with the status at the fork point, not with the latest target branch", () => {
    const dir = repo();
    writeFileSync(path.join(dir, file), wrap(base));
    git(dir, "add", ".");
    git(dir, "commit", "-q", "-m", "status");
    git(dir, "checkout", "-q", "-b", "feature");
    // the target branch moves on after the fork; that must not matter
    git(dir, "checkout", "-q", "main");
    writeFileSync(path.join(dir, file), wrap({ ...base, revision: 9, next_id: "RAD-009" }));
    git(dir, "commit", "-q", "-am", "main moves");
    git(dir, "checkout", "-q", "feature");

    const bad = { ...base, tasks: [{ ...task, status: "in_progress" }] }; // data changed, revision/time kept
    writeFileSync(path.join(dir, file), wrap(bad));
    const failing = checkStatusFile(path.join(dir, file), { base: "main", cwd: dir });
    expect(failing.errors.some((e) => e.includes("revision was not increased"))).toBe(true);

    const good = { ...bad, revision: 2, updated_at: "2026-10-14T09:00:00Z" };
    writeFileSync(path.join(dir, file), wrap(good));
    expect(checkStatusFile(path.join(dir, file), { base: "main", cwd: dir }).errors).toEqual([]);
  });

  it("takes the fork point from an explicit head (CI tests a merge commit, not the PR head)", () => {
    const dir = repo();
    writeFileSync(path.join(dir, file), wrap(base));
    git(dir, "add", ".");
    git(dir, "commit", "-q", "-m", "status");
    const forkSha = git(dir, "rev-parse", "HEAD").trim();
    git(dir, "checkout", "-q", "-b", "feature");
    writeFileSync(path.join(dir, file), wrap({ ...base, revision: 2, updated_at: "2026-10-14T09:00:00Z", tasks: [{ ...task, status: "in_progress" }] }));
    git(dir, "commit", "-q", "-am", "pr");
    const headSha = git(dir, "rev-parse", "HEAD").trim();
    git(dir, "checkout", "-q", "main");
    writeFileSync(path.join(dir, "other.md"), "y");
    git(dir, "add", ".");
    git(dir, "commit", "-q", "-m", "main moves");
    git(dir, "merge", "-q", "--no-ff", "-m", "merge ref", "feature"); // HEAD = merge commit, like Actions
    expect(readPreviousFromGit("main~1", file, dir, headSha).base).toBe(forkSha);
    expect(readPreviousFromGit("main~1", file, dir).base).not.toBe(forkSha); // HEAD = merge commit: wrong without --head
    expect(checkStatusFile(path.join(dir, file), { base: "main~1", head: headSha, cwd: dir }).errors).toEqual([]);
  });

  it("fails loudly when the fork point cannot be determined", () => {
    const dir = repo();
    writeFileSync(path.join(dir, file), wrap(base));
    expect(readPreviousFromGit("no-such-ref", file, dir).error).toMatch(/cannot determine the fork point/);
    expect(checkStatusFile(path.join(dir, file), { base: "no-such-ref", cwd: dir }).errors[0]).toMatch(/cannot determine the fork point/);
  });

  it("fails loudly when the previous file cannot be read", () => {
    const dir = repo();
    writeFileSync(path.join(dir, file), wrap(base));
    expect(checkStatusFile(path.join(dir, file), { previousFile: path.join(dir, "missing.md") }).errors[0]).toMatch(/cannot read previous file/);
  });
});
