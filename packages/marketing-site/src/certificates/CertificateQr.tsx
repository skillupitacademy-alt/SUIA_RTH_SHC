import React from "react";

function hashValue(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isFinderZone(x: number, y: number, size: number): boolean {
  const max = size - 7;

  return (
    (x < 7 && y < 7) ||
    (x >= max && y < 7) ||
    (x < 7 && y >= max)
  );
}

function isFinderPixel(x: number, y: number, size: number): boolean {
  const max = size - 7;
  const zones = [
    { startX: 0, startY: 0 },
    { startX: max, startY: 0 },
    { startX: 0, startY: max },
  ];

  return zones.some(({ startX, startY }) => {
    if (x < startX || y < startY || x >= startX + 7 || y >= startY + 7) {
      return false;
    }

    const localX = x - startX;
    const localY = y - startY;
    const outer = localX === 0 || localX === 6 || localY === 0 || localY === 6;
    const inner = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;

    return outer || inner;
  });
}

function buildMatrix(value: string, size = 29): boolean[][] {
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  let seed = hashValue(value);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (isFinderZone(x, y, size)) {
        matrix[y][x] = isFinderPixel(x, y, size);
        continue;
      }

      seed = Math.imul(seed ^ (x + 11), 2246822519) ^ (y + 37);
      const mixed = (seed >>> 0) ^ ((x * 31 + y * 17) >>> 0);
      matrix[y][x] = mixed % 3 !== 0;
    }
  }

  return matrix;
}

export function CertificateQr({
  value,
  color,
  size = 126,
}: {
  value: string;
  color: string;
  size?: number;
}) {
  const matrix = buildMatrix(value);
  const cellSize = size / matrix.length;

  return (
    <svg
      aria-label="Certificate verification code"
      role="img"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} rx="6" fill="#ffffff" />
      {matrix.map((row, rowIndex) =>
        row.map((filled, columnIndex) =>
          filled ? (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={columnIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
