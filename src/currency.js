const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents) {
  const safeCents = Number.isFinite(Number(cents))
    ? Math.max(0, Math.trunc(Number(cents)))
    : 0;
  return currencyFormatter.format(safeCents / 100);
}

export function parseCurrencyInput(value) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;

  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : Number.MAX_SAFE_INTEGER;
}
