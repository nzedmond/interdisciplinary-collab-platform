// RFC 4180 quoting. Cells that could be read as spreadsheet formulas are prefixed
// with an apostrophe so opening the file in Excel/Sheets can't run anything.
export function toCsvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
