// Deep camelCase <-> snake_case converters for API payloads/responses.
// The Laravel backend speaks snake_case; the Angular models use camelCase.

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const camelToSnake = (key: string): string =>
  key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

const snakeToCamel = (key: string): string =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Recursively convert all object keys to snake_case (for request bodies). */
export function toSnakeCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => toSnakeCase(item)) as T;
  }
  if (isPlainObject(input)) {
    const out: AnyRecord = {};
    for (const [key, value] of Object.entries(input)) {
      out[camelToSnake(key)] = toSnakeCase(value);
    }
    return out as T;
  }
  return input as T;
}

/** Recursively convert all object keys to camelCase (for responses). */
export function toCamelCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((item) => toCamelCase(item)) as T;
  }
  if (isPlainObject(input)) {
    const out: AnyRecord = {};
    for (const [key, value] of Object.entries(input)) {
      out[snakeToCamel(key)] = toCamelCase(value);
    }
    return out as T;
  }
  return input as T;
}
