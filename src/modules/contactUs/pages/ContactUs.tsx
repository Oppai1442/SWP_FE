import React, { useState, useEffect, useRef } from "react";
import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";

const ContactUs = () => {
  const [showMap, setShowMap] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<{ [key: string]: boolean }>({});
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
    const destination = "10.8751312,106.8007233";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Address",
      info: "Student Cultural House, HCMC",
      tone: "from-orange-50 to-white border border-orange-100",
    },
    {
      icon: Phone,
      title: "Phone",
      info: "+84 366 86 2288",
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
      title: "Working Hours",
      info: "Mon - Fri: 9:00 AM - 6:00 PM",
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
        className={`relative px-6 pt-32 pb-20 transition-all.duration-700 ${
          visibleSections.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="max-w-4xl mx-auto text-center bg-white/70 backdrop-blur rounded-[32px] border border-orange-100 shadow-xl px-10 py-16">
          <p className="text-sm uppercase tracking-[0.5em] text-orange-400 mb-4">Contact</p>
          <h1 className="text-4xl md:text-6xl font-light mb-5">
            Let us know how we can <span className="font-semibold text-orange-500">support your club</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Student Affairs, club leaders, and administrators share the same help desk. Drop us a line, schedule a visit, or launch directions with one tap.
          </p>
        </div>
      </div>

      <div className="relative py-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-orange-500">Contact Information</h2>
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
                    <h3 className="text-lg font-medium mb-1">{contact.title}</h3>
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
                visibleSections.emergency ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="p-8 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-sm">
                <p className="text-sm uppercase tracking-[0.4em] text-orange-400 mb-2">24/7 Hotline</p>
                <h3 className="text-2xl font-light mb-4">Emergency Club Line</h3>
                <p className="text-slate-600 font-light mb-5 leading-relaxed">
                  Incident approvals, safety escalations, or off-campus logistics are handled by the Student Affairs response team day and night.
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
            className={`space-y-6 transition-all.duration-700 ${
              visibleSections.map ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h2 className="text-3xl font-light text-orange-500">Our Location</h2>

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
                    <h3 className="text-2xl font-light mb-2">Interactive Map</h3>
                    <p className="text-slate-500 font-light">Tap to load directions</p>
                  </div>
                ) : (
                  <iframe
                    title="ClubHub Office Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15673.393931941979!2d106.81212808955082!3d10.861077227694748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d8a6b19d6763%3A0x143c54525028b2e!2zTmjDoCBWxINuIGjDs2EgU2luaCB2acOqbiBUUC5IQ00!5e0!3m2!1svi!2s!4v1747696235771!5m2!1svi!2s"
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
                  <h4 className="text-lg font-medium mb-1">Main Office</h4>
                  <p className="text-slate-500 font-light">
                    Student Affairs Hub, FPT University, District 9, Ho Chi Minh City
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Parking available for club vans and visiting lecturers. Five minute walk from the campus bus stop.
                </p>
                <button
                  onClick={handleMapClick}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Get directions
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h4 className="text-lg font-medium mb-2">Visit us</h4>
              <p className="text-slate-600 font-light leading-relaxed">
                Appointments are optional. Drop by during office hours to unblock onboarding, finance, facility, or activity approvals with the Student Affairs squad.
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
