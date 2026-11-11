export default function Stepper({ value, min = 0, max = 16, onChange }: { value: number; min?: number; max?: number; onChange: (n: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" className="round" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="Decrease">−</button>
      <span>{value}</span>
      <button type="button" className="round" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="Increase">+</button>
    </div>
  );
}
