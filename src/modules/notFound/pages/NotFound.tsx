import React from "react";
import { ArrowRight, Home, Compass } from "lucide-react";
import { Link } from "react-router-dom";

const quickActions = [
  {
    label: "Trở về trang chủ",
    description: "Xem tổng quan hệ thống ClubHub",
    href: "/",
    icon: Home,
  },
  {
    label: "Xem danh sách Club",
    description: "Khám phá các CLB đang hoạt động",
    href: "/dashboard/clubs",
    icon: Compass,
  },
];

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 text-slate-900 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.5em] text-orange-400">
          ClubHub • FPT University
        </p>
        <h1 className="text-8xl md:text-9xl font-semibold text-orange-200 tracking-tight">
          404
        </h1>
        <h2 className="text-4xl md:text-5xl font-light">
          Trang bạn tìm{" "}
          <span className="text-orange-500 font-medium">không tồn tại</span>
        </h2>
        <p className="text-slate-600 text-lg">
          Mục này có thể đã bị xoá hoặc bạn không có quyền truy cập. Sử dụng các
          lối tắt bên dưới để tiếp tục làm việc trong ClubHub.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mt-8 text-left">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-orange-400 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-500">
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{action.label}</p>
                  <p className="text-sm text-slate-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 border border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-500 transition"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            Quay lại
          </button>
        </div>

        <p className="text-xs uppercase tracking-[0.4em] text-slate-400 pt-6">
          Mã lỗi: <span className="text-orange-500">NOT_FOUND</span>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
