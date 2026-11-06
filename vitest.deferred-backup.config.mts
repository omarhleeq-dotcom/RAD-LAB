// Explicit synthetic-only regression lane; not required by Assess CI or deployment.
import {defineConfig} from 'vitest/config';
import base from './vitest.config.mjs';
export default defineConfig({...base,test:{...base.test,include:['scripts/assess/deferred-cloud-backup.test.ts'],exclude:[]}});
