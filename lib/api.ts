import { NextResponse } from "next/server";

type JsonParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<{ error: string }> };

export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T>(request: Request): Promise<JsonParseResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, response: errorResponse(400, "Request body must be valid JSON.") };
    }

    return { ok: false, response: errorResponse(400, "Request body could not be parsed.") };
  }
}

export function requireTrimmedString(
  value: unknown,
  fieldLabel: string,
  options?: { minLength?: number; maxLength?: number }
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: `${fieldLabel} is required.` };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { ok: false, error: `${fieldLabel} is required.` };
  }

  const minLength = options?.minLength;
  if (typeof minLength === "number" && normalized.length < minLength) {
    return { ok: false, error: `${fieldLabel} must be at least ${minLength} characters.` };
  }

  const maxLength = options?.maxLength;
  if (typeof maxLength === "number" && normalized.length > maxLength) {
    return { ok: false, error: `${fieldLabel} must be ${maxLength} characters or less.` };
  }

  return { ok: true, value: normalized };
}

export function requireBoolean(
  value: unknown,
  fieldLabel: string
): { ok: true; value: boolean } | { ok: false; error: string } {
  if (typeof value !== "boolean") {
    return { ok: false, error: `${fieldLabel} must be true or false.` };
  }

  return { ok: true, value };
}

export function optionalTrimmedString(
  value: unknown,
  fieldLabel: string,
  options?: { maxLength?: number }
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false, error: `${fieldLabel} must be text.` };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { ok: true, value: null };
  }

  const maxLength = options?.maxLength;
  if (typeof maxLength === "number" && normalized.length > maxLength) {
    return { ok: false, error: `${fieldLabel} must be ${maxLength} characters or less.` };
  }

  return { ok: true, value: normalized };
}

export function optionalInteger(
  value: unknown,
  fieldLabel: string,
  options?: { min?: number; max?: number }
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { ok: false, error: `${fieldLabel} must be a whole number.` };
  }

  const min = options?.min;
  if (typeof min === "number" && value < min) {
    return { ok: false, error: `${fieldLabel} must be ${min} or greater.` };
  }

  const max = options?.max;
  if (typeof max === "number" && value > max) {
    return { ok: false, error: `${fieldLabel} must be ${max} or less.` };
  }

  return { ok: true, value };
}

export function requireStringArray(
  value: unknown,
  fieldLabel: string,
  options?: { minItems?: number; maxItems?: number; maxItemLength?: number }
): { ok: true; value: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: `${fieldLabel} must be a list.` };
  }

  const hasNonStringValue = value.some((item) => typeof item !== "string");
  if (hasNonStringValue) {
    return { ok: false, error: `${fieldLabel} values must be text.` };
  }

  const normalized = value.map((item) => item.trim()).filter(Boolean);
  const deduped = Array.from(new Set(normalized));
  const minItems = options?.minItems ?? 0;
  const maxItems = options?.maxItems;
  const maxItemLength = options?.maxItemLength;

  if (deduped.length < minItems) {
    return {
      ok: false,
      error: `${fieldLabel} must include at least ${minItems} item${minItems === 1 ? "" : "s"}.`
    };
  }

  if (typeof maxItems === "number" && deduped.length > maxItems) {
    return { ok: false, error: `${fieldLabel} must include no more than ${maxItems} items.` };
  }

  if (typeof maxItemLength === "number") {
    const tooLongItem = deduped.find((item) => item.length > maxItemLength);
    if (tooLongItem) {
      return {
        ok: false,
        error: `${fieldLabel} values must be ${maxItemLength} characters or less.`
      };
    }
  }

  return { ok: true, value: deduped };
}
