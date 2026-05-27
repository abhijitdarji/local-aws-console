'use client';

type Unit = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB';
const units: Unit[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

interface FileSizeProps {
  bytes: number | string | undefined | null;
  targetUnit?: Unit | 'auto';
  precision?: number;
}

export function FileSize({ bytes, targetUnit = 'auto', precision = 2 }: FileSizeProps) {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

  if (numBytes === null || numBytes === undefined || isNaN(numBytes) || numBytes < 0) {
    return <span>&mdash;</span>;
  }

  if (numBytes === 0 && targetUnit !== 'Bytes') return <span>0 KB</span>;
  if (numBytes === 0 && targetUnit === 'Bytes') return <span>0 Bytes</span>;

  let size = numBytes;
  let unitIndex = 0;

  if (targetUnit === 'auto') {
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
  } else {
    const specificUnitIndex = units.indexOf(targetUnit);
    if (specificUnitIndex !== -1) {
      size = numBytes / 1024 ** specificUnitIndex;
      unitIndex = specificUnitIndex;
    } else {
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
    }
  }

  const finalPrecision = units[unitIndex] === 'Bytes' ? 0 : precision;
  return (
    <span>
      {size.toFixed(finalPrecision)} {units[unitIndex]}
    </span>
  );
}
