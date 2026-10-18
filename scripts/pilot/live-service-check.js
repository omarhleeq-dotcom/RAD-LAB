// Owner-operated browser console procedure, NOT an application script or automatic attestation.
// Read-only against the explicitly matched production project. No password/token is prompted or logged.
/* global location, localStorage, prompt */
(async () => {
  const project = "https://vlacestfruxooznrcjqc.supabase.co";
  const storageKey = "sb-vlacestfruxooznrcjqc-auth-token";
  const checks = [];
  let stage = "setup";
  class CheckFailure extends Error {
    constructor(code, status = 0) { super(code); this.safeCode = code; this.status = status; }
  }
  const require = (condition, code) => { if (!condition) throw new CheckFailure(code); };
  const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
  const count = (value) => Number.isSafeInteger(value) && value >= 0;
  const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  try {
    require(location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname), "OPEN_SIGNED_IN_APPLICATION");
    const session = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    require(typeof session?.access_token === "string" && uuid(session?.user?.id), "SIGN_IN_ON_THIS_BROWSER_FIRST");
    const key = prompt("RAD-LAB: public sb_publishable_ key for rad-lab-pilot only. Never enter a secret key or password.")?.trim();
    require(typeof key === "string" && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key), "PUBLIC_KEY_REQUIRED");
    const other = prompt("UUID of the OTHER existing approved account (owner <-> participant). Keep it in your browser; do not send it in chat.")?.trim().toLowerCase();
    require(uuid(other) && other !== session.user.id.toLowerCase(), "DISTINCT_EXISTING_ACCOUNT_REQUIRED");
    const request = async (name, path, body) => {
      stage = name;
      const response = await fetch(`${project}${path}`, {
        method: body ? "POST" : "GET", credentials: "omit", redirect: "error", cache: "no-store",
        headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
      });
      return { status: response.status, ok: response.ok, data: await response.json() };
    };
    const success = (response) => {
      if (!response.ok) throw new CheckFailure("SERVICE_REQUEST_FAILED", response.status);
      checks.push(stage);
      return response.data;
    };
    const profile = (id, columns) => `/rest/v1/profiles?select=${columns}&user_id=eq.${id}&limit=1`;
    const summary = (scope, user) => ({ p_view: "summary", p_scope: scope, p_user: user, p_exam: null, p_search: "", p_status: "", p_days: null, p_cursor: null, p_boundary: null, p_limit: 1 });
    const summaryValid = (data) => object(data) && data.version === 1 && Array.isArray(data.rows) && data.rows.length === 0
      && data.next === null && object(data.summary) && count(data.summary.attempts) && count(data.summary.exams)
      && (data.summary.trainees === null || count(data.summary.trainees));
    const readSummary = async (name, scope, user) => {
      const response = await request(name, "/rest/v1/rpc/training_page_v1", summary(scope, user));
      const data = success(response);
      require(summaryValid(data), "INVALID_TRAINING_RESPONSE");
    };
    const denied = (response) => {
      require(response.status === 403 && response.data?.code === "42501", "CROSS_SCOPE_NOT_EXPLICITLY_DENIED");
      checks.push(stage);
    };
    const user = success(await request("auth_user", "/auth/v1/user"));
    require(uuid(user?.id) && user.id === session.user.id, "AUTH_IDENTITY_MISMATCH");
    const rows = success(await request("own_profile", profile(user.id, "status,role,participant_code,consent_version,display_name")));
    require(Array.isArray(rows) && rows.length === 1, "OWN_PROFILE_MISSING");
    const own = rows[0];
    require(own.status === "approved" && ["owner", "participant"].includes(own.role)
      && typeof own.participant_code === "string" && Object.hasOwn(own, "display_name")
      && (own.display_name === null || typeof own.display_name === "string")
      && typeof own.consent_version === "string", "APPROVED_COMPATIBLE_PROFILE_REQUIRED");
    await readSummary("own_training", "own", user.id);
    if (own.role === "owner") {
      const target = success(await request("existing_approved_participant", profile(other, "user_id,status,role")));
      require(Array.isArray(target) && target.length === 1 && target[0].user_id === other
        && target[0].status === "approved" && target[0].role === "participant", "EXISTING_APPROVED_PARTICIPANT_REQUIRED");
      await readSummary("owner_all_training", "all", null);
      await readSummary("owner_selected_training", "all", other);
    } else {
      // A valid own request above prevents an expired/broken session from passing these negative checks.
      denied(await request("participant_other_training_denied", "/rest/v1/rpc/training_page_v1", summary("own", other)));
      denied(await request("participant_all_training_denied", "/rest/v1/rpc/training_page_v1", summary("all", null)));
      const hidden = success(await request("other_profile_hidden", profile(other, "user_id")));
      require(Array.isArray(hidden) && hidden.length === 0, "OTHER_PROFILE_VISIBLE");
      const attempts = success(await request("other_attempts_hidden", `/rest/v1/attempts?select=id&user_id=eq.${other}&limit=1`));
      require(Array.isArray(attempts) && attempts.length === 0, "OTHER_ATTEMPTS_VISIBLE");
    }
    // A reciprocal pair digest matches the two runs without logging either account UUID.
    stage = "pair_digest";
    const bytes = new TextEncoder().encode([project, ...[user.id.toLowerCase(), other].sort()].join("\n"));
    const pair = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((v) => v.toString(16).padStart(2, "0")).join("");
    console.log("RADLAB_SERVICE_CHECK " + JSON.stringify({ version: 1, project: new URL(project).hostname, role: own.role, pair,
      outcome: "PASS", checks, at: new Date().toISOString() }));
  } catch (error) {
    console.log("RADLAB_SERVICE_CHECK " + JSON.stringify({ version: 1, outcome: "STOP", stage,
      code: error instanceof CheckFailure ? error.safeCode : "LOCAL_OR_NETWORK_FAILURE",
      status: error instanceof CheckFailure ? error.status : 0, at: new Date().toISOString() }));
  }
})();
