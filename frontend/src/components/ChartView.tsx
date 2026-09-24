import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import { BarChart3, Maximize2, Minimize2, Download, Code2, RefreshCw, Sparkles } from 'lucide-react';
import type { ChartEvent } from '../types';

interface ChartViewProps {
  chart: ChartEvent['chart'] | null;
  onLoadSampleChart?: () => void;
}

export const ChartView: React.FC<ChartViewProps> = ({ chart, onLoadSampleChart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chart && chart.data && chart.data.length > 0) {
      // Deep clone layout to prevent mutating original
      const customLayout = {
        ...chart.layout,
        autosize: true,
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.4)',
        font: {
          family: 'Inter, system-ui, sans-serif',
          color: '#e2e8f0',
          size: 12,
        },
        margin: { t: 45, r: 30, l: 50, b: 45, ...(chart.layout?.margin || {}) },
        xaxis: {
          gridcolor: '#1e293b',
          zerolinecolor: '#334155',
          tickfont: { color: '#94a3b8' },
          ...(chart.layout?.xaxis || {}),
        },
        yaxis: {
          gridcolor: '#1e293b',
          zerolinecolor: '#334155',
          tickfont: { color: '#94a3b8' },
          ...(chart.layout?.yaxis || {}),
        },
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'],
        toImageButtonOptions: {
          format: 'png' as const,
          filename: 'voice_bi_chart',
          height: 600,
          width: 900,
          scale: 2,
        },
      };

      Plotly.react(containerRef.current, chart.data, customLayout, config);
    } else {
      Plotly.purge(containerRef.current);
    }

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [chart]);

  const handleDownloadPng = () => {
    if (containerRef.current) {
      Plotly.downloadImage(containerRef.current, {
        format: 'png',
        filename: 'bi_dashboard_chart',
        height: 700,
        width: 1000,
      });
    }
  };

  const handleResetAxes = () => {
    if (containerRef.current) {
      Plotly.relayout(containerRef.current, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      });
    }
  };

  return (
    <div
      className={`relative flex flex-col h-full bg-dark-900 border border-dark-700/70 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-dark-950/95 backdrop-blur-xl' : ''
      }`}
    >
      {/* Viewport Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-700/60 bg-dark-850/50 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Chart Viewport
              {chart?.layout?.title?.text && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-sky-300 font-medium border border-dark-600">
                  {typeof chart.layout.title === 'string' ? chart.layout.title : chart.layout.title.text}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {chart && (
            <>
              <button
                onClick={handleResetAxes}
                title="Reset Zoom / Pan"
                className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadPng}
                title="Download PNG"
                className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowJsonModal(true)}
                title="Inspect Plotly JSON"
                className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="p-1.5 rounded-lg hover:bg-dark-700 text-slate-400 hover:text-slate-200 transition-colors ml-1"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      <div className="relative flex-1 w-full h-full min-h-[350px] p-2 flex items-center justify-center">
        <div
          ref={containerRef}
          className={`w-full h-full ${chart ? 'block' : 'hidden'}`}
          style={{ minHeight: '320px' }}
        />

        {!chart && (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/5">
              <BarChart3 className="w-8 h-8 text-sky-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1.5">No Active Chart</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Ask a question via microphone or chat to generate a live visual representation of your SQLite data.
            </p>
            {onLoadSampleChart && (
              <button
                onClick={onLoadSampleChart}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-dark-800 hover:bg-dark-700 text-sky-400 border border-dark-600 hover:border-sky-500/40 transition-all shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Chart
              </button>
            )}
          </div>
        )}
      </div>

      {/* Raw JSON Modal */}
      {showJsonModal && chart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-700">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                Plotly JSON Specification
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-medium px-2 py-1 rounded-lg hover:bg-dark-850"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs text-emerald-400 bg-dark-950/80 rounded-b-2xl">
              <pre>{JSON.stringify(chart, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
