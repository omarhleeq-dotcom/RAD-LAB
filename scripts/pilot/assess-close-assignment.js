// Owner-operated browser console procedure, NOT an application script or automatic attestation.
// Closes ONE Assess assignment permanently (blocks new starts; existing attempts still settle). No password/token is prompted or logged.
/* global location, localStorage, prompt, confirm */
(async () => {
  const project = "https://vlacestfruxooznrcjqc.supabase.co";
  const storageKey = "sb-vlacestfruxooznrcjqc-auth-token";
  let stage = "setup";
  class CheckFailure extends Error {
    constructor(code, status = 0) { super(code); this.safeCode = code; this.status = status; }
  }
  const require = (condition, code) => { if (!condition) throw new CheckFailure(code); };
  const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
  try {
    require(location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname), "OPEN_SIGNED_IN_APPLICATION");
    const session = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    require(typeof session?.access_token === "string" && uuid(session?.user?.id), "SIGN_IN_ON_THIS_BROWSER_FIRST");
    const key = prompt("RAD-LAB: public sb_publishable_ key for rad-lab-pilot only. Never enter a secret key or password.")?.trim();
    require(typeof key === "string" && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key), "PUBLIC_KEY_REQUIRED");
    const input = prompt("Assignment ID to close PERMANENTLY (UUID only, 36 characters). Keep it in your browser; do not send it in chat.");
    require(input !== null, "ASSIGNMENT_INPUT_CANCELLED");
    const assignment = input.trim().toLowerCase();
    require(uuid(assignment), "ASSIGNMENT_UUID_INVALID");
    require(confirm("Close this assignment permanently? New starts are blocked for good; running attempts still finish."), "CLOSE_NOT_CONFIRMED");
    const request = async (name, path, body) => {
      stage = name;
      const response = await fetch(`${project}${path}`, {
        method: body ? "POST" : "GET", credentials: "omit", redirect: "error", cache: "no-store",
        headers: { apikey: key, Authorization: `Bearer ${session.access_token}`, ...(body ? { "Content-Type": "application/json", "Content-Profile": "assess" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
      });
      const text = await response.text();
      return { status: response.status, ok: response.ok, data: text ? JSON.parse(text) : null };
    };
    const user = await request("auth_user", "/auth/v1/user");
    if (!user.ok) throw new CheckFailure("SERVICE_REQUEST_FAILED", user.status);
    require(uuid(user.data?.id) && user.data.id === session.user.id, "AUTH_IDENTITY_MISMATCH");
    const profile = await request("owner_profile", `/rest/v1/profiles?select=status,role&user_id=eq.${user.data.id}&limit=1`);
    if (!profile.ok) throw new CheckFailure("SERVICE_REQUEST_FAILED", profile.status);
    require(Array.isArray(profile.data) && profile.data.length === 1 && profile.data[0].status === "approved" && profile.data[0].role === "owner", "APPROVED_OWNER_REQUIRED");
    const closed = await request("close_assignment", "/rest/v1/rpc/close_assignment_v1", { p_assignment: assignment });
    if (!closed.ok) throw new CheckFailure("SERVICE_REQUEST_FAILED", closed.status);
    require(closed.data === null, "UNEXPECTED_RESPONSE");
    // Digest prefix lets the owner match this line to an assignment without logging the identifier.
    const bytes = new TextEncoder().encode([project, assignment].join("\n"));
    const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((v) => v.toString(16).padStart(2, "0")).join("").slice(0, 16);
    console.log("RADLAB_ASSIGNMENT_CLOSE " + JSON.stringify({ version: 1, project: new URL(project).hostname, outcome: "PASS", assignment: digest, at: new Date().toISOString() }));
  } catch (error) {
    console.log("RADLAB_ASSIGNMENT_CLOSE " + JSON.stringify({ version: 1, outcome: "STOP", stage,
      code: error instanceof CheckFailure ? error.safeCode : "LOCAL_OR_NETWORK_FAILURE",
      status: error instanceof CheckFailure ? error.status : 0, at: new Date().toISOString() }));
  }
})();
