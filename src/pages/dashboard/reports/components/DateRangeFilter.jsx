import PropTypes from "prop-types";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { matchingPreset, presetRanges } from "@/utils/dateRanges";

const INPUT =
  "rounded-lg border border-blue-gray-200 bg-white px-3 py-1.5 text-sm text-blue-gray-800 focus:border-gray-900 focus:outline-none";

export function DateRangeFilter({ from, to, onChange, error }) {
  const active = matchingPreset(from, to);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5 text-blue-gray-400" />
        {presetRanges().map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.from, preset.to)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              active === preset.id
                ? "bg-gray-900 text-white"
                : "bg-blue-gray-50 text-blue-gray-700 hover:bg-blue-gray-100"
            }`}
          >
            {preset.label}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-blue-gray-100 sm:block" />
        <label className="flex items-center gap-2 text-xs text-blue-gray-500">
          Desde
          <input
            type="date"
            aria-label="Desde"
            className={INPUT}
            value={from}
            max={to || undefined}
            onChange={(e) => onChange(e.target.value, to)}
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-blue-gray-500">
          Hasta
          <input
            type="date"
            aria-label="Hasta"
            className={INPUT}
            value={to}
            min={from || undefined}
            onChange={(e) => onChange(from, e.target.value)}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

DateRangeFilter.propTypes = {
  from: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
DateRangeFilter.defaultProps = { error: "" };

export default DateRangeFilter;
