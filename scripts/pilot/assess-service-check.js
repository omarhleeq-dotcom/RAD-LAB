// Owner-operated READ-ONLY Assess B service check; not a migration or deployment attestation.
// Run in the signed-in application Console, once as owner and once as approved participant.
/* global location, localStorage, prompt */
(async () => {
  const project = "https://vlacestfruxooznrcjqc.supabase.co";
  const checks = [];
  let stage = "setup";
  class Failure extends Error {
    constructor(code, status = 0) { super(code); this.safeCode = code; this.status = status; }
  }
  const require = (condition, code) => { if (!condition) throw new Failure(code); };
  const uuid = (v) => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
  const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const text = (v) => typeof v === "string" && v.trim().length > 0;
  try {
    require(location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname), "OPEN_SIGNED_IN_APPLICATION");
    const session = JSON.parse(localStorage.getItem("sb-vlacestfruxooznrcjqc-auth-token") ?? "null");
    require(text(session?.access_token) && uuid(session?.user?.id), "SIGN_IN_ON_THIS_BROWSER_FIRST");
    const key = prompt("RAD-LAB Assess: public sb_publishable_ key for rad-lab-pilot only. Never enter a password or secret key.")?.trim();
    require(typeof key === "string" && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key), "PUBLIC_KEY_REQUIRED");
    const input = prompt("UUID of the OTHER account (owner <-> approved participant). Keep IDs locally; do not send them in chat.");
    require(typeof input === "string", "OTHER_ACCOUNT_INPUT_CANCELLED");
    const other = input.trim().toLowerCase();
    require(uuid(other), "OTHER_ACCOUNT_UUID_INVALID");
    require(other !== session.user.id.toLowerCase(), "OTHER_ACCOUNT_MATCHES_CURRENT_SESSION");
    const request = async (name, path, body, assess = false, signedIn = true) => {
      stage = name;
      const r = await fetch(`${project}${path}`, {
        method: body ? "POST" : "GET", credentials: "omit", redirect: "error", cache: "no-store",
        headers: { apikey: key, ...(signedIn ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(assess ? { [body ? "Content-Profile" : "Accept-Profile"]: "assess" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
      });
      return { ok: r.ok, status: r.status, data: await r.json() };
    };
    const success = (r) => {
      if (!r.ok) {
        const code = ["PGRST106", "PGRST202", "PGRST205", "42501"].includes(r.data?.code) ? r.data.code : "SERVICE_REQUEST_FAILED";
        throw new Failure(code, r.status);
      }
      checks.push(stage); return r.data;
    };
    const denied = (r, hiddenTable = false) => {
      if (!((r.status === 403 && r.data?.code === "42501") ||
        (hiddenTable && r.status === 404 && r.data?.code === "PGRST205"))) {
        throw new Failure("ACCESS_NOT_EXPLICITLY_DENIED", r.status);
      }
      checks.push(stage);
    };
    const args = (kind) => ({ p_kind: kind, p_context: null, p_search: "", p_after: null, p_limit: 1 });
    const rpc = (name, fn, body, signedIn = true) => request(name, `/rest/v1/rpc/${fn}`, body, true, signedIn);
    const user = success(await request("auth_user", "/auth/v1/user"));
    require(uuid(user?.id) && user.id === session.user.id, "AUTH_IDENTITY_MISMATCH");
    const own = success(await request("own_profile", `/rest/v1/profiles?select=status,role&user_id=eq.${user.id}&limit=1`));
    require(Array.isArray(own) && own.length === 1 && own[0].status === "approved" &&
      ["owner", "participant"].includes(own[0].role), "APPROVED_PROFILE_REQUIRED");
    const role = own[0].role;
    if (role === "owner") {
      const target = success(await request("existing_approved_participant", `/rest/v1/profiles?select=user_id,status,role&user_id=eq.${other}&limit=1`));
      require(Array.isArray(target) && target.length === 1 && target[0].user_id === other &&
        target[0].status === "approved" && target[0].role === "participant", "EXISTING_APPROVED_PARTICIPANT_REQUIRED");
    }
    for (const kind of ["groups", "people", "versions", "assignments"]) {
      const r = await rpc(`${role}_${kind}`, "owner_page_v1", args(kind));
      if (role === "participant") { denied(r); continue; }
      const p = success(r);
      require(object(p) && p.version === 1 && Array.isArray(p.rows) && p.rows.length <= 1 &&
        (p.next === null || (uuid(p.next) && p.next === p.rows[0]?.id)), "INVALID_ASSESS_PAGE");
      for (const row of p.rows) {
        require(object(row) && uuid(row.id), "INVALID_ASSESS_ROW");
        if (kind === "people") require((row.name === null || text(row.name)) && (row.email === null || text(row.email)) &&
          ["approved", "pending", "suspended"].includes(row.status), "INVALID_ASSESS_PERSON");
        else {
          require(text(row.name), "INVALID_ASSESS_ROW");
          if (kind !== "groups") require(text(row.version) && ["mixed", "full-practical"].includes(row.track), "UNSUPPORTED_ASSESS_VERSION");
          if (kind === "assignments") require(Number.isSafeInteger(row.revision) && row.revision > 0, "INVALID_ASSIGNMENT_REVISION");
        }
      }
    }
    // Empty Assess is valid. This sentinel proves only rejection of an unassigned metadata request.
    denied(await rpc("unassigned_metadata_denied", "assigned_version_v1", { p_assignment: "00000000-0000-0000-0000-000000000000" }));
    // No JWT: the gateway or PostgREST can return HTTP 401 for this request.
    // The same API key/session has already passed Auth/profile and the signed-in checks.
    const anonymous = await rpc("anonymous_admin_denied", "owner_page_v1", args("groups"), false);
    if (anonymous.status === 401) checks.push(stage);
    else denied(anonymous);
    const anonymousDenial = anonymous.data?.code === "42501" ? "sql-42501" : "http-401";
    for (const [table, column] of [["groups", "id"], ["memberships", "group_id"], ["versions", "id"], ["assignments", "id"], ["targets", "assignment_id"]]) {
      // PGRST205 is allowed only here: inaccessible relations can be absent from the API cache.
      denied(await request(`direct_${table}_denied`, `/rest/v1/${table}?select=${column}&limit=1`, null, true), true);
    }
    stage = "pair_digest";
    const bytes = new TextEncoder().encode([project, ...[user.id.toLowerCase(), other].sort()].join("\n"));
    const pair = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2, "0")).join("");
    console.log("RADLAB_ASSESS_SERVICE_CHECK " + JSON.stringify({ version: 1, contract: "assess-b-service/1", role, pair,
      outcome: "PASS", anonymousDenial, checks, at: new Date().toISOString() }));
  } catch (error) {
    console.log("RADLAB_ASSESS_SERVICE_CHECK " + JSON.stringify({ version: 1, contract: "assess-b-service/1", outcome: "STOP", stage,
      code: error instanceof Failure ? error.safeCode : "LOCAL_OR_NETWORK_FAILURE", status: error instanceof Failure ? error.status : 0,
      at: new Date().toISOString() }));
  }
})();
