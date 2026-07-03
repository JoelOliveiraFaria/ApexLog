/**
 * Largest-Triangle-Three-Buckets downsampling.
 * Seleciona os índices de linha mais representativos com base numa única série
 * "condutora" (ex: velocidade) e devolve as linhas completas nesses índices,
 * para que todas as séries de um mesmo gráfico (ou de gráficos irmãos) permaneçam
 * alinhadas ao mesmo eixo X após a amostragem.
 */
export function downsampleLTTB<T extends object>(data: T[], threshold: number, valueKey: keyof T): T[] {
  const n = data.length;
  if (threshold <= 2 || threshold >= n) return data;

  const valueOf = (row: T): number => Number(row[valueKey]) || 0;

  const sampled: T[] = [data[0]];
  const bucketSize = (n - 2) / (threshold - 2);
  let pointedIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    const avgRangeLength = Math.max(avgRangeEnd - avgRangeStart, 1);

    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgY += valueOf(data[j]);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeOffset = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    const pointAX = pointedIndex;
    const pointAY = valueOf(data[pointedIndex]);

    let maxArea = -1;
    let maxAreaIndex = rangeOffset;

    for (let j = rangeOffset; j < rangeTo; j++) {
      const pointY = valueOf(data[j]);
      const area = Math.abs(
        (pointAX - avgX) * (pointY - pointAY) - (pointAX - j) * (avgY - pointAY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    sampled.push(data[maxAreaIndex]);
    pointedIndex = maxAreaIndex;
  }

  sampled.push(data[n - 1]);
  return sampled;
}
