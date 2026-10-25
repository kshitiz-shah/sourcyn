import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, DollarSign, Award, AlertCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { BentoCard } from '../bento/BentoCard';

export interface IntakeFormData {
  text: string;
  budget_ceiling?: number | null;
  target_delivery_date?: string | null;
  currency: string;
  required_certifications: string[];
}

interface IntakeCardProps {
  onStartEvaluation: (data: IntakeFormData) => Promise<void>;
  isLoading: boolean;
  clarificationQuestions?: string[];
  onSubmitClarification?: (answers: Record<string, string>) => void;
}

const PRESETS = [
  {
    title: '📱 iPhone 15 (128GB)',
    desc: 'Find the cheapest iPhone 15 128GB across verified Indian retailers (Flipkart, Amazon India, Croma, Reliance Digital, Vijay Sales).',
    certs: [],
  },
  {
    title: '🎧 Sony WH-1000XM5',
    desc: 'Find the cheapest Sony WH-1000XM5 wireless noise cancelling headphones in India with direct buy links.',
    certs: [],
  },
  {
    title: '💻 MacBook Pro M3',
    desc: 'Find the cheapest Apple MacBook Pro M3 laptop in India with 16GB RAM and fast shipping.',
    certs: [],
  },
  {
    title: '🏢 50 HPC Compute Servers',
    desc: 'Procure 50 high-density dual AMD EPYC server nodes in India with 512GB ECC DDR5, redundant 1600W PSUs, and 3-year on-site 4-hour NBD SLA.',
    certs: ['ISO 9001', 'ISO 27001', 'RoHS'],
  },
];

const AVAILABLE_CERTS = ['ISO 9001', 'ISO 27001', 'SOC 2', 'HIPAA', 'CE', 'RoHS', 'ITAR'];
const DRAFT_STORAGE_KEY = 'sourcyn:intake-draft';

interface IntakeDraft {
  text: string;
  budget: string;
  deliveryDate: string;
  currency: string;
  selectedCerts: string[];
}

const DEFAULT_DRAFT: IntakeDraft = {
  text: PRESETS[0].desc,
  budget: '',
  deliveryDate: '',
  currency: 'INR',
  selectedCerts: PRESETS[0].certs,
};

const getInitialDraft = (): IntakeDraft => {
  try {
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDraft) return DEFAULT_DRAFT;

    const parsed = JSON.parse(savedDraft) as Partial<IntakeDraft>;
    if (
      typeof parsed.text !== 'string' ||
      !Array.isArray(parsed.selectedCerts)
    ) {
      return DEFAULT_DRAFT;
    }

    return {
      text: parsed.text,
      budget: typeof parsed.budget === 'string' ? parsed.budget : (typeof parsed.budget === 'number' ? String(parsed.budget) : ''),
      deliveryDate: typeof parsed.deliveryDate === 'string' ? parsed.deliveryDate : '',
      currency: typeof parsed.currency === 'string' ? parsed.currency : 'INR',
      selectedCerts: parsed.selectedCerts.filter((cert): cert is string => typeof cert === 'string'),
    };
  } catch (error) {
    console.warn('Unable to restore the saved intake draft', error);
    return DEFAULT_DRAFT;
  }
};

