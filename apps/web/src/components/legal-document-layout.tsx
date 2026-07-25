"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LegalDocument } from "@/lib/legal-content";
import { ShieldCheck, Printer, Search, ArrowLeft, FileText, Lock } from "lucide-react";

interface LegalDocumentLayoutProps {
  document: LegalDocument;
}

export function LegalDocumentLayout({ document }: LegalDocumentLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const filteredSections = document.sections.filter((section) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      section.title.toLowerCase().includes(q) ||
      section.content.some((paragraph) => paragraph.toLowerCase().includes(q))
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Top Banner */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-royal-500 transition hover:text-royal-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Legally Enforceable
            </span>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Printer className="h-3.5 w-3.5" /> Print Copy
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
            {document.title}
          </h1>
          <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
            {document.subtitle}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2">
            <span>Last Updated: <strong className="text-slate-700">{document.lastUpdated}</strong></span>
            <span>•</span>
            <span>Platform: <strong className="text-slate-700">Mufin RuPay Network</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout with Table of Contents sidebar */}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clauses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-royal-500 focus:bg-white"
              />
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2">
                Table of Contents
              </h2>
              <nav className="max-h-[60vh] overflow-y-auto space-y-1 pr-1">
                {document.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className={`block rounded-lg px-3 py-2 text-xs transition leading-relaxed ${
                      activeSection === section.id
                        ? "bg-royal-50 font-semibold text-royal-600"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Quick Document Switcher */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                Related Documents
              </p>
              <div className="flex flex-col gap-1 text-xs">
                <Link
                  href="/terms"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                    document.title === "Terms & Conditions"
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Terms & Conditions
                </Link>
                <Link
                  href="/privacy"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                    document.title === "Privacy Policy"
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" /> Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="space-y-8">
          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                No clauses matched your search query &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 inline-block text-xs font-semibold text-royal-500 hover:underline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8 transition hover:border-slate-300"
              >
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
                  {section.content.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
