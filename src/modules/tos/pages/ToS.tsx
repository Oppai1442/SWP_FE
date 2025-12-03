import type React from "react";
import { useTranslation, Trans } from "react-i18next";
import { ClipboardList, CheckCircle2, CalendarDays, FileText } from "lucide-react";

const tosHighlights = [
  {
    icon: ClipboardList,
    title: "Dành riêng cho câu lạc bộ",
    description: "Nền tảng được thiết kế để quản lý các câu lạc bộ sinh viên FPTU, bảo vệ quyền lợi của sinh viên, lãnh đạo và quản trị viên trong từng kỳ.",
  },
  {
    icon: CheckCircle2,
    title: "Cam kết rõ ràng và thực tế",
    description: "Chúng tôi đảm bảo xử lý yêu cầu tham gia hoặc rời câu lạc bộ, theo dõi phí và xử lý sự cố với SLA minh bạch.",
  },
  {
    icon: CalendarDays,
    title: "Theo nhịp học kỳ",
    description: "Các kỳ hạn được đồng bộ với lịch học để câu lạc bộ có thể lên kế hoạch onboarding, hoạt động và báo cáo một cách hợp lý.",
  },
  {
    icon: FileText,
    title: "Báo cáo minh bạch",
    description: "Quản trị viên có thể xuất nhật ký hoạt động bất cứ lúc nào và sinh viên có thể xem lại các hành động của mình trong bảng điều khiển.",
  },
];

const sectionMeta = [
  { id: 1, stage: "Phạm vi" },
  { id: 2, stage: "Quyền truy cập" },
  { id: 3, stage: "Thanh toán" },
  { id: 4, stage: "Yêu cầu" },
  { id: 5, stage: "Xử lý" },
  { id: 6, stage: "Bảo mật" },
  { id: 7, stage: "Báo cáo" },
];

const ToSPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-slate-900 px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="space-y-4">
          <p className="text-xs tracking-[0.5em] uppercase text-orange-400">Điều khoản</p>
          <h1 className="text-4xl md:text-5xl font-light">Điều khoản dịch vụ ClubHub</h1>
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
          <h3 className="text-2xl font-light mb-2">Có câu hỏi về điều khoản?</h3>
          <p className="text-slate-700 text-sm mb-4">
            Gửi email đến <span className="text-orange-500">clubhub@fe.edu.vn</span> hoặc liên hệ Phòng Công tác Sinh viên để được hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ToSPage;
