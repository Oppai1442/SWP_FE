import React, { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";

const ContactUs = () => {
  const [showMap, setShowMap] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<{
    [key: string]: boolean;
  }>({});
  const contactCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [(entry.target as HTMLElement).dataset.section as string]: true,
            }));
          }
        });
      },
      { threshold: 0.15 }
    );

    contactCardsRef.current.forEach((card) => card && observer.observe(card));
    if (heroRef.current) observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, []);

  const handleMapClick = () => {
    const destination = "10.8411276,106.809883";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Địa chỉ",
      info: "Trường Đại học FPT, TP.HCM",
      tone: "from-orange-50 to-white border border-orange-100",
    },
    {
      icon: Phone,
      title: "Số điện thoại",
      info: "028.73005585",
      tone: "from-orange-50 to-white border border-orange-100",
    },
    {
      icon: Mail,
      title: "Email",
      info: "clubhub@fe.edu.vn",
      tone: "from-orange-50 to-white border border-orange-100",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      info: "Thứ 2 - Thứ 6: 9:00 - 18:00",
      tone: "from-orange-50 to-white border border-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none opacity-60"
        style={{
          background: `radial-gradient(700px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(249,115,22,0.12), transparent 45%)`,
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.05) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      <div
        ref={heroRef}
        data-section="hero"
        className={`relative px-6 pt-32 pb-20 transition-all duration-700 ${
          visibleSections.hero
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center bg-white/70 backdrop-blur rounded-[32px] border border-orange-100 shadow-xl px-10 py-16">
          <p className="text-sm uppercase tracking-[0.5em] text-orange-400 mb-4">
            Liên hệ
          </p>
          <h1 className="text-4xl md:text-6xl font-light mb-5">
            Hãy cho chúng tôi biết cách{" "}
            <span className="font-semibold text-orange-500">
              hỗ trợ câu lạc bộ của bạn
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Phòng Công tác Sinh viên, chủ nhiệm CLB và ban quản trị đều chia sẻ
            cùng một kênh hỗ trợ.
          </p>
        </div>
      </div>

      <div className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-orange-500">
              Thông tin liên hệ
            </h2>
            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <div
                  key={contact.title}
                  ref={(el) => {
                    contactCardsRef.current[index] = el;
                  }}
                  data-section={`card-${index}`}
                  className={`transition-all duration-700 ${
                    visibleSections[`card-${index}`]
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-6"
                  }`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.tone} flex items-center justify-center mb-3`}
                    >
                      <contact.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                      {contact.title}
                    </h3>
                    <p className="text-slate-500 font-light">{contact.info}</p>
                  </div>
                </div>
              ))}
            </div>

            <div
              ref={(el) => {
                contactCardsRef.current[4] = el;
              }}
              data-section="emergency"
              className={`transition-all duration-700 ${
                visibleSections.emergency
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-6"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="p-8 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm">
                <p className="text-sm uppercase tracking-[0.4em] text-orange-400 mb-2">
                  Đường dây nóng 24/7
                </p>
                <h3 className="text-2xl font-light mb-4">
                  Hotline Khẩn Cấp CLB
                </h3>
                <p className="text-slate-600 font-light mb-5 leading-relaxed">
                  Các yêu cầu khẩn cấp, vấn đề an toàn hoặc sự cố ngoài khuôn
                  viên được đội phản ứng Công tác Sinh viên xử lý cả ngày lẫn
                  đêm.
                </p>
                <div className="flex items-center gap-3 text-xl font-semibold text-orange-500">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Phone className="w-5 h-5" />
                  </div>
                  +84 366 86 2288
                </div>
              </div>
            </div>
          </div>

          <div
            ref={(el) => {
              contactCardsRef.current[5] = el;
            }}
            data-section="map"
            className={`space-y-6 transition-all duration-700 ${
              visibleSections.map
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-6"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h2 className="text-3xl font-light text-orange-500">
              Vị trí của chúng tôi
            </h2>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div
                className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-orange-50 to-white cursor-pointer relative"
                onClick={() => setShowMap(true)}
              >
                {!showMap ? (
                  <div className="text-center p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 mb-4">
                      <MapPin className="w-9 h-9 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-light mb-2">
                      Bản đồ tương tác
                    </h3>
                    <p className="text-slate-500 font-light">
                      Nhấn để xem chỉ đường
                    </p>
                  </div>
                ) : (
                  <iframe
                    title="Bản đồ Đại học FPT HCM"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.1061009336795!2d106.8073081!3d10.8411276!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2sTrường%20Đại%20học%20FPT%20TP.HCM!5e0!3m2!1svi!2s!4v1700000000000"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                )}
              </div>

              <div className="p-6 border-t border-slate-200 space-y-4">
                <div>
                  <h4 className="text-lg font-medium mb-1">Văn phòng chính</h4>
                  <p className="text-slate-500 font-light">
                    Student Affairs Hub, Đại học FPT, Quận 9, TP. Hồ Chí Minh
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Có chỗ đậu xe cho xe CLB và giảng viên khách. Cách trạm xe
                  buýt trong khuôn viên 5 phút đi bộ.
                </p>
                <button
                  onClick={handleMapClick}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Chỉ đường
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h4 className="text-lg font-medium mb-2">Đến trực tiếp</h4>
              <p className="text-slate-600 font-light leading-relaxed">
                Không cần đặt lịch trước. Bạn có thể ghé bất kỳ lúc nào trong
                giờ làm việc để được hỗ trợ về thủ tục hoạt động, cơ sở vật chất
                hoặc tài chính.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-200 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 12}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
          20% { opacity: 0.4; }
          50% { transform: translateY(-120px) translateX(60px); opacity: 0.7; }
          80% { opacity: 0.4; }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;
