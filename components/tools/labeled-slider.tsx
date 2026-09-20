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
        {/* Two constraints, both load-bearing.
            text-base is not for looks: a sub-16px form control makes iOS Safari
            zoom the viewport on focus, and the slider inherits 14px from Card.
            The coarse-pointer height is the touch target. The input's own box is
            what the finger has to hit, and a 6px track is ungrabbable, so on a
            coarse pointer the box is 44px with the padding doing the work: the
            content box stays the 0.375rem of the base track and
            `bg-clip-content` makes the painted background follow it, while the
            element around it is a full-size target. The padding is written as
            that arithmetic rather than as 19px, so changing either the track
            height or the 44px floor keeps the two in step.
            The thumb is styled explicitly because `appearance-none` removes the
            engine's default, which would otherwise leave no visible handle. */}
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
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted bg-clip-content text-base accent-primary disabled:cursor-not-allowed disabled:opacity-50 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:py-[calc((2.75rem-0.375rem)/2)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-black/25"
        />
      </div>
      {hint && (
        <span className="text-xs leading-relaxed text-muted-foreground font-dm-sans">
          {hint}
        </span>
      )}
    </div>
  );
}
