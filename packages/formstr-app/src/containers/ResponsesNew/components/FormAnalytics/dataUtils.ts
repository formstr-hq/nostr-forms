import { Field, Tag, GridOptions } from "../../../../nostr/types";

export interface FieldAnalytics {
  fieldId: string;
  label: string;
  fieldType: string;
  data: ChoiceData[] | WordData[] | NumberBucket[] | DateBucket[] | GridHeatmapData[];
  totalAnswered: number;
}

export interface ChoiceData {
  option: string;
  count: number;
  percentage: number;
}

export interface WordData {
  word: string;
  count: number;
  size: number; // normalized 1-5 for rendering
}

export interface NumberBucket {
  range: string;
  count: number;
  min: number;
  max: number;
}

export interface DateBucket {
  date: string;
  count: number;
}

export interface GridHeatmapData {
  rows: { id: string; label: string }[];
  columns: { id: string; label: string }[];
  matrix: number[][]; // matrix[rowIdx][colIdx] = selection count
  maxCount: number;
  fieldType: "multipleChoiceGrid" | "checkboxGrid";
}

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","it","its","was","are","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall",
  "that","this","these","those","i","you","he","she","we","they","my","your",
  "his","her","our","their","me","him","us","them","what","which","who","how",
  "not","no","so","if","as","up","out","about","than","then","just","also",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function buildChoiceData(
  values: string[],
  isMulti: boolean,
  totalResponses: number
): ChoiceData[] {
  const counts: Record<string, number> = {};
  for (const val of values) {
    if (!val) continue;
    const parts = isMulti
      ? val.split(",").map((s) => s.trim())
      : [val.trim()];
    for (const p of parts) {
      if (p) counts[p] = (counts[p] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([option, count]) => ({
      option,
      count,
      percentage: parseFloat(((count / totalResponses) * 100).toFixed(1)),
    }));
}

function buildWordData(values: string[]): WordData[] {
  const freq: Record<string, number> = {};
  for (const val of values) {
    if (!val) continue;
    for (const word of tokenize(val)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);
  if (sorted.length === 0) return [];
  const maxCount = sorted[0][1];
  const minCount = sorted[sorted.length - 1][1];
  const range = maxCount - minCount || 1;
  return sorted.map(([word, count]) => ({
    word,
    count,
    size: Math.round(1 + ((count - minCount) / range) * 4),
  }));
}

function buildNumberData(values: string[]): NumberBucket[] {
  const nums = values.map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return [];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min === max) {
    return [{ range: String(min), count: nums.length, min, max }];
  }
  const bucketCount = Math.min(8, Math.ceil(Math.sqrt(nums.length)));
  const step = (max - min) / bucketCount;
  const buckets: NumberBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const lo = min + i * step;
    const hi = lo + step;
    return {
      range: `${lo % 1 === 0 ? lo : lo.toFixed(1)}–${hi % 1 === 0 ? hi : hi.toFixed(1)}`,
      count: 0,
      min: lo,
      max: hi,
    };
  });
  for (const n of nums) {
    const idx = Math.min(
      Math.floor((n - min) / step),
      bucketCount - 1
    );
    buckets[idx].count++;
  }
  return buckets;
}

