import type React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Shield, Users, Wallet, Sparkles } from "lucide-react";

const policyHighlights = [
  {
    icon: Users,
    title: "Community first data",
    description: "Member data stays inside the FPT University cloud and is only visible to club leaders and Student Affairs.",
  },
  {
    icon: Shield,
    title: "Approval governance",
    description: "Every CRUD action on clubs or memberships leaves an immutable audit trail.",
  },
  {
    icon: Wallet,
    title: "Finance transparency",
    description: "Activity fees, sponsorship, and reimbursements are reconciled nightly for accurate reporting.",
  },
  {
    icon: Sparkles,
    title: "Student experience",
    description: "Policies prioritize sub 48 hour turnarounds so students are never waiting on paperwork.",
  },
];

const sectionMeta = [
  { id: 1, badge: "Community", tone: "border-emerald-200" },
  { id: 2, badge: "Data", tone: "border-sky-200" },
  { id: 3, badge: "Finance", tone: "border-amber-200" },
  { id: 4, badge: "Membership", tone: "border-purple-200" },
  { id: 5, badge: "Activity", tone: "border-pink-200" },
  { id: 6, badge: "Security", tone: "border-cyan-200" },
  { id: 7, badge: "Reporting", tone: "border-orange-200" },
];

const PolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.5em] uppercase text-orange-400">Policies</p>
          <h1 className="text-4xl md:text-5xl font-light">FPTU ClubHub Governance</h1>
          <p className="text-sm text-slate-500">{t("policy.lastUpdated")}</p>
          <p className="text-lg text-slate-600 leading-relaxed">
            <Trans i18nKey="policy.intro" />
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {policyHighlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                <Icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-light mb-2">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {sectionMeta.map((section, index) => (
            <article
              key={section.id}
              className={`rounded-2xl border ${section.tone} bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">{section.badge}</span>
                <span className="text-xs text-slate-400">{t("policy.title")}</span>
              </div>
              <h2 className="text-2xl font-light text-slate-900 mb-2">
                {t(`policy.section${section.id}.title`)}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {t(`policy.section${section.id}.content`)}
              </p>
              <div className="mt-4 text-xs text-slate-400">
                {index < sectionMeta.length - 1 ? `Next: ${t(`policy.section${section.id + 1}.title`)}` : "You have reached the end of this policy."}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h3 className="text-2xl font-light mb-2">Need clarification?</h3>
          <p className="text-slate-700 text-sm mb-4">
            Contact Student Affairs or email <span className="text-orange-500">clubhub@fe.edu.vn</span> to discuss club governance in more detail.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
