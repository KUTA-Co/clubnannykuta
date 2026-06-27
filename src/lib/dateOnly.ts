export function dateOnlyValue(dateValue: string | Date | null | undefined) {
  if (!dateValue) return "";

  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return String(dateValue).slice(0, 10);
}

export function parseDateOnly(dateValue: string | Date | null | undefined) {
  const value = dateOnlyValue(dateValue);
  const [year, month, day] = value.split("-").map(Number);

  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function formatDateOnly(
  dateValue: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions
) {
  const date = parseDateOnly(dateValue);
  if (!date) return "";

  return date.toLocaleDateString("en-US", options);
}

export function isSameDateOnly(left: string | Date | null | undefined, right: string | Date | null | undefined) {
  return dateOnlyValue(left) === dateOnlyValue(right);
}

