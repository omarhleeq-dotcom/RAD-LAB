import { statSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openRad085Database } from './rad085-local-db';

it('keeps cloned PostgreSQL data directories private under umask 0022', async () => {
 const previousUmask = process.umask(0o022);
 try {
  const first = await openRad085Database();
  try {
   expect((await first.admin.query('show data_directory')).rows).toHaveLength(1);
  } finally { await first.close(); }

  const clone = await openRad085Database();
  try {
   const directory = (await clone.admin.query('show data_directory')).rows[0].data_directory as string;
   expect(statSync(directory).mode & 0o777).toBe(0o700);
  } finally { await clone.close(); }
 } finally { process.umask(previousUmask); }
});
