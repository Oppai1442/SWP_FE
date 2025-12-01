import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  ChevronRight,
  CalendarDays,
  FileBarChart2,
} from "lucide-react";

const FEATURE_CARDS = [
  {
    icon: LayoutDashboard,
    title: "Club Control Center",
    description:
      "Spin up new clubs, manage charters, assign advisors, and archive initiatives without losing institutional knowledge.",
    tag: "Setup 1",
    delay: 0,
  },
  {
    icon: Users,
    title: "Member & Role Profiles",
    description:
      "Maintain student records, membership tiers, and leadership succession plans with one-click CRUD workflows.",
    tag: "Setup 2",
    delay: 150,
  },
  {
    icon: Wallet,
    title: "Fees & Budget Automation",
    description:
      "Track dues, sponsorships, and activity funds with approval trails so treasurers and admin stay in sync.",
    tag: "Processing",
    delay: 300,
  },
  {
    icon: FileBarChart2,
    title: "Insightful Reporting",
    description:
      "Generate instant club health reports, membership velocity charts, and finance summaries for every semester.",
    tag: "Report",
    delay: 450,
  },
];

const OPERATIONS = [
  {
    title: "CRUD Club",
    description: "Create, update, publish, and archive FPT University club profiles with clear ownership and compliance tags.",
  },
  {
    title: "CRUD Membership",
    description: "Manage student information, certificates, and functional group roles in one timeline view.",
  },
  {
    title: "Activity Fee Tracking",
    description: "Schedule fee collection, align sponsorship cash flow, and reconcile debt per activity run.",
  },
  {
    title: "Join Requests",
    description: "Students apply online, attach portfolios, select preferred divisions, and follow the status in real time.",
  },
  {
    title: "Request Approvals",
    description: "Leaders process onboarding, exit, or event escalation tickets with transparent audit trails.",
  },
  {
    title: "Club Reports",
    description: "Export member stats, revenue, and highlight reels for Student Affairs in just a few clicks.",
  },
];

const PROCESS_STEPS = [
  {
    id: 1,
    number: "01",
    label: "Setup 1",
    title: "Club blueprint",
    description: "Define structure, link mentors, and standardize data on day one.",
  },
  {
    id: 2,
    number: "02",
    label: "Setup 2",
    title: "Member profiles",
    description: "Capture student records, skill tags, and leadership permissions before onboarding.",
  },
  {
    id: 3,
    number: "03",
    label: "Processing 1",
    title: "Join & fees",
    description: "Students apply, get approved, and complete payments with automatic notifications.",
  },
  {
    id: 4,
    number: "04",
    label: "Processing 2",
    title: "Exception handling",
    description: "Track pending fees, incorrect profiles, or incident flags from one console.",
  },
  {
    id: 5,
    number: "05",
    label: "Report",
    title: "Club insights",
    description: "Deliver KPI, attendance, and revenue snapshots at the end of every term.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "ClubHub helped the Music Box board onboard 120 freshmen in one week and every request was traceable.",
    author: "Thu Anh",
    company: "Head of Music Box Club",
  },
  {
    quote:
      "Centralized fee tracking kept 18 events on budget and Student Affairs received reports instantly.",
    author: "Minh Nguyen",
    company: "Treasurer, Business Club",
  },
  {
    quote:
      "Students enjoy the online workflow because the status is always transparent and no duplicate forms are needed.",
    author: "Ms. Trang",
    company: "Student Affairs FPTU",
  },
];

const STATS = [
  { number: 48, suffix: "+", label: "Active clubs on campus" },
  { number: 5200, suffix: "+", label: "Managed member profiles" },
  { number: 312, suffix: "", label: "Events tracked per semester" },
  { number: 96, suffix: "%", label: "Requests approved < 48h" },
];

const PERSONA_TARGETS = ["Student", "Club Leader", "Admin"];

const ClubHubHome = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set<string>());

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll("[data-animate]");
    sections.forEach((section) => observerRef.current?.observe(section));

    return () => observerRef.current?.disconnect();
  }, []);

  const useAnimatedCounter = (end: number, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
      if (!hasStarted) return;

      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startValue + (end - startValue) * easeOut);
        setCount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [hasStarted, end, duration]);

    return [count, () => setHasStarted(true)] as const;
  };

  const Particles = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 20,
    }));

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-orange-300/30 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${20 + particle.speed * 10}s infinite linear`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
    );
  };

  const StatCard = ({ number, label, suffix = "", delay = 0 }) => {
    const [count, startCount] = useAnimatedCounter(number);

    useEffect(() => {
      if (visibleSections.has("stats")) {
        const timer = setTimeout(startCount, delay);
        return () => clearTimeout(timer);
      }
    }, [visibleSections, startCount, delay]);

    return (
      <div className="text-center group">
        <div className="text-4xl lg:text-5xl font-light text-slate-900 mb-2 group-hover:text-orange-500 transition-colors duration-300">
          {count}
          {suffix}
        </div>
        <div className="text-slate-500 font-light">{label}</div>
      </div>
    );
  };

  const ProcessStep = ({ number, label, title, description, delay = 0, showConnector = false }) => {
    const isVisible = visibleSections.has("process");

    return (
      <div
        className={`relative ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms", transitionDuration: "600ms" }}
      >
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-orange-200">
            <span className="text-[10px] uppercase tracking-widest text-orange-400">{label}</span>
            <span className="text-xl font-semibold">{number}</span>
          </div>
          {showConnector && <div className="hidden lg:block flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent ml-4" />}
        </div>
        <h3 className="text-xl font-light mb-2">{title}</h3>
        <p className="text-slate-600 font-light">{description}</p>
      </div>
    );
  };

  const TestimonialCard = ({ quote, author, company, delay = 0 }) => {
    const isVisible = visibleSections.has("testimonials");

    return (
      <div
        className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms", transitionDuration: "600ms" }}
      >
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-orange-400 fill-current" />
          ))}
        </div>
        <blockquote className="text-slate-600 font-light mb-4 italic">"{quote}"</blockquote>
        <div>
          <div className="text-slate-900 font-light">{author}</div>
          <div className="text-slate-500 text-sm">{company}</div>
        </div>
      </div>
    );
  };

  const isFeaturesVisible = visibleSections.has("features");
  const isOperationsVisible = visibleSections.has("operations");

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">

      <Particles />

      <section id="home" className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-br from-white via-orange-50 to-white rounded-[32px] border border-orange-100 shadow-xl py-16">
          <p className="inline-flex items-center px-4 py-1 rounded-full bg-white text-orange-500 text-sm border border-orange-100 mb-6">
            Student • Club Leader • Admin
          </p>
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight text-slate-900">
            ClubHub for <span className="text-orange-500 font-semibold">FPT University</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
            Orchestrate the entire club lifecycle: CRUD data, manage membership, collect fees, and deliver reports from one platform.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {PERSONA_TARGETS.map((persona) => (
              <span key={persona} className="px-4 py-2 rounded-full bg-white text-sm text-slate-500 border border-slate-200">
                {persona}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubHubHome;