function buildDateData(values: string[]): DateBucket[] {
  const counts: Record<string, number> = {};
  for (const val of values) {
    if (!val) continue;
    // values may be formatted date strings like "3/17/2026, 10:00:00 AM"
    const dateStr = val.split(",")[0].trim();
    counts[dateStr] = (counts[dateStr] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => ({ date, count }));
}

function buildGridHeatmapData(
  values: string[],
  gridOptions: GridOptions,
  fieldType: "multipleChoiceGrid" | "checkboxGrid"
): GridHeatmapData {
  const rows = gridOptions.rows.map((r) => ({ id: r[0], label: r[1] }));
  const cols = gridOptions.columns.map((c) => ({ id: c[0], label: c[1] }));
  const matrix: number[][] = rows.map(() => cols.map(() => 0));

  for (const val of values) {
    if (!val) continue;
    // Format: "RowLabel: ColLabel1, ColLabel2 | RowLabel2: ColLabel3"
    const rowParts = val.split(" | ");
    for (const rowPart of rowParts) {
      const colonIdx = rowPart.indexOf(": ");
      if (colonIdx === -1) continue;
      const rowLabel = rowPart.substring(0, colonIdx);
      const colLabels = rowPart
        .substring(colonIdx + 2)
        .split(", ")
        .map((s) => s.trim());

      const rowIdx = rows.findIndex((r) => r.label === rowLabel);
      if (rowIdx === -1) continue;

      for (const colLabel of colLabels) {
        const colIdx = cols.findIndex((c) => c.label === colLabel);
        if (colIdx !== -1) matrix[rowIdx][colIdx]++;
      }
    }
  }

  const maxCount = Math.max(...matrix.flat(), 1);
  return { rows, columns: cols, matrix, maxCount, fieldType };
}

export function computeAnalytics(
  responses: Array<{ [key: string]: string }>,
  formSpec: Tag[]
): FieldAnalytics[] {
  if (!responses.length || !formSpec) return [];

  const fields = formSpec.filter((t) => t[0] === "field") as Field[];
  const totalResponses = responses.length;
  const result: FieldAnalytics[] = [];

  for (const field of fields) {
    const [, fieldId, , label, , configStr] = field;
    let config: { renderElement?: string } = {};
    try {
      config = JSON.parse(configStr || "{}");
    } catch {}

    const renderElement = config.renderElement || "";
    const values = responses
      .map((r) => r[label] || "")
      .filter((v) => v !== "");

    if (values.length === 0) continue;

    if (
      renderElement === "radioButton" ||
      renderElement === "dropdown"
    ) {
      result.push({
        fieldId,
        label,
        fieldType: renderElement,
        data: buildChoiceData(values, false, totalResponses),
        totalAnswered: values.length,
      });
    } else if (renderElement === "checkboxes") {
      result.push({
        fieldId,
        label,
        fieldType: renderElement,
        data: buildChoiceData(values, true, totalResponses),
        totalAnswered: values.length,
      });
    } else if (
      renderElement === "shortText" ||
      renderElement === "paragraph" ||
      renderElement === ""
    ) {
      const wordData = buildWordData(values);
      if (wordData.length > 0) {
        result.push({
          fieldId,
          label,
          fieldType: "text",
          data: wordData,
          totalAnswered: values.length,
        });
      }
    } else if (renderElement === "number") {
      result.push({
        fieldId,
        label,
        fieldType: "number",
        data: buildNumberData(values),
        totalAnswered: values.length,
      });
    } else if (
      renderElement === "date" ||
      renderElement === "datetime" ||
      renderElement === "time"
    ) {
      result.push({
        fieldId,
        label,
        fieldType: "date",
        data: buildDateData(values),
        totalAnswered: values.length,
      });
    } else if (
      renderElement === "multipleChoiceGrid" ||
      renderElement === "checkboxGrid"
    ) {
      try {
        const gridOptions: GridOptions = JSON.parse(
          field[4] || '{"columns":[],"rows":[]}'
        );
        if (gridOptions.rows.length > 0 && gridOptions.columns.length > 0) {
          result.push({
            fieldId,
            label,
            fieldType: renderElement,
            data: [buildGridHeatmapData(values, gridOptions, renderElement)],
            totalAnswered: values.length,
          });
        }
      } catch {}
    }
  }

  return result;
}

export function computeSummaryStats(
  responses: Array<{ [key: string]: string }>,
  formSpec: Tag[]
) {
  const totalSubmissions = responses.length;
  const uniqueResponders = new Set(responses.map((r) => r.key)).size;
  const fields = formSpec.filter((t) => t[0] === "field") as Field[];
  const answerableFields = fields.filter(
    (f) => !["label", "signature", "file"].includes(f[2])
  );
  const answeredFields = answerableFields.filter((f) =>
    responses.some((r) => r[f[3]] && r[f[3]].trim() !== "")
  );
  return {
    totalSubmissions,
    uniqueResponders,
    totalFields: answerableFields.length,
    answeredFields: answeredFields.length,
  };
}
