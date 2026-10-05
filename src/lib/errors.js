// Turn an axios error into user-facing text. DRF errors arrive as JSON objects
// ({detail}, {non_field_errors}, {field: [...]}), but a wrong URL, a proxy or a
// crashed backend can hand back an HTML page instead — axios gives that to us
// as a plain string, so every helper here only reads `data` when it's an object.

const GENERIC_ERROR = "Something went wrong. Please try again.";

function errorData(err) {
  const data = err?.response?.data;
  return data && typeof data === "object" ? data : null;
}

// One message for the whole response, for list/detail views that just toast it.
// `notFoundMessage` replaces the generic text when the request 404s.
export function extractError(err, { notFoundMessage } = {}) {
  if (notFoundMessage && err?.response?.status === 404) return notFoundMessage;
  const data = errorData(err);
  if (!data) return GENERIC_ERROR;
  if (data.detail) return data.detail;
  return Object.values(data).flat().join(" ");
}

// Per-field messages for forms, keyed by field name.
export function extractFieldErrors(err) {
  const data = errorData(err);
  if (!data) return {};
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "non_field_errors" || key === "detail") continue;
    fields[key] = Array.isArray(value) ? value.join(" ") : String(value);
  }
  return fields;
}

// The non-field part of a form error; "" when the response only has field errors.
export function extractGeneralError(err) {
  const data = errorData(err);
  if (!data) return GENERIC_ERROR;
  if (data.non_field_errors) return data.non_field_errors.join(" ");
  if (data.detail) return data.detail;
  return "";
}
