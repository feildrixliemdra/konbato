'use client';

interface LabeledSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Appended to the numeric badge and announced to screen readers. */
  unit?: string;
  hint?: string;
  disabled?: boolean;
}

export function LabeledSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
  hint,
  disabled = false,
}: LabeledSliderProps) {
  const display = unit ? `${value}${unit}` : `${value}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold font-dm-sans">
        <label htmlFor={id}>{label}</label>
        <span className="text-primary">{display}</span>
      </div>
      <div className="px-1">
        <input
          id={id}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-valuetext={display}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {hint && (
        <span className="text-[10px] leading-relaxed text-muted-foreground font-dm-sans">
          {hint}
        </span>
      )}
    </div>
  );
}
