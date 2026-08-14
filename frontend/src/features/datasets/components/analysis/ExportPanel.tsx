import { useState } from 'react';
import type { Dataset } from '../../types';
import type { DatasetOverview, DatasetQuality, FullColumnStatistics } from '../../analytics/types';
import { DownloadIcon } from '../../../../components/ui/icons';
import { formatNumber, formatBytes } from '../../../../utils/format';

interface ExportPanelProps {
  datasetId: string;
  dataset: Dataset;
  overview?: DatasetOverview;
  quality?: DatasetQuality;
  statistics?: FullColumnStatistics[];
  chartRefs: Map<string, HTMLDivElement>;
}

export function ExportPanel({
  datasetId,
  dataset,
  overview,
  quality,
  statistics,
  chartRefs,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportOptions = [
    {
      id: 'pdf',
      label: 'PDF Report',
      description: 'Export complete analysis as a PDF document',
      icon: '📄',
    },
    {
      id: 'excel',
      label: 'Excel Report',
      description: 'Export statistics and data to Excel spreadsheet',
      icon: '📊',
    },
    {
      id: 'csv',
      label: 'CSV Data',
      description: 'Export raw dataset as CSV file',
      icon: '📋',
    },
    {
      id: 'json',
      label: 'JSON Statistics',
      description: 'Export all statistics as structured JSON',
      icon: '{}',
    },
    {
      id: 'png',
      label: 'PNG Charts',
      description: 'Export all charts as PNG images',
      icon: '🖼️',
    },
  ];

  async function handleExport(type: string) {
    setExporting(type);
    try {
      switch (type) {
        case 'csv':
          await exportCSV();
          break;
        case 'json':
          await exportJSON();
          break;
        case 'png':
          await exportPNG();
          break;
        case 'excel':
          await exportExcel();
          break;
        case 'pdf':
          await exportPDF();
          break;
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }

  async function exportCSV() {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';
    const token = localStorage.getItem('bizintel_auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${apiBase}/datasets/${datasetId}/download`, {
      credentials: 'include',
      headers,
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dataset.originalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportJSON() {
    const data = {
      dataset: {
        id: dataset.id,
        name: dataset.name,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        createdAt: dataset.createdAt,
      },
      overview,
      quality,
      statistics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_statistics.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPNG() {
    // Export each chart as PNG
    for (const [key, el] of chartRefs) {
      try {
        const canvas = await html2canvas(el);
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataset.name}_chart_${key}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        console.error(`Failed to export chart ${key}:`, err);
      }
    }
  }

  async function exportExcel() {
    // Generate a simple Excel-compatible CSV with statistics
    let csv = 'Statistics Report\n';
    csv += `Dataset: ${dataset.name}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (overview) {
      csv += 'Overview\n';
      csv += `Rows,${overview.rowCount}\n`;
      csv += `Columns,${overview.columnCount}\n`;
      csv += `Numeric Columns,${overview.numericColumns}\n`;
      csv += `Categorical Columns,${overview.categoricalColumns}\n`;
      csv += `Missing Cells,${overview.missingValues} (${overview.missingPercent.toFixed(1)}%)\n`;
      csv += `Duplicate Rows,${overview.duplicateRows} (${overview.duplicatePercent.toFixed(1)}%)\n\n`;
    }

    if (statistics && statistics.length > 0) {
      csv += 'Column Statistics\n';
      csv += 'Column,Type,Count,Missing,Unique,Mean,Median,StdDev,Min,Max\n';
      for (const stat of statistics) {
        csv += `${stat.column},${stat.type},${stat.count},${stat.nullCount},${stat.uniqueCount}`;
        if (stat.numeric) {
          csv += `,${stat.numeric.mean},${stat.numeric.median},${stat.numeric.stddev},${stat.numeric.min},${stat.numeric.max}`;
        }
        csv += '\n';
      }
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_report.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    // For PDF export, we'll trigger the browser's print functionality
    // A proper implementation would use a library like jsPDF
    window.print();
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <DownloadIcon className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-bold text-white">Export</h2>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Export Options</h3>
        <p className="mb-6 text-xs text-slate-400">
          Export your analysis results in various formats. Charts can be exported as PNG images.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.id)}
              disabled={exporting === option.id}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:bg-white/[0.05] hover:border-white/20 disabled:opacity-50"
            >
              <span className="text-2xl">{option.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{option.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{option.description}</p>
              </div>
              {exporting === option.id && (
                <span className="mt-1 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Export Preview */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Export Preview</h3>
        <div className="space-y-3 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Dataset Name</span>
            <span className="font-medium text-white">{dataset.name}</span>
          </div>
          <div className="flex justify-between">
            <span>File Type</span>
            <span className="font-medium text-white">{dataset.fileType.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>File Size</span>
            <span className="font-medium text-white">{formatBytes(dataset.fileSize)}</span>
          </div>
          {overview && (
            <>
              <div className="flex justify-between">
                <span>Rows</span>
                <span className="font-medium text-white">{formatNumber(overview.rowCount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Columns</span>
                <span className="font-medium text-white">{overview.columnCount}</span>
              </div>
            </>
          )}
          {statistics && (
            <div className="flex justify-between">
              <span>Statistics Available</span>
              <span className="font-medium text-white">{statistics.length} columns</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Charts Available</span>
            <span className="font-medium text-white">{chartRefs.size} charts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple html2canvas-like function for chart export
async function html2canvas(el: HTMLDivElement): Promise<HTMLCanvasElement> {
  // Use the built-in canvas API for basic rendering
  const canvas = document.createElement('canvas');
  const rect = el.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Draw background
  ctx.fillStyle = '#1C1C1C';
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Draw text content
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('Chart Export', 20, 30);

  return canvas;
}
