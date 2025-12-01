import React, { useState, useEffect, useRef } from 'react';
import { Users, Award, Star, TrendingUp, Target, Sparkles } from 'lucide-react';

const AboutPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  type SectionKey = 'hero' | 'mission' | 'story' | 'values' | 'achievements';
  const [visibleSections, setVisibleSections] = useState<Record<SectionKey, boolean>>({
    hero: false,
    mission: false,
    story: false,
    values: false,
    achievements: false
  });
  type CounterKey = 'schools' | 'teachers' | 'exams' | 'uptime';

  const [counters, setCounters] = useState<Record<CounterKey, number>>({
    schools: 0,
    teachers: 0,
    exams: 0,
    uptime: 0
  });
  
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLDivElement | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({
              ...prev,
              [(entry.target as HTMLElement).dataset.section as string]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    if (!counterRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateCounters();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(counterRef.current);
    return () => observer.disconnect();
  }, [hasAnimated]);
  
  const animateCounters = () => {
    const targets: Record<CounterKey, number> = { schools: 500, teachers: 50000, exams: 2000000, uptime: 99.9 };
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let current: Record<CounterKey, number> = { schools: 0, teachers: 0, exams: 0, uptime: 0 };
    
    const timer = setInterval(() => {
      (Object.keys(targets) as CounterKey[]).forEach(key => {
        if (current[key] < targets[key]) {
          current[key] = Math.min(
            current[key] + targets[key] / steps,
            targets[key]
          );
        }
      });
      
      setCounters({ ...current });
      
      if ((Object.keys(targets) as CounterKey[]).every(key => current[key] >= targets[key])) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, increment);
  };

  const values = [
    {
      icon: Award,
      title: "Excellence",
      desc: "We strive for the highest standards in everything we do, delivering quality solutions that exceed expectations.",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    },
    {
      icon: Users,
      title: "Collaboration",
      desc: "Working together with clients and partners to create innovative solutions that drive success.",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    },
    {
      icon: Star,
      title: "Innovation",
      desc: "Continuously exploring new technologies and methodologies to stay ahead in a rapidly evolving landscape.",
      gradient: "from-cyan-400/20 to-cyan-600/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`
        }}
      />

      {/* Grid pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Hero Section */}
      <div 
        ref={el => {sectionRefs.current[0] = el}}
        data-section="hero"
        className={`relative py-24 px-6 transition-all duration-1000 ${
          visibleSections.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block mb-6 px-6 py-2 bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20 rounded-full">
            <span className="text-cyan-400 font-light">About Us</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight">
            Building the <span className="text-cyan-400">Future</span>
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
            Empowering education through innovative technology and dedicated service excellence
          </p>
        </div>
      </div>

      <div className="relative py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Mission & Vision */}
          <div 
            ref={el => {sectionRefs.current[1] = el}}
            data-section="mission"
            className={`grid lg:grid-cols-2 gap-8 transition-all duration-700 ${
              visibleSections.mission ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="group relative p-8 bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 backdrop-blur-sm rounded-2xl border border-cyan-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-block p-3 bg-cyan-400/10 rounded-xl mb-4">
                  <Target className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-light mb-6 text-cyan-400">Our Mission</h2>
                <p className="text-gray-300 font-light leading-relaxed">
                  To revolutionize education through cutting-edge technology solutions that make learning accessible, engaging, and effective for everyone.
                </p>
              </div>
            </div>
            
            <div className="group relative p-8 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800/50 overflow-hidden hover:border-cyan-400/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-block p-3 bg-cyan-400/10 rounded-xl mb-4">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-light mb-6 text-white">Our Vision</h2>
                <p className="text-gray-300 font-light leading-relaxed">
                  To be the leading platform that transforms how educational institutions leverage technology to enhance learning outcomes worldwide.
                </p>
              </div>
            </div>
          </div>

          {/* Story */}
          <div 
            ref={el => {sectionRefs.current[2] = el}}
            data-section="story"
            className={`relative p-12 bg-gray-900/40 backdrop-blur-sm rounded-3xl border border-gray-800/50 overflow-hidden transition-all duration-700 ${
              visibleSections.story ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-light mb-8 text-center">
                Our <span className="text-cyan-400">Story</span>
              </h2>
              <div className="space-y-6 max-w-4xl mx-auto">
                <p className="text-gray-300 font-light leading-relaxed text-lg">
                  Founded with a passion for transforming education, we've grown from a small team with a big vision into a trusted partner for educational institutions worldwide.
                </p>
                <p className="text-gray-300 font-light leading-relaxed text-lg">
                  Our journey has been defined by innovation, dedication, and an unwavering commitment to making quality education accessible to all. Today, we continue to push boundaries and set new standards in educational technology.
                </p>
              </div>
            </div>
          </div>

          {/* Values */}
          <div 
            ref={el => {sectionRefs.current[3] = el}}
            data-section="values"
            className={`transition-all duration-700 ${
              visibleSections.values ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="text-center mb-12">
              <div className="inline-block p-3 bg-cyan-400/10 rounded-xl mb-4">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-4xl font-light">
                Our <span className="text-cyan-400">Values</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group text-center transition-all duration-500"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${value.gradient} backdrop-blur-sm flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 border border-cyan-400/20 group-hover:border-cyan-400/50`}>
                      <value.icon className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-light mb-4 group-hover:text-cyan-400 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-gray-400 font-light leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div 
            ref={el => {
              sectionRefs.current[4] = el;
              counterRef.current = el;
            }}
            data-section="achievements"
            className={`relative p-12 bg-gradient-to-br from-cyan-900/20 to-cyan-950/20 backdrop-blur-sm rounded-3xl border border-cyan-500/30 overflow-hidden transition-all duration-700 ${
              visibleSections.achievements ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-4xl font-light text-center mb-12 text-cyan-400">
                Our Impact
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { 
                    number: counters.schools,
                    suffix: '+',
                    label: 'Schools Served',
                    format: (n) => Math.floor(n)
                  },
                  { 
                    number: counters.teachers,
                    suffix: '+',
                    label: 'Teachers Empowered',
                    format: (n) => Math.floor(n).toLocaleString()
                  },
                  { 
                    number: counters.exams,
                    suffix: '+',
                    label: 'Exams Delivered',
                    format: (n) => (Math.floor(n) / 1000000).toFixed(1) + 'M'
                  },
                  { 
                    number: counters.uptime,
                    suffix: '%',
                    label: 'Platform Uptime',
                    format: (n) => n.toFixed(1)
                  }
                ].map((achievement, index) => (
                  <div 
                    key={index}
                    className="text-center group"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="text-5xl font-light text-cyan-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                      {achievement.format(achievement.number)}{achievement.suffix}
                    </div>
                    <div className="text-gray-400 font-light">{achievement.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.5;
          }
          90% {
            opacity: 0.3;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;