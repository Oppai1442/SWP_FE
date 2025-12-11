import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClubImage from "../../../assets/img/home/CLB-FPTU.png";
import ClubImage1 from "../../../assets/img/home/CLB-FPTU1.png";
import ClubImage2 from "../../../assets/img/home/CLB-FPTU2.png";

const ClubHubHome = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<{
    [group: string]: { id: number; name: string; details: any } | null;
  }>({});

  // ==== MOCK DATA 4 NHÓM CLB ====
  const CLUB_GROUPS = [
    {
      id: 1,
      group: "Câu lạc bộ Học thuật",
      clubs: [
        {
          id: 1,
          name: "FEC - FPTU English Club",
          details: {
            intro:
              "FEC không phải một Câu lạc bộ học thuật đơn thuần mà là nơi những con người tử tế cùng nhau cố gắng.",
            contact: {
              email: "englishclub.fu@gmail.com",
            },
            location: "Phòng 601",
          },
        },
        {
          id: 2,
          name: "CLB F-Code",
          details: {
            intro:
              "Câu lạc bộ công nghệ chuyên về lập trình, AI, IoT và các dự án sáng tạo.",
            contact: {
              email: "itinnovation@fptu.edu.vn",
            },
            location: "Innovation Lab",
          },
        },
      ],
    },
    {
      id: 2,
      group: "Câu lạc bộ Nghệ thuật",
      clubs: [
        {
          id: 3,
          name: "Art & Design Club",
          details: {
            intro:
              "Nơi sinh viên yêu nghệ thuật, hội họa và thiết kế đồ họa thể hiện bản sắc sáng tạo.",
            contact: {
              email: "artdesign@fptu.edu.vn",
            },
            location: "Phòng Mỹ thuật - 603",
          },
        },
        {
          id: 4,
          name: "CLB Nhạc Cụ Truyền Thống - FTIC",
          details: {
            intro:
              "CLB Nhạc Cụ Truyền Thống Đại học FPT - Nơi hội tụ những con người yêu Âm hưởng Truyền thống!",
            contact: {
              email: "clbnhaccutruyenthongfu@gmail.com",
            },
            location: "Phòng nhạc cụ - Tầng trệt 022",
          },
        },
      ],
    },
    {
      id: 3,
      group: "Câu lạc bộ Thể thao",
      clubs: [
        {
          id: 5,
          name: "FPTU Vovinam Club",
          details: {
            intro:
              "Câu lạc võ Vovinam của sinh viên FPTU dành cho người yêu thích rèn luyện võ thuật và phát triển thể chất.",
            contact: {
              email: "vovinam@fptu.edu.vn",
            },
            location: "Sân ngoài trời FPTU",
          },
        },
        {
          id: 6,
          name: "FFC - Câu Lạc Bộ Bóng Đá FPTU",
          details: {
            intro:
              "CLB Bóng đá trường Đại Học FPT Hà Nội - FFC được thành lập với sứ mệnh tạo ra sân chơi cho các bạn sinh viên đam mê bóng đá.",
            contact: {
              email: "ffc.fptu.football.club@gmail.com",
            },
            location: "Sân bóng đá ngoài trời FPTU",
          },
        },
      ],
    },
    {
      id: 4,
      group: "Câu lạc bộ Cộng đồng",
      clubs: [
        {
          id: 7,
          name: "iGo club",
          details: {
            intro:
              "CLB tình nguyện tổ chức các hoạt động cộng đồng, thiện nguyện và chiến dịch xanh.",
            contact: {
              email: "igoclubvicongdong@gmail.com",
            },
            location: "Phòng 204",
          },
        },
        {
          id: 8,
          name: "Mây Mưa Club - FPT Japan Club",
          details: {
            intro: "FPT 日本 クラブ - CLB Nhật Đại học FPT.",
            contact: {
              email: "fjcmaymuaclub@gmail.com",
            },
            location: "Phòng 404",
          },
        },
      ],
    },
  ];

  const images = [ClubImage, ClubImage1, ClubImage2];

  // === Scroll observer ===
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const OPERATIONS = [
    {
      title: "Quản lý Câu lạc bộ (CRUD)",
      description:
        "Tạo, cập nhật, xuất bản và lưu trữ hồ sơ câu lạc bộ với quyền sở hữu rõ ràng.",
    },
    {
      title: "Quản lý Thành viên",
      description:
        "Theo dõi thông tin sinh viên, nhóm chức năng và quá trình hoạt động.",
    },
    {
      title: "Yêu cầu tham gia",
      description:
        "Sinh viên đăng ký trực tuyến, theo dõi tiến trình phê duyệt.",
    },
    {
      title: "Phê duyệt yêu cầu",
      description: "Xử lý đăng ký, rời nhóm và các thay đổi vai trò.",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      {/* HERO */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center pt-16"
        data-animate
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-br from-white via-orange-50 to-white rounded-[32px] border border-orange-100 shadow-xl py-16">
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight text-slate-900">
            ClubHub cho{" "}
            <span className="text-orange-500 font-semibold">
              Trường Đại học FPT
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 font-light mb-8 max-w-3xl mx-auto leading-relaxed">
            Điều phối toàn bộ vòng đời câu lạc bộ – dữ liệu, thành viên và báo
            cáo.
          </p>
        </div>
      </section>

      {/* Club Introduction */}
      <section className="py-24 bg-white" data-animate>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Text + list + CLB info */}
          <div>
            <h2 className="text-4xl font-light mb-6">
              Giới thiệu các câu lạc bộ
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-4">
              Bên cạnh các hoạt động học tập, chú trọng vào đào tạo và chất
              lượng giảng dạy, FPTU cũng rất quan tâm đến đời sống tinh thần của
              sinh viên. Thông qua xây dựng và phát triển các câu lạc bộ, Nhà
              trường tạo ra các sân chơi phù hợp với nhu cầu và khuyến khích
              sinh viên tham gia.
            </p>
            <p className="text-slate-600 text-lg leading-relaxed mb-4">
              Với nhiều hoạt động phong phú, các câu lạc bộ là nơi sinh viên có
              cơ hội thể hiện tài năng, giao lưu, học hỏi, và trau dồi kỹ năng
              để phát triển bản thân.
            </p>

            {/* Danh sách nhóm CLB */}
            <ul className="list-disc pl-6 text-slate-600 mt-4 text-lg space-y-2">
              {CLUB_GROUPS.map((group) => (
                <li key={group.group}>
                  {/* Tên nhóm */}
                  <div
                    className="cursor-pointer hover:text-orange-500 transition font-medium"
                    onClick={() => {
                      setSelectedGroup((prev) =>
                        prev === group.group ? null : group.group
                      );
                      setSelectedClubs((prev) => ({
                        ...prev,
                        [group.group]: null,
                      }));
                    }}
                  >
                    {group.group}
                  </div>

                  {/* Danh sách CLB nếu nhóm được chọn */}
                  {selectedGroup === group.group && (
                    <ul className="mt-2 ml-6 space-y-1">
                      {group.clubs.map((club) => (
                        <li
                          key={club.id}
                          className="p-2 border border-slate-200 rounded cursor-pointer hover:bg-orange-50"
                          onClick={() =>
                            setSelectedClubs((prev) => ({
                              ...prev,
                              [group.group]:
                                prev[group.group]?.id === club.id ? null : club,
                            }))
                          }
                        >
                          {club.name}

                          {/* Hiển thị info CLB */}
                          {selectedClubs[group.group]?.id === club.id && (
                            <div className="mt-2 p-3 bg-slate-50 border border-orange-300 rounded">
                              <h4 className="font-semibold text-orange-600 mb-1">
                                {club.name}
                              </h4>
                              <p className="mb-1">{club.details.intro}</p>
                              <p className="mb-1">
                                <b>Email:</b> {club.details.contact.email}
                              </p>
                              <p>
                                <b>Vị trí:</b> {club.details.location}
                              </p>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Image */}
          <div className="relative w-full h-64 overflow-hidden rounded-2xl">
            <AnimatePresence>
              <motion.img
                key={index}
                src={images[index]}
                className="absolute w-full h-full object-cover"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* === OPERATIONS === */}
      <section id="operations" className="py-24" data-animate>
        {/* CẬP NHẬT 1: Giảm max-width xuống 5xl để layout 2 cột gọn hơn */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12 text-center">
            Các thao tác chính
          </h2>

          {/* CẬP NHẬT 2: Xóa 'lg:grid-cols-3', giữ 'md:grid-cols-2' để tạo layout 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {OPERATIONS.map((op, idx) => {
              const isVisible = visibleSections.has("operations");
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <h3 className="text-xl font-semibold mb-2">{op.title}</h3>
                  <p className="text-slate-600 font-light">{op.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubHubHome;
