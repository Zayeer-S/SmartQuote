// src/client/features/dashboard/DateRangeFilter.tsx

import React from 'react';

export interface DateRange {
  from: string;
  to: string;
}

type Preset = '7d' | '30d' | '90d';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

/** Return YYYY-MM-DD for a date N days in the past */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function presetToRange(preset: Preset): DateRange {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  return { from: daysAgo(days), to: today() };
}

function detectPreset(range: DateRange): Preset | 'custom' {
  for (const p of PRESETS) {
    const expected = presetToRange(p.value);
    if (range.from === expected.from && range.to === expected.to) return p.value;
  }
  return 'custom';
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const active = detectPreset(value);

  function handlePreset(preset: Preset): void {
    onChange(presetToRange(preset));
  }

  function handleCustomFrom(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, from: e.target.value });
  }

  function handleCustomTo(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange({ ...value, to: e.target.value });
  }

  return (
    <div className="date-range-filter" aria-label="Date range filter">
      <div className="date-range-presets">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            className={`date-range-preset-btn${active === p.value ? ' active' : ''}`}
            onClick={() => {
              handlePreset(p.value);
            }}
            type="button"
            aria-pressed={active === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="date-range-custom">
        <label className="date-range-label" htmlFor="analytics-from">
          From
        </label>
        <input
          id="analytics-from"
          type="date"
          className="date-range-input"
          value={value.from}
          max={value.to}
          onChange={handleCustomFrom}
        />
        <label className="date-range-label" htmlFor="analytics-to">
          To
        </label>
        <input
          id="analytics-to"
          type="date"
          className="date-range-input"
          value={value.to}
          min={value.from}
          max={today()}
          onChange={handleCustomTo}
        />
      </div>
    </div>
  );
};

export default DateRangeFilter;
