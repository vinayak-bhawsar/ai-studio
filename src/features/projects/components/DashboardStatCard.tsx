"use client";

interface DashboardStatCardProps {
  title: string;
  value: number | string;
}

export function DashboardStatCard({ title, value }: DashboardStatCardProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
      <h3 className="text-xs font-semibold text-zinc-500 tracking-normal mb-3 sm:mb-4">
        {title}
      </h3>
      <p className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
        {value}
      </p>
    </div>
  );
}
