import PropTypes from "prop-types";
import { Card, Typography } from "@material-tailwind/react";

// Tarjeta con título para agrupar un gráfico o una tabla.
export function Panel({ title, subtitle, action, children, className }) {
  return (
    <Card className={`border border-blue-gray-100 p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" color="blue-gray">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="small" className="font-normal text-blue-gray-500">
              {subtitle}
            </Typography>
          )}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

Panel.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
};
Panel.defaultProps = { subtitle: null, action: null, children: null, className: "" };

export default Panel;
