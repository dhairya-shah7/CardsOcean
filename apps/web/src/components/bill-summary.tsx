import type { ReactNode } from "react";

type SummaryRow = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export function BillSummary({
  title = "Bill Summary",
  rows,
  subtotal,
  total,
  footer
}: {
  title?: string;
  rows: SummaryRow[];
  subtotal: string;
  total: string;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-royal-500">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">Transparent pricing</h3>
        </div>
        <div className="rounded-full bg-luxury-gold/10 px-3 py-1 text-sm font-medium text-luxury-gold">INR</div>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.label} className={`flex items-center justify-between text-sm ${row.emphasize ? "font-semibold text-slate-900" : "text-slate-600"}`}>
            <span>{row.label}</span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}

