/** Shared structural guards only; caller-specific limits and errors stay with each adapter. */
export const isObject=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
export const isUuid=(v:unknown):v is string=>typeof v==="string"&&/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(v);
