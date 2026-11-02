export const EMERGENCY_MIGRATIONS = ['20261102000200_rad059_emergency_alternate.sql'] as const;
export function emergencyAvailable(schema:{requiredMigrations:readonly string[];deferredMigrations:object}) {
 return EMERGENCY_MIGRATIONS.every(file=>schema.requiredMigrations.includes(file)&&!(file in schema.deferredMigrations));
}
/** Changed only by a separately reviewed schema promotion, never runtime config. */
export const EMERGENCY_AVAILABLE: boolean = false;
