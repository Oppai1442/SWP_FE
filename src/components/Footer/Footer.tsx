import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constant/routes";

const operations = [
  "Quản lý dữ liệu câu lạc bộ (CRUD)",
  "Quản lý thành viên",
  "Yêu cầu tham gia",
  "Phê duyệt yêu cầu",
  "Báo cáo câu lạc bộ",
  "Theo dõi phí hoạt động",
];

const navigationLinks = [
  { label: "Trang chủ", path: ROUTES.HOME.getPath() },
  // { label: "Modules", path: `${ROUTES.HOME.getPath()}#operations` },
  // { label: "Thành viên", path: ROUTES.PRICING.getPath() },
  { label: "Chính sách", path: ROUTES.POLICY.getPath() },
  { label: "Điều khoản", path: ROUTES.TOS.getPath() },
  { label: "Hỗ trợ", path: ROUTES.CONTACT.getPath() },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-slate-900 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <p className="text-2xl font-semibold tracking-wide">ClubHub</p>
            <p className="text-sm text-orange-500 uppercase tracking-[0.4em] mt-1">
              Đại học FPT
            </p>
            <p className="text-slate-600 font-light mt-4">
              Hệ thống quản lý câu lạc bộ sinh viên (SCMS) dành cho sinh viên,
              trưởng nhóm câu lạc bộ và quản trị viên, giúp hợp tác trên một
              không gian làm việc chung.
            </p>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">
              Hoạt động
            </h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              {operations.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">
              Điều hướng
            </h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="hover:text-orange-500 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>
                Email:{" "}
                <a
                  href="mailto:clubhub@fe.edu.vn"
                  className="hover:text-orange-500"
                >
                  clubhub@fe.edu.vn
                </a>
              </li>
              <li>Hotline: 028.73005585</li>
              <li>Văn phòng: Phòng Công tác Sinh viên, Đại học FPT</li>
              <li>Giờ hỗ trợ: Thứ 2 - Thứ 6 • 08:00 - 20:00</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 border-t border-slate-200 pt-6">
          <p>&copy; {new Date().getFullYear()} ClubHub. Bảo lưu mọi quyền.</p>
          <p className="text-slate-500">
            Hỗ trợ bởi Phòng Công tác Sinh viên • Cơ sở TP. HCM & Hà Nội.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
