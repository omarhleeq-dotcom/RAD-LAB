// Shared read-only measurement arithmetic. No DB, cloud, backup or process entrypoint.
export function sizeSignal(bytes, limit) {
 if (!Number.isSafeInteger(bytes)||bytes<0||!Number.isSafeInteger(limit)||limit<1) throw Error('size');
 return { databaseBytes:bytes,planLimitBytes:limit,databaseSizeAlert70:BigInt(bytes)*10n>=BigInt(limit)*7n };
}
