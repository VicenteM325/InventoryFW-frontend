import { useRef } from 'react';
import { moveFrame, resizeFrame } from '@/utils/photoCrop';

const CORNERS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

// Altura máxima de la imagen en pantalla, para que una foto vertical no
// obligue a desplazarse para ver el resto del formulario.
const MAX_HEIGHT_VH = 60;

/**
 * Foto con un marco de proporción fija superpuesto (SVG + Pointer Events):
 * arrastrar el interior lo mueve y arrastrar una esquina lo agranda o lo
 * achica (zoom) con la esquina opuesta fija. `frame` está en fracciones de
 * la imagen mostrada; `aspect` es ancho/alto de la foto impresa.
 */
export function PhotoCropFrame({ imageUrl, imageWidth, imageHeight, aspect, frame, onChange, disabled }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const toFraction = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const startDrag = (mode) => (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { mode, startPointer: toFraction(e), startFrame: frame };
  };

  const handleMove = (e) => {
    const drag = dragRef.current;
    if (!drag || disabled) return;
    const pointer = toFraction(e);
    if (drag.mode === 'move') {
      onChange(moveFrame(drag.startFrame, pointer.x - drag.startPointer.x, pointer.y - drag.startPointer.y));
    } else {
      onChange(resizeFrame(drag.startFrame, drag.mode, pointer, imageWidth, imageHeight, aspect));
    }
  };

  const endDrag = (e) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    dragRef.current = null;
  };

  const px = {
    x: frame.x * imageWidth,
    y: frame.y * imageHeight,
    width: frame.width * imageWidth,
    height: frame.height * imageHeight,
  };
  const corner = {
    topLeft: { x: px.x, y: px.y },
    topRight: { x: px.x + px.width, y: px.y },
    bottomRight: { x: px.x + px.width, y: px.y + px.height },
    bottomLeft: { x: px.x, y: px.y + px.height },
  };
  const stroke = imageWidth * 0.004;
  const handleRadius = imageWidth * 0.012;
  const hitRadius = imageWidth * 0.035;
  const cursors = { topLeft: 'nwse-resize', bottomRight: 'nwse-resize', topRight: 'nesw-resize', bottomLeft: 'nesw-resize' };

  return (
    <div
      className="relative mx-auto"
      style={{
        aspectRatio: `${imageWidth} / ${imageHeight}`,
        width: `min(100%, ${(MAX_HEIGHT_VH * imageWidth) / imageHeight}vh)`,
      }}
    >
      <img
        src={imageUrl}
        alt="Foto a recortar"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        preserveAspectRatio="none"
        // Sin recorte: con el marco pegado al borde, las esquinas quedan
        // sobre el límite de la foto y se verían (y se agarrarían) a medias.
        className="absolute inset-0 h-full w-full touch-none overflow-visible"
      >
        {/* Oscurece lo que queda fuera del marco. */}
        <path
          fillRule="evenodd"
          fill="rgba(0,0,0,0.5)"
          d={`M0 0H${imageWidth}V${imageHeight}H0Z M${px.x} ${px.y}h${px.width}v${px.height}h${-px.width}Z`}
        />
        <rect
          x={px.x} y={px.y} width={px.width} height={px.height}
          fill="transparent" stroke="white" strokeWidth={stroke}
          className={disabled ? '' : 'cursor-move'}
          onPointerDown={startDrag('move')}
          onPointerMove={handleMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        {/* Guías de tercios para centrar el rostro. */}
        {[1, 2].map((i) => (
          <g key={i} stroke="rgba(255,255,255,0.45)" strokeWidth={stroke / 2} pointerEvents="none">
            <line x1={px.x + (px.width * i) / 3} y1={px.y} x2={px.x + (px.width * i) / 3} y2={px.y + px.height} />
            <line x1={px.x} y1={px.y + (px.height * i) / 3} x2={px.x + px.width} y2={px.y + (px.height * i) / 3} />
          </g>
        ))}
        {CORNERS.map((key) => (
          <g
            key={key}
            style={{ cursor: disabled ? 'default' : cursors[key] }}
            onPointerDown={startDrag(key)}
            onPointerMove={handleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <circle cx={corner[key].x} cy={corner[key].y} r={hitRadius} fill="transparent" />
            <circle
              cx={corner[key].x} cy={corner[key].y} r={handleRadius}
              fill="#2563eb" stroke="white" strokeWidth={stroke}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default PhotoCropFrame;
