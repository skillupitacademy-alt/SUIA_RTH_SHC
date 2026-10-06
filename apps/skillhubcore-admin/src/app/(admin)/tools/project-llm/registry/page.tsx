'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Filter,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { BLOCK_CORPUS_REGISTRY } from '@/lib/project-llm';
import type { BlockFamilyReference } from '@quiz/types';

export default function BlockFamilyRegistryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DOCUMENTED'>('ALL');

  const families: BlockFamilyReference[] = BLOCK_CORPUS_REGISTRY.families;

  const filteredFamilies = useMemo(() => {
    return families.filter((f) => {
      const matchesSearch =
        f.familyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.familyId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? f.hasVerifiedImplementation
          : !f.hasVerifiedImplementation;

      return matchesSearch && matchesStatus;
    });
  }, [families, searchQuery, statusFilter]);

  const totalVersions = useMemo(() => {
    return families.reduce((acc, f) => acc + f.documentedVersions.length, 0);
  }, [families]);

  const activeCount = useMemo(() => {
    return families.filter((f) => f.hasVerifiedImplementation).length;
  }, [families]);

  return (
    <div className="space-y-6">
      {/* Surface Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-xl border-t border-white/60 -translate-y-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e11d48] bg-pink-50 border border-pink-200 px-2 py-0.5 rounded">
                SURFACE 02
              </span>
              <span className="text-xs font-semibold text-slate-400">•</span>
              <span className="text-xs font-mono font-semibold text-slate-500">CANONICAL TAXONOMY</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-slate-900 font-outfit">
              Block Family Registry
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Canonical registry of educational block families. Sourced from repository specifications, runtime verifications, and architectural contracts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tools/project-llm/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Create New Block</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Total Families</p>
            <p className="mt-0.5 text-xl font-black text-indigo-600 font-outfit">{families.length}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Cataloged Versions</p>
            <p className="mt-0.5 text-xl font-black text-purple-600 font-outfit">{totalVersions}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Active in Runtime</p>
            <p className="mt-0.5 text-xl font-black text-emerald-600 font-outfit">{activeCount} (I1, C1, D1)</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Planned Families</p>
            <p className="mt-0.5 text-xl font-black text-orange-600 font-outfit">{families.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search families by name or ID (e.g. Introduction, I, Code)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Families ({families.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Runtime Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('DOCUMENTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'DOCUMENTED'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white text-orange-700 border border-orange-200 hover:bg-orange-50'
            }`}
          >
            Documented ({families.length - activeCount})
          </button>
        </div>
      </div>

      {/* Family Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFamilies.map((family) => {
          const isActive = family.hasVerifiedImplementation;
          return (
            <div
              key={family.familyId}
              className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 shadow-xl border-t border-white/60 -translate-y-1 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs font-mono shadow-md shadow-indigo-500/20">
                      {family.familyId}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-outfit leading-tight">
                        {family.familyName}
                      </h3>
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        Family ID: {family.familyId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isActive ? 'RUNTIME ACTIVE' : 'DOCUMENTED'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Cataloged Versions:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {family.documentedVersions.length} versions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {family.documentedVersions.map((v) => (
                      <span
                        key={v}
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                          (family.familyId === 'I' && v === 'I1') ||
                          (family.familyId === 'C' && v === 'C1') ||
                          (family.familyId === 'D' && v === 'D1')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/tools/project-llm/explorer?family=${family.familyId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <span>Explore Versions</span>
                  <ChevronRight size={13} />
                </Link>
                <Link
                  href={`/tools/project-llm/create?family=${family.familyId}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-pink-600 hover:text-pink-700"
                >
                  <span>Derive / Create</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
