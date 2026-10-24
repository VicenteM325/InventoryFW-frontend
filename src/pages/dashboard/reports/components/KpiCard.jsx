import PropTypes from "prop-types";
import { Card, Typography } from "@material-tailwind/react";
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/solid";
import { formatPct } from "@/utils/format";

const ACCENTS = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-blue-gray-50 text-blue-gray-600",
};

// Chip con la variación frente al periodo anterior. change=null significa que
// el periodo anterior no tuvo datos y no hay con qué comparar. invert=true
// cuando subir es malo (p. ej. productos agotados).
export function ChangeChip({ change, invert }) {
  if (change === null || change === undefined) {
    return <span className="text-xs text-blue-gray-400">Sin datos previos</span>;
  }
  const value = Number(change);
  if (value === 0) {
    return <span className="text-xs font-medium text-blue-gray-500">Sin cambios</span>;
  }
  const good = invert ? value < 0 : value > 0;
  const Icon = value > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        good ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <Icon className="h-3 w-3" />
      {formatPct(value)}
    </span>
  );
}

ChangeChip.propTypes = { change: PropTypes.number, invert: PropTypes.bool };
ChangeChip.defaultProps = { change: null, invert: false };

export function KpiCard({ icon: Icon, label, value, accent, change, footer, invert }) {
  return (
    <Card className="border border-blue-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography variant="small" className="font-medium text-blue-gray-500">
            {label}
          </Typography>
          <Typography variant="h4" color="blue-gray" className="mt-1 truncate" title={String(value)}>
            {value}
          </Typography>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ACCENTS[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex min-h-[24px] items-center gap-2">
        {change !== undefined && <ChangeChip change={change} invert={invert} />}
        {footer && <span className="text-xs text-blue-gray-500">{footer}</span>}
      </div>
    </Card>
  );
}

KpiCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.oneOf(Object.keys(ACCENTS)),
  change: PropTypes.number,
  footer: PropTypes.string,
  invert: PropTypes.bool,
};
KpiCard.defaultProps = { accent: "blue", change: undefined, footer: null, invert: false };

export default KpiCard;
