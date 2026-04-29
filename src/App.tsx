import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Briefcase, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  Download, 
  Rocket, 
  ShieldAlert,
  Loader2,
  Trash2,
  ArrowRight
} from "lucide-react";
import { aiService } from "./services/api";
import { Decision, AppState } from "./types";

export default function App() {
  const [state, setState] = useState<AppState>({
    jd: "",
    resume: "",
    analysis: null,
    optimizedResume: null,
    defendability: null,
    isAnalyzing: false,
    error: null,
  });

  const handleAnalyze = async () => {
    if (!state.jd || !state.resume) return;

    setState((s) => ({ ...s, isAnalyzing: true, analysis: null, optimizedResume: null, defendability: null, error: null }));

    try {
      const analysis = await aiService.analyze(state.jd, state.resume);
      
      let optimized = null;
      let defendability = null;

      if (analysis.decision === Decision.APPLY || analysis.decision === Decision.MAYBE) {
        const [opt, def] = await Promise.all([
          aiService.optimize(state.jd, state.resume),
          aiService.checkDefendability(state.resume)
        ]);
        optimized = opt;
        defendability = def;
      }

      setState((s) => ({
        ...s,
        analysis,
        optimizedResume: optimized?.optimized_resume || null,
        defendability,
        isAnalyzing: false,
      }));
    } catch (err: any) {
      console.error(err);
      setState((s) => ({ 
        ...s, 
        isAnalyzing: false, 
        error: err.message || "Something went wrong. Please try again." 
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDecisionBadgeStyles = (decision: Decision) => {
    switch (decision) {
      case Decision.APPLY: return "bg-emerald-100 text-emerald-800";
      case Decision.MAYBE: return "bg-amber-100 text-amber-800";
      case Decision.SKIP: return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden overflow-x-auto min-w-[1024px]">
      {/* Header */}
      <header className="h-[52px] bg-ink text-white flex items-center justify-between px-6 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h1 className="text-[14px] uppercase font-bold tracking-[0.1em] flex items-center gap-2">
            Smart Job Application Engine
            <span className="opacity-40 font-normal">v1.1.0</span>
          </h1>
          <div className="h-4 w-px bg-white/20 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-accent animate-pulse" />
            <span className="text-[10px] uppercase font-semibold text-white/60 tracking-wider">Gemini-3.1-Flash Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {state.error && (
            <div className="flex items-center gap-2 text-rose-400 text-[11px] font-medium bg-rose-950/30 px-3 py-1 rounded border border-rose-900/50">
              <AlertCircle className="w-3 h-3" />
              {state.error}
            </div>
          )}
          <button 
            onClick={() => setState({ jd: "", resume: "", analysis: null, optimizedResume: null, defendability: null, isAnalyzing: false, error: null })}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
            title="Clear all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-[300px_1fr_320px] gap-px bg-border overflow-hidden">
        
        {/* Pane 1: Input Context */}
        <div className="pane">
          <div className="pane-header">
            <span className="pane-title">Input Context</span>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
            <div className="flex-1 flex flex-col min-h-0">
              <label className="section-label">Target Job Description</label>
              <textarea
                className="mini-editor flex-1 resize-none"
                placeholder="Paste Job Description here..."
                value={state.jd}
                onChange={(e) => setState({ ...state, jd: e.target.value })}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <label className="section-label">Current Resume Source</label>
              <textarea
                className="mini-editor flex-1 resize-none"
                placeholder="Paste Resume Content / LaTeX here..."
                value={state.resume}
                onChange={(e) => setState({ ...state, resume: e.target.value })}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!state.jd || !state.resume || state.isAnalyzing}
              className="btn-main btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {state.isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing Engine...
                </>
              ) : (
                <>
                  <Rocket className="w-3 h-3" />
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pane 2: Engine Analysis */}
        <div className="pane">
          <div className="pane-header">
            <span className="pane-title">Engine Analysis (Gemini-3.1-Flash)</span>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
            {state.analysis ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Score & Recommendation Card */}
                <div className="bg-white border border-border p-6 rounded-lg shadow-sm flex items-center gap-8">
                  <div className="score-circle">
                    <div className="text-2xl font-black">{state.analysis.match_score}</div>
                    <div className="text-[9px] font-bold uppercase opacity-40">Match %</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="section-label text-[9px] mb-1">Recommendation</div>
                    <div className={`decision-badge inline-block ${getDecisionBadgeStyles(state.analysis.decision)}`}>
                      {state.analysis.decision}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal max-w-md">
                      AI detected <span className="font-bold">{state.analysis.matched_skills.length} core technical alignments</span>. 
                      {state.analysis.decision === Decision.APPLY 
                        ? " Proceeding with resume optimization." 
                        : " Technical match is moderate; review skill gaps before applying."}
                    </p>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="section-label flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-accent" />
                      Matched Skills
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {state.analysis.matched_skills.map((skill) => (
                        <div key={skill} className="skill-item skill-item-matched">
                          {skill}
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">High</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="section-label flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-rose-accent" />
                      Skill Gaps
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {state.analysis.missing_skills.map((skill) => (
                        <div key={skill} className="skill-item skill-item-missing">
                          {skill}
                          <span className="text-[9px] font-bold text-rose-600 uppercase">Med</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Defendability Warnings */}
                {state.defendability && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <label className="section-label">Interview Defendability Warnings</label>
                    <div className="flex flex-col gap-2">
                      {state.defendability.risky_claims.map((risk, i) => (
                        <div key={i} className="warning-box">
                          <p className="warning-text">
                            <strong className="uppercase mr-1">Warning:</strong> 
                            Claim regarding "{risk.claim}" is potentially weak. {risk.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-4 p-12">
                <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center">
                  <Rocket className="w-6 h-6 opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Engine Idle</h3>
                  <p className="text-[11px] max-w-[200px]">Provide input context and click "Run Analysis" to initialize Gemini processing.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pane 3: Optimized Output */}
        <div className="pane">
          <div className="pane-header">
            <span className="pane-title">Optimized Output</span>
          </div>
          <div className="flex-1 flex flex-col p-4 bg-slate-50/50">
            {state.optimizedResume ? (
              <div className="flex-1 flex flex-col gap-4">
                <label className="section-label">ATS-Optimized LaTeX Resume</label>
                <div className="flex-1 min-h-0 relative group">
                  <pre className="latex-view h-full scrollbar-hide whitespace-pre-wrap">
                    {state.optimizedResume}
                  </pre>
                  <button 
                    onClick={() => copyToClipboard(state.optimizedResume!)}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded transition-all backdrop-blur-sm shadow-xl"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-main btn-secondary flex-1 py-3">View PDF</button>
                  <button className="btn-main btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center space-y-4 p-8">
                <div className="w-12 h-12 bg-white border border-border rounded shadow-sm flex items-center justify-center">
                  <FileText className="w-5 h-5 opacity-40 text-slate-400" />
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Waiting for result...</p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
