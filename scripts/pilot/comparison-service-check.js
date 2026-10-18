// Owner-operated READ-ONLY console procedure for the NEW comparison RPC.
// Run after its separately authorised migration and catalogue checks, on a laptop.
// Does not create attempts, configure an admin connection or attest deployment.
/* global location, localStorage, prompt */
(async () => {
  const project = "https://vlacestfruxooznrcjqc.supabase.co";
  const rpc = "/rest/v1/rpc/training_page_v1_with_comparison";
  const checks = [];
  let stage = "setup";
  class Failure extends Error {
    constructor(code, status = 0) { super(code); this.safeCode = code; this.status = status; }
  }
  const require = (condition, code) => { if (!condition) throw new Failure(code); };
  const uuid = (v) => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
  const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const text = (v) => typeof v === "string" && v.length > 0;
  const finite = (v) => typeof v === "number" && Number.isFinite(v);
  const count = (v) => Number.isSafeInteger(v) && v >= 0;
  const stamp = (v) => text(v) && Number.isFinite(Date.parse(v));
  try {
    require(location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname), "OPEN_SIGNED_IN_APPLICATION");
    const session = JSON.parse(localStorage.getItem("sb-vlacestfruxooznrcjqc-auth-token") ?? "null");
    require(text(session?.access_token) && uuid(session?.user?.id), "SIGN_IN_ON_THIS_BROWSER_FIRST");
    const key = prompt("RAD-LAB comparison check: public sb_publishable_ key for rad-lab-pilot only. Never enter a password or secret key.")?.trim();
    require(typeof key === "string" && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key), "PUBLIC_KEY_REQUIRED");
    const input = prompt("UUID of the OTHER account (owner <-> participant). Keep account IDs locally; do not send them in chat.");
    require(typeof input === "string", "OTHER_ACCOUNT_INPUT_CANCELLED");
    const other = input.trim().toLowerCase();
    require(uuid(other), "OTHER_ACCOUNT_UUID_INVALID");
    require(other !== session.user.id.toLowerCase(), "OTHER_ACCOUNT_MATCHES_CURRENT_SESSION");
    const request = async (name, path, body) => {
      stage = name;
      const r = await fetch(`${project}${path}`, { method: body ? "POST" : "GET", credentials: "omit", redirect: "error", cache: "no-store",
        headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
      return { ok: r.ok, status: r.status, data: await r.json() };
    };
    const success = (r) => {
      if (!r.ok) throw new Failure("SERVICE_REQUEST_FAILED", r.status);
      checks.push(stage); return r.data;
    };
    const args = (view, scope, user, exam = null) => ({ p_view: view, p_scope: scope, p_user: user, p_exam: exam,
      p_search: "", p_status: "", p_days: null, p_cursor: null, p_boundary: null, p_limit: 1 });
    const pageValid = (p) => object(p) && p.version === 1 && stamp(p.boundary) && Array.isArray(p.rows) && p.rows.length <= 1
      && (p.next === null || (object(p.next) && Object.values(p.next).every(text)));
    const read = async (name, view, scope, user, exam) => {
      const p = success(await request(name, rpc, args(view, scope, user, exam)));
      require(pageValid(p), "INVALID_COMPARISON_PAGE"); return p;
    };
    const summary = async (name, scope, user) => {
      const p = await read(name, "summary", scope, user);
      require(p.rows.length === 0 && p.next === null && object(p.summary) && count(p.summary.attempts) && count(p.summary.exams)
        && (p.summary.trainees === null || count(p.summary.trainees)), "INVALID_COMPARISON_SUMMARY");
    };
    const denied = async (name, view, scope, user, exam) => {
      const r = await request(name, rpc, args(view, scope, user, exam));
      require(r.status === 403 && r.data?.code === "42501", "CROSS_SCOPE_NOT_EXPLICITLY_DENIED"); checks.push(stage);
    };
    const user = success(await request("auth_user", "/auth/v1/user"));
    require(uuid(user?.id) && user.id === session.user.id, "AUTH_IDENTITY_MISMATCH");
    const profiles = success(await request("own_profile", `/rest/v1/profiles?select=status,role&user_id=eq.${user.id}&limit=1`));
    require(Array.isArray(profiles) && profiles.length === 1 && profiles[0].status === "approved"
      && ["owner", "participant"].includes(profiles[0].role), "APPROVED_PROFILE_REQUIRED");
    const role = profiles[0].role;
    await summary("own_comparison_summary", "own", user.id);
    if (role === "owner") {
      const target = success(await request("existing_approved_participant", `/rest/v1/profiles?select=user_id,status,role&user_id=eq.${other}&limit=1`));
      require(Array.isArray(target) && target.length === 1 && target[0].user_id === other
        && target[0].status === "approved" && target[0].role === "participant", "EXISTING_APPROVED_PARTICIPANT_REQUIRED");
      await summary("owner_all_comparison_summary", "all", null);
      await summary("owner_selected_comparison_summary", "all", other);
    } else {
      await denied("participant_other_summary_denied", "summary", "own", other);
      await denied("participant_all_summary_denied", "summary", "all", null);
    }
    const scope = role === "owner" ? "all" : "own", target = role === "owner" ? other : user.id;
    const exams = await read("comparison_exams", "exams", scope, target);
    require(exams.rows.length === 1 && object(exams.rows[0]) && text(exams.rows[0].exam) && exams.rows[0].exam.length <= 80, "SAVED_ATTEMPT_REQUIRED");
    const history = await read("comparison_history", "history", scope, target, exams.rows[0].exam);
    require(history.rows.length === 1, "SAVED_ATTEMPT_REQUIRED");
    const row = history.rows[0];
    require(object(row), "INVALID_SAVED_RESULT");
    const result = row.result;
    require(uuid(row.id) && row.exam === exams.rows[0].exam && [row.case,row.definition,row.engine,row.producer].every(text)
      && row.format === 1 && stamp(row.time) && Object.hasOwn(row, "comparison"), "COMPARISON_FIELD_OR_CONTRACT_MISSING");
    require(row.comparison === null || (text(row.comparison) && row.comparison.trim() === row.comparison && row.comparison.length <= 100
      && /^radlab-comparison\/[1-9][0-9]*:[0-9a-f]{64}$/.test(row.comparison)), "INVALID_COMPARISON_IDENTITY");
    require(object(result) && finite(result.total) && typeof result.passed === "boolean" && Array.isArray(result.critical)
      && result.critical.every(text) && Array.isArray(result.categories)
      && result.categories.every((c) => object(c) && text(c.c) && finite(c.earned) && finite(c.weight)), "INVALID_SAVED_RESULT");
    if (role === "participant") {
      await denied("participant_other_history_denied", "history", "own", other, row.exam);
      await denied("participant_all_history_denied", "history", "all", other, row.exam);
    }
    stage = "pair_digest";
    const bytes = new TextEncoder().encode([project,...[user.id.toLowerCase(),other].sort()].join("\n"));
    const pair = [...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map((v) => v.toString(16).padStart(2,"0")).join("");
    // A NULL historical witness proves field availability, never fresh writer provenance.
    const witness = row.comparison === null ? "historical-null" : row.comparison.startsWith("radlab-comparison/1:") ? "identity-v1" : "future-identity";
    console.log("RADLAB_COMPARISON_SERVICE_CHECK " + JSON.stringify({version:1,contract:"practice-comparison/1",role,pair,outcome:"PASS",witness,checks,at:new Date().toISOString()}));
  } catch (error) {
    console.log("RADLAB_COMPARISON_SERVICE_CHECK " + JSON.stringify({version:1,contract:"practice-comparison/1",outcome:"STOP",stage,
      code:error instanceof Failure ? error.safeCode : "LOCAL_OR_NETWORK_FAILURE",status:error instanceof Failure ? error.status : 0,at:new Date().toISOString()}));
  }
})();
