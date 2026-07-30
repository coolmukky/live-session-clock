import qrcode from 'qrcode-generator';

/**
 * Encode a string into a QR module matrix (true = dark). Uses error-correction
 * level M and auto-sizes to the smallest version that fits the data.
 */
export function qrMatrix(value: string): boolean[][] {
  const qr = qrcode(0, 'M');
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  const matrix: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
    matrix.push(row);
  }
  return matrix;
}

/**
 * Build a compact SVG `path` `d` string of the dark modules, merging runs of
 * consecutive dark cells in each row into a single rectangle. Coordinates are
 * offset by `quiet` modules for the required quiet zone.
 */
export function qrPath(matrix: boolean[][], quiet = 4): string {
  let d = '';
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run]) run++;
      d += `M${x + quiet} ${y + quiet}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return d;
}
