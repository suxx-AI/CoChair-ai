import React, { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import {
  Maximize2,
  Minimize2,
  Download,
  Code2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  BarChart,
} from 'lucide-react';
import type { ChartEvent, AgentState } from '../types';

interface ChartViewProps {
  chart: ChartEvent['chart'] | null;
  executiveInsight?: string | null;
  agentState?: AgentState;
  onLoadSampleChart?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const ChartView: React.FC<ChartViewProps> = ({
  chart,
  executiveInsight,
  agentState,
  onLoadSampleChart,
  onSelectPrompt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chart && chart.data && chart.data.length > 0) {
      // CoChair Executive Dark Theme layout configuration
      const customLayout = {
        ...chart.layout,
        autosize: true,
        paper_bgcolor: 'rgba(0, 0, 0, 0)',
        plot_bgcolor: 'rgba(11, 16, 28, 0.65)',
        font: {
          family: 'Inter, system-ui, sans-serif',
          color: '#e2e8f0',
          size: 12,
        },
        margin: { t: 40, r: 25, l: 45, b: 40, ...(chart.layout?.margin || {}) },
        xaxis: {
          gridcolor: 'rgba(30, 41, 59, 0.7)',
          zerolinecolor: 'rgba(51, 65, 85, 0.8)',
          tickfont: { color: '#94a3b8', size: 11 },
          ...(chart.layout?.xaxis || {}),
        },
        yaxis: {
          gridcolor: 'rgba(30, 41, 59, 0.7)',
          zerolinecolor: 'rgba(51, 65, 85, 0.8)',
          tickfont: { color: '#94a3b8', size: 11 },
          ...(chart.layout?.yaxis || {}),
        },
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
          'sendDataToCloud',
          'hoverClosestCartesian',
          'hoverCompareCartesian',
        ],
        toImageButtonOptions: {
          format: 'png' as const,
          filename: 'cochair_executive_intelligence_visual',
          height: 650,
          width: 950,
          scale: 2,
        },
      };

      Plotly.react(containerRef.current, chart.data, customLayout, config);
    } else {
      Plotly.purge(containerRef.current);
    }

    const handleResize = () => {
      if (chart && containerRef.current && containerRef.current.offsetParent !== null) {
        try {
          Plotly.Plots.resize(containerRef.current);
        } catch {
          // Ignore resize errors when container is not displayed
        }
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
        filename: 'cochair_executive_visual',
        height: 720,
        width: 1080,
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

  const sampleTriggers = [
    'Can we see total sales by country from our invoices?',
    'Create a bar chart of product prices',
    'Calculate correlation between age and order counts',
  ];

  return (
    <div
      className={`relative flex flex-col h-full bg-dark-900 border border-dark-800 rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50 bg-dark-950' : ''
      }`}
    >
      {/* Viewport Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-800 bg-dark-900">
        <div className="flex items-center gap-2">
          <BarChart className="w-4 h-4 text-cochair-blue-bright" />
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            Analytics Viewport
            {chart?.layout?.title && (
              <span className="text-xs text-slate-400 font-normal">
                — {typeof chart.layout.title === 'string'
                  ? chart.layout.title
                  : chart.layout.title.text}
              </span>
            )}
          </h2>
        </div>

        {/* Viewport Action Controls */}
        <div className="flex items-center gap-1">
          {chart && (
            <>
              <button
                onClick={handleResetAxes}
                title="Reset Zoom / Pan"
                className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDownloadPng}
                title="Export PNG"
                className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors duration-150"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowJsonModal(true)}
                title="Inspect Plotly JSON Spec"
                className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors duration-150"
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="p-1.5 rounded hover:bg-dark-800 text-slate-400 hover:text-slate-200 transition-colors duration-150 ml-1"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Integrated Executive Takeaway Section (Directly on viewport surface, hairline divided) */}
      <div className="px-4 py-2.5 border-b border-dark-800 bg-dark-900">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-cochair-blue-bright" />
            <span>Executive Takeaway</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {agentState === 'Thinking'
              ? 'Synthesizing...'
              : chart
              ? 'Synthesized'
              : 'Standby'}
          </span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          {executiveInsight ||
            'Awaiting analytical trigger. CoChair monitors speech in the background, executing SQL queries and rendering visualizations as inquiries occur.'}
        </p>
      </div>

      {/* Visual Canvas or Clean Intentional Empty State */}
      <div className="relative flex-1 w-full h-full min-h-[320px] p-3 flex items-center justify-center">
        {/* Plotly Canvas Container */}
        <div
          ref={containerRef}
          className={`w-full h-full ${chart ? 'block' : 'hidden'}`}
          style={{ minHeight: '300px' }}
        />

        {/* Clean Technical Empty State */}
        {!chart && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
            <div className="w-10 h-10 rounded-md bg-dark-850 border border-dark-800 flex items-center justify-center mb-3">
              <BarChart className="w-5 h-5 text-cochair-blue-bright" />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Ambient listener active</span>
            </div>

            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Awaiting Analytics Query
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5 max-w-sm">
              Casual banter is filtered out. Inquiries for data, metrics, or comparisons trigger SQL generation and render charts here.
            </p>

            {/* Quick Trigger Suggestions */}
            <div className="w-full flex flex-col gap-2 mb-4">
              <span className="text-xs text-slate-500">
                Sample speech inquiries:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {sampleTriggers.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectPrompt && onSelectPrompt(prompt)}
                    className="text-xs px-2.5 py-1 rounded bg-dark-850 hover:bg-dark-800 text-slate-300 border border-dark-800 hover:border-dark-700 transition-colors duration-150 text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Load Sample Visual Button */}
            {onLoadSampleChart && (
              <button
                onClick={onLoadSampleChart}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md bg-cochair-blue hover:bg-cochair-blue-bright text-white transition-colors duration-150"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Visual</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Raw Plotly JSON Modal */}
      {showJsonModal && chart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-900 border border-dark-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cochair-blue-bright" />
                Plotly JSON Spec
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-medium px-2 py-1 rounded hover:bg-dark-800 transition-colors duration-150"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs text-slate-300 bg-dark-950">
              <pre>{JSON.stringify(chart, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
