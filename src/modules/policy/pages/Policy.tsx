import type React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Shield, Users, Wallet, Sparkles } from "lucide-react";

const policyHighlights = [
  {
    icon: Users,
    title: "Dữ liệu ưu tiên cộng đồng",
    description: "Dữ liệu thành viên được lưu trữ trong đám mây của Đại học FPT và chỉ hiển thị cho chủ nhiệm CLB và Phòng Công tác Sinh viên.",
  },
  {
    icon: Shield,
    title: "Quản trị phê duyệt",
    description: "Mọi thao tác CRUD trên CLB hoặc thành viên đều để lại nhật ký không thể thay đổi.",
  },
  {
    icon: Wallet,
    title: "Minh bạch tài chính",
    description: "Phí hoạt động, tài trợ và hoàn tiền được đối chiếu hàng đêm để đảm bảo báo cáo chính xác.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm sinh viên",
    description: "Chính sách ưu tiên xử lý dưới 48 giờ để sinh viên không phải chờ đợi giấy tờ.",
  },
];

const sectionMeta = [
  { id: 1, badge: "Cộng đồng", tone: "border-emerald-200" },
  { id: 2, badge: "Dữ liệu", tone: "border-sky-200" },
  { id: 3, badge: "Tài chính", tone: "border-amber-200" },
  { id: 4, badge: "Thành viên", tone: "border-purple-200" },
  { id: 5, badge: "Hoạt động", tone: "border-pink-200" },
  { id: 6, badge: "Bảo mật", tone: "border-cyan-200" },
  { id: 7, badge: "Báo cáo", tone: "border-orange-200" },
];

const PolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.5em] uppercase text-orange-400">Chính sách</p>
          <h1 className="text-4xl md:text-5xl font-light">Quản trị ClubHub FPTU</h1>
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
                {index < sectionMeta.length - 1 ? `Tiếp theo: ${t(`policy.section${section.id + 1}.title`)}` : "Bạn đã xem hết chính sách này."}
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h3 className="text-2xl font-light mb-2">Cần làm rõ?</h3>
          <p className="text-slate-700 text-sm mb-4">
            Liên hệ Phòng Công tác Sinh viên hoặc email <span className="text-orange-500">clubhub@fe.edu.vn</span> để trao đổi chi tiết hơn về quản trị CLB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
