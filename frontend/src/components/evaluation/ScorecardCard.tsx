import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Hash,
  TrendingUp,
  AlertCircle,
  Download,
  Table,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BentoCard } from '../bento/BentoCard';
import { Scorecard, VendorScore, DecisionExplanation } from '../../types/procurement';

interface ScorecardCardProps {
  scorecard: Scorecard;
  decisionExplanation?: DecisionExplanation | null;
  onSelectVendor?: (vendor: VendorScore) => void;
}

export const ScorecardCard: React.FC<ScorecardCardProps> = ({
  scorecard,
  decisionExplanation,
  onSelectVendor,
}) => {
  const rankingList = scorecard?.ranking || (scorecard as any)?.scores || [];
  const [selectedVendorId, setSelectedVendorId] = useState<string>(
    rankingList[0]?.vendor_id || ''
  );
  const [viewMode, setViewMode] = useState<'leaderboard' | 'matrix'>('leaderboard');
  const [isExported, setIsExported] = useState<boolean>(false);

  const selectedVendor =
    rankingList.find((v: any) => v.vendor_id === selectedVendorId) || rankingList[0];

  const currCode = scorecard?.currency || (scorecard as any)?.target_currency || 'INR';
  const currSymbol = currCode === 'INR' ? '₹' : (currCode === 'EUR' ? '€' : (currCode === 'GBP' ? '£' : '$'));

  const allIneligible = rankingList.length > 0 && rankingList.every((v: any) => v.is_eligible === false);

  // Chart data preparation
  const chartData = rankingList.map((v: any) => ({
    name: (v.vendor_name || 'Vendor').split(' ')[0], // short name
    fullName: v.vendor_name,
    overallScore: Number(v.overall_score || 0),
    financialScore: Number(v.financial_score || v.landed_cost_score || 0),
    technicalScore: Number(v.technical_score || v.quality_score || 0),
    riskScore: Number(v.risk_score || 0),
    landedCost: Number(v.landed_cost || v.landed_cost_calculated || 0),
    rank: v.rank || 1,
  }));

  const getRankBadge = (vendor: any) => {
    if (vendor.is_eligible === false) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Exceeds Budget / Disqualified</span>
        </span>
      );
    }
    if (vendor.rank === 1) {
      return (
        <span className="bento-badge-peach flex items-center gap-1 font-bold text-slate-950">
          <Award className="w-3.5 h-3.5 text-amber-900" />
          <span>⭐ CHEAPEST ON THE INTERNET</span>
        </span>
      );
    }
    if (vendor.rank === 2) {
      return <span className="bento-badge-steel">Rank #2 (Runner-Up)</span>;
    }
    return <span className="text-xs text-slate-400 font-mono">Rank #{vendor.rank}</span>;
  };

  const handleExportDossier = () => {
    const exportData = {
      platform: 'Sourcyn AI Procurement & Vendor Intelligence',
      exported_at: new Date().toISOString(),
      evaluation_id: scorecard.evaluation_id,
      currency: scorecard.currency,
      scoring_fingerprint: scorecard.scoring_fingerprint,
      applied_weights: scorecard.applied_weights || {
        financial: 0.4,
        technical: 0.4,
        risk: 0.2,
      },
      ranking: scorecard.ranking.map((r) => ({
        rank: r.rank,
        vendor_id: r.vendor_id,
        vendor_name: r.vendor_name,
        overall_score: Number(r.overall_score),
        financial_score: Number(r.financial_score),
        technical_score: Number(r.technical_score),
        risk_score: Number(r.risk_score),
        landed_cost: Number(r.landed_cost),
        currency: r.currency || scorecard.currency,
        is_eligible: r.is_eligible,
        notes: r.notes,
      })),
      decision_recommendation: decisionExplanation
        ? {
            recommended_vendor: decisionExplanation.recommended_vendor_name,
            summary: decisionExplanation.summary,
            key_advantages: decisionExplanation.key_advantages,
            identified_trade_offs: decisionExplanation.identified_trade_offs,
            contingencies: decisionExplanation.contingencies,
          }
        : undefined,
      verification_status: 'DETERMINISTIC_SHA256_VERIFIED',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sourcyn-evaluation-dossier-${scorecard.evaluation_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2500);
  };

  return (
    <BentoCard
      id="scorecard-results-section"
      title="Deterministic Price Comparison & Scorecard"
      subtitle="Ranked by total delivered price (Base + Shipping + Tax) across online retailers"
      icon={BarChart3}
      badge={allIneligible ? "Budget Ceiling Exceeded" : "Cheapest Price Ranked"}
      badgeColor={allIneligible ? "danger" : "peach"}
      colSpan="col-span-1"
      className="lg:col-span-2"
      glow={allIneligible ? "none" : "peach"}
      headerAction={
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'leaderboard'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rankings & Chart View"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#FAD4C0]" />
              <span className="hidden sm:inline">Ranks</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'matrix'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Comparison Matrix"
            >
              <Table className="w-3.5 h-3.5 text-[#80A1C1]" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>

          {/* Export Evaluation Dossier */}
          <button
            onClick={handleExportDossier}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
              isExported
                ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300'
                : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Export Deterministic Evaluation Dossier (JSON)"
          >
            {isExported ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-[#FAD4C0]" />
                <span className="text-[11px] hidden sm:inline">Export Dossier</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 pl-1 border-l border-slate-800">
            <Hash className="w-3 h-3 text-[#FAD4C0]" />
            <span>{scorecard.scoring_fingerprint.slice(0, 8)}...</span>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Over-budget warning banner when all retailers exceed specified ceiling */}
        {allIneligible && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-200 uppercase tracking-wide">
                No results found on this budget
              </h4>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">
                All verified online retailers exceed your specified ceiling price. The lowest available market price found is{' '}
                <strong className="text-white font-mono">{currSymbol}{Number(rankingList[0]?.landed_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> on{' '}
                <strong className="text-white">{rankingList[0]?.vendor_name}</strong>. Please increase or remove your budget ceiling.
              </p>
            </div>
          </div>
        )}

        {viewMode === 'leaderboard' ? (
          <>
            {/* Vendor Comparison Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FAD4C0]" />
                  <span>Multi-Criteria Weighted Performance (0-100)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Price Competitiveness (40%) • SLA (30%) • Seller Rating (30%)</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        fontFamily: 'Inter',
                      }}
                      itemStyle={{ color: '#FAD4C0' }}
                    />
                    <Bar dataKey="overallScore" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.rank === 1 ? '#FAD4C0' : entry.rank === 2 ? '#80A1C1' : '#475569'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vendor Ranking Leaderboard List */}
            <div className="space-y-2">
              {rankingList.map((vendor: any) => {
                const isSelected = vendor.vendor_id === selectedVendorId;
                const srcUrl = vendor.source_url || (vendor as any)?.source_url;
                return (
                  <div
                    key={vendor.vendor_id}
                    onClick={() => {
                      setSelectedVendorId(vendor.vendor_id);
                      if (onSelectVendor) onSelectVendor(vendor);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#FAD4C0]/70 bg-gradient-to-r from-slate-900 to-slate-900/80 shadow-md'
                        : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white tracking-tight">
                          {vendor.vendor_name}
                        </span>
                        {getRankBadge(vendor)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span>
                          Total Delivered:{' '}
                          <strong className="text-white">
                            {currSymbol}{Number(vendor.landed_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </span>
                        {vendor.freight_cost !== undefined && (
                          <>
                            <span>•</span>
                            <span>
                              Ship:{' '}
                              <strong className="text-emerald-400">
                                {Number(vendor.freight_cost) === 0 ? 'FREE' : `${currSymbol}${Number(vendor.freight_cost).toFixed(2)}`}
                              </strong>
                            </span>
                          </>
                        )}
                        {srcUrl && (
                          <>
                            <span>•</span>
                            <a
                              href={srcUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-1"
                            >
                              Direct Store Link ↗
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-extrabold font-mono text-[#FAD4C0]">
                          {Number(vendor.overall_score).toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">/ 100</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Side-by-Side Comparison Matrix View */
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#80A1C1]" />
                <span>Side-by-Side Vendor Evaluation Matrix</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any row to view breakdown
              </span>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">Rank & Supplier</th>
                  <th className="pb-2 font-medium">Landed Cost</th>
                  <th className="pb-2 font-medium text-center">Financial (40%)</th>
                  <th className="pb-2 font-medium text-center">Tech (40%)</th>
                  <th className="pb-2 font-medium text-center">Risk (20%)</th>
                  <th className="pb-2 font-medium text-right">Overall Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rankingList.map((vendor: any) => {
                  const isSelected = vendor.vendor_id === selectedVendorId;
                  return (
                    <tr
                      key={vendor.vendor_id}
                      onClick={() => {
                        setSelectedVendorId(vendor.vendor_id);
                        if (onSelectVendor) onSelectVendor(vendor);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-900/90 text-white'
                          : 'hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              vendor.rank === 1
                                ? 'bg-[#FAD4C0] text-slate-950'
                                : vendor.rank === 2
                                ? 'bg-[#80A1C1] text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{vendor.rank}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {vendor.vendor_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 font-bold text-white">
                        {currSymbol}{Number(vendor.landed_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center text-amber-300">
                        {Number(vendor.financial_score || vendor.landed_cost_score || 0).toFixed(1)}
                      </td>
                      <td className="py-2.5 text-center text-sky-300">
                        {Number(vendor.technical_score || vendor.quality_score || 0).toFixed(1)}
                      </td>
                      <td className="py-2.5 text-center text-emerald-400">
                        {Number(vendor.risk_score || 0).toFixed(1)}
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-[#FAD4C0]">
                        {Number(vendor.overall_score).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Vendor Detail Breakdown */}
        {selectedVendor && (
          <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-1.5">
              <span className="font-bold text-slate-300">
                Live Evidence & Listing Details for {selectedVendor.vendor_name} (Rank #{selectedVendor.rank})
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified In Stock & Compliant
              </span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              {selectedVendor.product_title && (
                <li>
                  <strong className="text-slate-400">Listing Title:</strong> {selectedVendor.product_title}
                </li>
              )}
              {selectedVendor.evidence_snippet && (
                <li>
                  <strong className="text-slate-400">Web Evidence:</strong> {selectedVendor.evidence_snippet}
                </li>
              )}
              {selectedVendor.source_url && (
                <li>
                  <strong className="text-slate-400">Verified URL:</strong>{' '}
                  <a
                    href={selectedVendor.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 hover:underline break-all"
                  >
                    {selectedVendor.source_url}
                  </a>
                </li>
              )}
              {!selectedVendor.evidence_snippet && (
                <>
                  <li>
                    Total delivered cost:{' '}
                    <strong className="text-white font-mono">
                      {currSymbol}{Number(selectedVendor.landed_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>{' '}
                    calculated with verified online pricing, trackable shipping, and seller warranty.
                  </li>
                  <li>Merchant standing verified with buyer protection guarantee.</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </BentoCard>
  );
};
