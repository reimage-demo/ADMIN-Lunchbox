import { formatCents, parseCurrencyInput } from "../currency";

export default function CurrencyInput({ value, onChange, ...props }) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={formatCents(value)}
      onChange={(event) => onChange(parseCurrencyInput(event.target.value))}
      onFocus={(event) => event.target.select()}
    />
  );
}
