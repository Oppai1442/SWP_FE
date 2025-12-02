import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constant/routes";

const operations = [
  "CRUD Club records",
  "CRUD Membership",
  "Activity fee tracking",
  "Join requests",
  "Request approvals",
  "Club reporting",
];

const navigationLinks = [
  { label: "Home", path: ROUTES.HOME.getPath() },
  { label: "Modules", path: `${ROUTES.HOME.getPath()}#operations` },
  { label: "Membership", path: ROUTES.PRICING.getPath() },
  { label: "Policies", path: ROUTES.POLICY.getPath() },
  { label: "Terms", path: ROUTES.TOS.getPath() },
  { label: "Support", path: ROUTES.CONTACT.getPath() },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 text-slate-900 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <p className="text-2xl font-semibold tracking-wide">ClubHub</p>
            <p className="text-sm text-orange-500 uppercase tracking-[0.4em] mt-1">FPT University</p>
            <p className="text-slate-600 font-light mt-4">
              Student Club Management System (SCMS) for students, club leaders, and administrators to collaborate on one shared workspace.
            </p>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">Operations</h3>
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
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">Navigation</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="hover:text-orange-500 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.3em] text-orange-500 mb-4">Contact</h3>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>Email: <a href="mailto:clubhub@fe.edu.vn" className="hover:text-orange-500">clubhub@fe.edu.vn</a></li>
              <li>Hotline: +84 28 9999 9999</li>
              <li>Office: Student Affairs, FPT University</li>
              <li>Support hours: Mon - Fri • 08:00 - 20:00</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 border-t border-slate-200 pt-6">
          <p>&copy; {new Date().getFullYear()} ClubHub. All rights reserved.</p>
          <p className="text-slate-500">Powered by Student Affairs • Ho Chi Minh & Ha Noi campuses.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
