import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? <p className="text-sm uppercase tracking-[0.3em] text-royal-500">{eyebrow}</p> : null}
        <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
