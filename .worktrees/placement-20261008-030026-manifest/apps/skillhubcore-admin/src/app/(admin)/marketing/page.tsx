"use client";

import React, { useContext, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { ShellContext } from "../ShellContext";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export default function MarketingGovernancePage() {
  const { setHeaderTitle, setHeaderSubtitle } = useContext(ShellContext);

  useEffect(() => {
    setHeaderTitle("Marketing Governance");
    setHeaderSubtitle("Live SHC control-plane, bootstrap payloads, and analytics collector health.");
    return () => {
      setHeaderTitle("");
      setHeaderSubtitle("");
    };
  }, [setHeaderSubtitle, setHeaderTitle]);

  const rthBootstrap = useQuery({
    queryKey: ["marketing-bootstrap", "realtutorialhub"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/marketing/bootstrap/realtutorialhub"),
    staleTime: 60_000,
  });

  const suiaBootstrap = useQuery({
    queryKey: ["marketing-bootstrap", "skillupitacademy"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/marketing/bootstrap/skillupitacademy"),
    staleTime: 60_000,
  });

  const rthControlPlane = useQuery({
    queryKey: ["marketing-control-plane", "realtutorialhub"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/marketing/control-plane/realtutorialhub"),
    staleTime: 60_000,
  });

  const suiaControlPlane = useQuery({
    queryKey: ["marketing-control-plane", "skillupitacademy"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/marketing/control-plane/skillupitacademy"),
    staleTime: 60_000,
  });

  const collector = useQuery({
    queryKey: ["analytics-collector-observability"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/marketing/collector/observability"),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const cards = useMemo(
    () => [
      {
        title: "RTH Control Plane",
        value: rthControlPlane.isSuccess ? "Healthy" : rthControlPlane.isError ? "Error" : "Loading",
      },
      {
        title: "SUIA Control Plane",
        value: suiaControlPlane.isSuccess ? "Healthy" : suiaControlPlane.isError ? "Error" : "Loading",
      },
      {
        title: "Collector Health",
        value: collector.isSuccess ? "Healthy" : collector.isError ? "Error" : "Loading",
      },
    ],
    [collector.isError, collector.isSuccess, rthControlPlane.isError, rthControlPlane.isSuccess, suiaControlPlane.isError, suiaControlPlane.isSuccess],
  );

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-2xl border-t border-white/60">
            <div className="text-sm font-semibold text-slate-500">{card.title}</div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60">
          <h2 className="text-lg font-bold text-slate-900">Bootstrap Payloads</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-600">RTH</div>
              <pre className="mt-2 rounded-lg bg-slate-950 text-slate-100 text-xs p-4 overflow-auto max-h-80">
                {JSON.stringify(rthBootstrap.data ?? rthBootstrap.error?.message ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-600">SUIA</div>
              <pre className="mt-2 rounded-lg bg-slate-950 text-slate-100 text-xs p-4 overflow-auto max-h-80">
                {JSON.stringify(suiaBootstrap.data ?? suiaBootstrap.error?.message ?? null, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60">
          <h2 className="text-lg font-bold text-slate-900">Control Plane Registries</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-600">RTH</div>
              <pre className="mt-2 rounded-lg bg-slate-950 text-slate-100 text-xs p-4 overflow-auto max-h-80">
                {JSON.stringify(rthControlPlane.data ?? rthControlPlane.error?.message ?? null, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-600">SUIA</div>
              <pre className="mt-2 rounded-lg bg-slate-950 text-slate-100 text-xs p-4 overflow-auto max-h-80">
                {JSON.stringify(suiaControlPlane.data ?? suiaControlPlane.error?.message ?? null, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-2xl border-t border-white/60">
        <h2 className="text-lg font-bold text-slate-900">Collector Observability</h2>
        <pre className="mt-4 rounded-lg bg-slate-950 text-slate-100 text-xs p-4 overflow-auto max-h-[40rem]">
          {JSON.stringify(collector.data ?? collector.error?.message ?? null, null, 2)}
        </pre>
      </section>
    </div>
  );
}
