import React from 'react';

type Unit = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB';

interface FileSizeProps {
    bytes: number | string | undefined | null;
    targetUnit?: Unit | 'auto';
    precision?: number;
}

const units: Unit[] = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

export const FileSize: React.FC<FileSizeProps> = ({ bytes, targetUnit = 'auto', precision = 2 }) => {
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;

    if (numBytes === null || numBytes === undefined || isNaN(numBytes) || numBytes < 0) {
        return <span>&mdash;</span>; // Or return null, or an empty string, or 'N/A'
    }

    if (numBytes === 0 && targetUnit !== 'Bytes') return `0 KB`; // S3 often shows 0 for folders, display as 0 KB unless explicitly Bytes
    if (numBytes === 0 && targetUnit === 'Bytes') return `0 Bytes`;


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
            size = numBytes / Math.pow(1024, specificUnitIndex);
            unitIndex = specificUnitIndex;
        } else {
            // Fallback to auto if targetUnit is invalid, or handle error
            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }
        }
    }
    
    // For Bytes, no decimal precision is needed.
    const finalPrecision = units[unitIndex] === 'Bytes' ? 0 : precision;

    return <span>{size.toFixed(finalPrecision)} {units[unitIndex]}</span>;
};
