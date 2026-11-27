/** Offline installation/transport contract. Behavioural dispatch witnesses live in selfservice-s2.test. */
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

it('independent default-OFF pg_cron packet reuses the RAD-104 transport without any activation or test send', () => {
 const packet = readFileSync('supabase/manual/selfservice-notify-install.sql', 'utf8');
 const migration = readFileSync('supabase/migrations/20261105000300_rad105_selfservice_s2.sql', 'utf8');
 expect(packet).toContain("cron.schedule('radlab-assessment-notify','* * * * *','select assess.notice_dispatch_v1()')");
 expect(packet).toContain('independent assessment switch must be OFF');
 expect(packet).not.toMatch(/set enabled\s*=\s*true|create_secret|select assess.notice_dispatch_v1\(\);/);
 const post = migration.slice(migration.indexOf('create function assess.notice_post_v1'), migration.indexOf('create function assess.notice_dispatch_v1'));
 expect(post).toContain('radlab_signup_notify_brevo_key'); expect(post).toContain('radlab_signup_notify_sender');
 expect(post).not.toContain('radlab_signup_notify_recipient');
 expect(post).toContain("You have a new assessment, opens at ");
 expect(post).not.toMatch(/publication|results|score|answers|prompt/);
 expect(post).toContain("'htmlContent','<p>'||msg||'</p>'");
 expect(post).toContain('timeout_milliseconds:=5000');
});
