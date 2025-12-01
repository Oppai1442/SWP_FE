import type React from "react";
import { useTranslation, Trans } from "react-i18next";
import { ClipboardList, CheckCircle2, CalendarDays, FileText } from "lucide-react";

const tosHighlights = [
  {
    icon: ClipboardList,
    title: "Purpose built for clubs",
    description: "The platform exists to manage FPTU student clubs, so every term protects student, leader, and admin usage.",
  },
  {
    icon: CheckCircle2,
    title: "Actionable commitments",
    description: "We guarantee processing of join or leave requests, fee tracking, and incident handling with clear SLAs.",
  },
  {
    icon: CalendarDays,
    title: "Academic cadence",
    description: "Terms stay aligned with semester timelines so clubs can plan onboarding, activities, and reports together.",
  },
  {
    icon: FileText,
    title: "Transparent reporting",
    description: "Admins may export activity logs at any time and students can review their own actions inside the portal dashboard.",
  },
];

const sectionMeta = [
  { id: 1, stage: "Scope" },
  { id: 2, stage: "Access" },
  { id: 3, stage: "Payment" },
  { id: 4, stage: "Requests" },
  { id: 5, stage: "Processing" },
  { id: 6, stage: "Security" },
  { id: 7, stage: "Reporting" },
];

const ToSPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.5em] uppercase text-orange-400">Terms</p>
          <h1 className="text-4xl md:text-5xl font-light">ClubHub Terms of Service</h1>
          <p className="text-sm text-slate-500">{t("tos.lastUpdated")}</p>
          <p className="text-lg text-slate-600 leading-relaxed">
            <Trans i18nKey="tos.intro" />
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {tosHighlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                <Icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-light mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {sectionMeta.map((section) => (
            <article
              key={section.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">{section.stage}</span>
                <span className="text-xs text-slate-400">{t("tos.title")}</span>
              </div>
              <h2 className="text-2xl font-light text-slate-900 mb-2">
                {t(`tos.section${section.id}.title`)}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {t(`tos.section${section.id}.content`)}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h3 className="text-2xl font-light mb-2">Questions about the terms?</h3>
          <p className="text-slate-700 text-sm mb-4">
            Email <span className="text-orange-500">legal.clubhub@fe.edu.vn</span> or contact Student Affairs for support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToSPage;
