import { Typography } from "@material-tailwind/react";

const SLIDERS = [
  { key: 'brightness', label: 'Brillo', min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', min: -100, max: 100 },
  { key: 'sharpness', label: 'Nitidez', min: 0, max: 100 },
];

/**
 * Brillo, contraste y nitidez. `settings` es { brightness, contrast, sharpness }
 * y `onChange` recibe solo el valor que cambió, p.ej. { brightness: 20 }.
 */
export function ImageAdjustmentSliders({ settings, onChange, title }) {
  return (
    <div>
      <Typography variant="small" color="blue-gray" className="mb-3 font-medium">
        {title}
      </Typography>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SLIDERS.map(({ key, label, min, max }) => (
          <div key={key}>
            <Typography variant="small" color="gray">{label} ({settings[key]})</Typography>
            <input
              type="range" min={min} max={max} value={settings[key]}
              onChange={(e) => onChange({ [key]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageAdjustmentSliders;
