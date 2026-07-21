/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  Zap,
  Search,
  Music,
  Sparkles,
  FileJson,
  FileCode,
  Loader2
} from 'lucide-react';
import { analyzeScript } from './services/geminiService';
import { VideoBlueprint } from './types';
import { generateEDL, generateXML, downloadFile, sanitizeFileName } from './utils/exportUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<VideoBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyPrompt = async (prompt: string, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 2000);
    } catch (err) {
      console.error('Failed to copy prompt', err);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeScript(script);
      setBlueprint(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze script. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportEDL = () => {
    if (!blueprint) return;
    const edl = generateEDL(blueprint);
    downloadFile(edl, `${sanitizeFileName(blueprint.title)}.edl`, 'text/plain');
  };

  const exportXML = () => {
    if (!blueprint) return;
    const xml = generateXML(blueprint);
    downloadFile(xml, `${sanitizeFileName(blueprint.title)}.xml`, 'text/xml');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] font-sans selection:bg-[#00FF00] selection:text-[#000000]">
      {/* Header */}
      <header className="border-b-2 border-black p-6 flex justify-between items-center sticky top-0 bg-white z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#00FF00] p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Video className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Asset Strategist AI</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest opacity-50">
          <span>Lead Video Research</span>
          <span>Asset Strategy</span>
          <span>Hidef Standards</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[calc(100vh-88px)]">
        {/* Sidebar: Input */}
        <aside className="border-r-2 border-black p-8 bg-[#F5F5F5] lg:sticky lg:top-[88px] lg:h-[calc(100vh-88px)] overflow-y-auto">
          <div className="space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#00FF00] fill-[#00FF00]" />
                <h2 className="text-sm font-black uppercase tracking-widest">Input Script</h2>
              </div>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your raw video script here... (e.g. 'In a world where AI takes over...')"
                className="w-full h-64 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all resize-none font-mono text-sm"
              />
            </section>

            <button
              onClick={handleGenerate}
              disabled={loading || !script.trim()}
              className={cn(
                "w-full py-4 bg-[#00FF00] border-2 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3",
                (loading || !script.trim()) && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Blueprint
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold uppercase">
                {error}
              </div>
            )}

            {blueprint && (
              <section className="space-y-4 pt-8 border-t-2 border-black/10">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Export Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={exportEDL}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00FF00] transition-colors group"
                  >
                    <FileCode className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">EDL Export</span>
                  </button>
                  <button
                    onClick={exportXML}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#00FF00] transition-colors group"
                  >
                    <FileJson className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase">XML Export</span>
                  </button>
                </div>
              </section>
            )}
          </div>
        </aside>

        {/* Main Content: Results */}
        <div className="p-8 bg-white overflow-x-auto">
          <AnimatePresence mode="wait">
            {!blueprint ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20"
              >
                <Video className="w-24 h-24 stroke-[1px]" />
                <p className="text-2xl font-black uppercase tracking-tighter max-w-md">
                  Awaiting Script Input for Production Analysis
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <header className="space-y-2">
                  <div className="inline-block bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                    Production Blueprint
                  </div>
                  <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">
                    {blueprint.title}
                  </h2>
                  <p className="text-xl font-medium italic text-gray-500">
                    Tone: {blueprint.overallTone}
                  </p>
                </header>

                <div className="space-y-8">
                  <div className="grid grid-cols-[80px_1.5fr_1.2fr_1.2fr_1.2fr] gap-6 border-b-4 border-black pb-4 text-[10px] font-black uppercase tracking-widest">
                    <div>Time</div>
                    <div>Script & Concept</div>
                    <div>Stock & Search</div>
                    <div>Viral & Audio</div>
                    <div>AI Prompt</div>
                  </div>

                  {blueprint.segments.map((seg, i) => (
                    <motion.div
                      key={`${seg.timestamp}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="grid grid-cols-[80px_1.5fr_1.2fr_1.2fr_1.2fr] gap-6 border-b-2 border-black/10 pb-8 group hover:bg-[#F5F5F5] -mx-4 px-4 transition-colors relative"
                    >
                      {i === 0 && (
                        <div className="absolute -left-2 top-0 bg-[#00FF00] text-black text-[8px] font-black uppercase px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                          Hook Moment (0-3s)
                        </div>
                      )}
                      <div className="font-mono text-sm font-bold pt-1">
                        {seg.timestamp}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="text-sm font-bold italic leading-relaxed">
                            "{seg.segment}"
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase opacity-50">Visual Concept</span>
                          <p className="text-xs font-medium">{seg.visualConcept}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {seg.stockQuery.map((q, j) => (
                            <span key={j} className="px-2 py-1 bg-black text-white text-[9px] font-bold uppercase">
                              {q}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <a href={seg.searchLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#00FF00] transition-colors">
                            <Search className="w-3 h-3" /> YouTube (4K)
                          </a>
                          <a href={seg.searchLinks.movieClips} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#00FF00] transition-colors">
                            <Search className="w-3 h-3" /> Movie Scenes
                          </a>
                          <a href={seg.searchLinks.pexels} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#00FF00] transition-colors">
                            <Search className="w-3 h-3" /> Pexels Stock
                          </a>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <a href={seg.searchLinks.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#00FF00] transition-colors">
                            <Search className="w-3 h-3" /> TikTok Memes
                          </a>
                          <a href={seg.searchLinks.giphy} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#00FF00] transition-colors">
                            <Search className="w-3 h-3" /> Giphy Reaction
                          </a>
                        </div>
                        <div className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <p className="text-[10px] font-black uppercase leading-tight">
                            {seg.memeReference}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00FF00] bg-black p-1 px-2">
                          <Music className="w-3 h-3" /> {seg.audioVibe}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="p-4 bg-black text-[#00FF00] font-mono text-[10px] leading-relaxed border-2 border-black">
                          {seg.veoPrompt}
                        </div>
                        <button
                          onClick={() => copyPrompt(seg.veoPrompt, i)}
                          className={cn(
                            "w-full py-2 border-2 border-black text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors active:translate-y-0.5",
                            copiedIndex === i ? "bg-[#00FF00]" : "bg-white hover:bg-[#00FF00]"
                          )}
                        >
                          {copiedIndex === i ? 'Copied!' : 'Copy Prompt'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Marquee */}
      <footer className="border-t-2 border-black bg-black text-white py-2 overflow-hidden whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 text-[10px] font-black uppercase tracking-[0.5em]"
        >
          <span>ASSET STRATEGIST AI // LEAD VIDEO RESEARCH // MARCH 2026 // HIDEF NATIONS STANDARD // VEO 3.1 READY // EDL SYNC ENABLED</span>
          <span>ASSET STRATEGIST AI // LEAD VIDEO RESEARCH // MARCH 2026 // HIDEF NATIONS STANDARD // VEO 3.1 READY // EDL SYNC ENABLED</span>
        </motion.div>
      </footer>
    </div>
  );
}
