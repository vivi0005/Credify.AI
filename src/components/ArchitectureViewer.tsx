import React, { useState, useEffect } from 'react';
import type { FlaskCodeFile } from '../types';

export const ArchitectureViewer: React.FC = () => {
  const [files, setFiles] = useState<FlaskCodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<FlaskCodeFile | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/code/files')
      .then((res) => res.json())
      .then((data: FlaskCodeFile[]) => {
        setFiles(data);
        if (data.length > 0) setSelectedFile(data[0]);
      })
      .catch((err) => console.error('Failed to load code files', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
              Python Backend Architecture
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Flask Application Factory Pattern &amp; Blueprint Layout
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-grade decoupling of extensions, SQLAlchemy database models, and REST routing blueprints
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              10 Source Files · Full Decoupling
            </span>
          </div>
        </div>

        {/* Architecture Key Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-emerald-400 mb-1">
              create_app() Factory
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically binds configuration and registered blueprints inside <code className="text-slate-300 font-mono">app.py</code>, enabling multi-environment isolation (Testing, Dev, Production).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-blue-400 mb-1">
              extension.py Decoupling
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantiates unattached <code className="text-slate-300 font-mono">SQLAlchemy()</code> and <code className="text-slate-300 font-mono">CORS()</code> objects to categorically eliminate circular import loops.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs font-semibold text-amber-400 mb-1">
              Service Layer Separation
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Business logic and amortization math reside in <code className="text-slate-300 font-mono">services/eligibility.py</code>, cleanly separated from HTTP route serialization in <code className="text-slate-300 font-mono">routes/loan.py</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* File Directory Sidebar */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-3">
            credify-ai/ Codebase
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading codebase manifest...</div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => {
                const isSelected = selectedFile?.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border border-slate-700/80 text-white shadow-sm'
                        : 'hover:bg-slate-900 text-slate-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium font-mono text-slate-200 truncate">
                        {file.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {file.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {file.description}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Code Content Viewer */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/95 overflow-hidden">
          {selectedFile ? (
            <>
              {/* Code Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {selectedFile.path}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ({selectedFile.content.split('\n').length} lines)
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>

              {/* Code Box with Line Numbers */}
              <div className="p-4 overflow-x-auto overflow-y-auto max-h-[580px] font-mono text-xs text-slate-300 leading-relaxed">
                <table className="w-full border-collapse">
                  <tbody>
                    {selectedFile.content.split('\n').map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="w-10 select-none pr-4 text-right text-slate-600 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="whitespace-pre">{line}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Select a file from the explorer on the left.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