export const IntakeCard: React.FC<IntakeCardProps> = ({
  onStartEvaluation,
  isLoading,
  clarificationQuestions = [],
  onSubmitClarification,
}) => {
  const [initialDraft] = useState<IntakeDraft>(getInitialDraft);
  const [text, setText] = useState<string>(initialDraft.text);
  const [budget, setBudget] = useState<string>(initialDraft.budget);
  const [deliveryDate, setDeliveryDate] = useState<string>(initialDraft.deliveryDate);
  const [currency, setCurrency] = useState<string>(initialDraft.currency);
  const [selectedCerts, setSelectedCerts] = useState<string[]>(initialDraft.selectedCerts);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      try {
        const draft: IntakeDraft = { text, budget, deliveryDate, currency, selectedCerts };
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (error) {
        console.warn('Unable to save the intake draft', error);
      }
    }, 300);

    return () => window.clearTimeout(saveTimer);
  }, [text, budget, deliveryDate, currency, selectedCerts]);

  const toggleCert = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setText(preset.desc);
    setSelectedCerts(preset.certs);
  };

  const handleResetDraft = () => {
    setText(DEFAULT_DRAFT.text);
    setBudget(DEFAULT_DRAFT.budget);
    setDeliveryDate(DEFAULT_DRAFT.deliveryDate);
    setCurrency(DEFAULT_DRAFT.currency);
    setSelectedCerts(DEFAULT_DRAFT.selectedCerts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onStartEvaluation({
      text,
      budget_ceiling: budget.trim() ? Number(budget) : undefined,
      target_delivery_date: deliveryDate.trim() ? deliveryDate : undefined,
      currency,
      required_certifications: selectedCerts,
    });
  };

  return (
    <BentoCard
      title="Requirement Intake & Analysis"
      subtitle="Agent 1: Structured LLM parsing & policy constraint gating"
      icon={Sparkles}
      badge="Agent 1 Active"
      badgeColor="peach"
      colSpan="col-span-1"
      className="lg:col-span-2"
      glow="peach"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Preset Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">Quick-Load RFP Templates</label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Auto-populates parameters</span>
              <button
                type="button"
                onClick={handleResetDraft}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition"
                title="Restore the default intake template"
              >
                Reset draft
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-left px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-slate-700 transition text-xs font-medium text-slate-300 truncate"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Natural Language RFP Spec */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Natural Language Specification & Commercial Terms
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#FAD4C0]/60 focus:ring-1 focus:ring-[#FAD4C0]/40 transition"
            placeholder="Describe the items, technical requirements, SLAs, warranties, and delivery constraints..."
            required
          />
        </div>

        {/* Financial Ceiling & Target Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Budget Ceiling <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-300 px-1.5 py-0.5 focus:outline-none"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
            <div className="relative">
              {currency === 'INR' ? (
                <span className="text-slate-400 font-bold absolute left-3 top-2 text-sm leading-none">₹</span>
              ) : (
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              )}
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="No limit (leave empty)"
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#FAD4C0]/60 focus:ring-1 focus:ring-[#FAD4C0]/40 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Required Delivery By <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#FAD4C0]/60 focus:ring-1 focus:ring-[#FAD4C0]/40 transition"
              />
            </div>
          </div>
        </div>

        {/* Required Certifications Multi-select */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#80A1C1]" />
            <span>Mandatory Compliance Certifications</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_CERTS.map((cert) => {
              const isSelected = selectedCerts.includes(cert);
              return (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleCert(cert)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? 'bg-[#80A1C1]/20 text-[#80A1C1] border border-[#80A1C1]/40'
                      : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cert}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clarification Loop (Agent 1 Cyclic Feedback) */}
        {clarificationQuestions.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Agent 1 Flagged Missing Requirement Specifics</span>
            </div>
            <p className="text-[11px] text-amber-200/80">
              The requirement analysis agent identified ambiguities in the request. Please provide clarification:
            </p>
            {clarificationQuestions.map((q, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[11px] text-slate-300 font-medium block">Q{idx + 1}: {q}</span>
                <input
                  type="text"
                  placeholder="Provide clarification details..."
                  onChange={(e) =>
                    setClarificationAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                  }
                  className="w-full rounded-lg bg-slate-900 border border-amber-500/30 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
            {onSubmitClarification && (
              <button
                type="button"
                onClick={() => onSubmitClarification(clarificationAnswers)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Submit Clarifications & Resume Graph
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FAD4C0] via-amber-200 to-[#80A1C1] text-slate-950 font-extrabold text-xs tracking-wide shadow-lg shadow-[#FAD4C0]/20 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Multi-Agent Internet Search & Price Analysis...</span>
              </>
            ) : (
              <>
                <span>🚀 Find Cheapest Price on Internet (Run Multi-Agent Search)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </BentoCard>
  );
};
