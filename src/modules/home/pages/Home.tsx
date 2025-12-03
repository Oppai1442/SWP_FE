import React, { useState, useEffect, useRef } from "react";
import ClubImage from "../../../assets/img/home/CLB-FPTU.png";

const ClubHubHome = () => {
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedClubs, setSelectedClubs] = useState<{
    [group: string]: any | null;
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
              leader: "Nguyễn Văn A",
              phone: "0901 234 567",
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
              leader: "Trần Minh Khoa",
              phone: "0912 345 678",
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
              leader: "Lê Hoàng Mai",
              phone: "0933 222 111",
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
              leader: "Phạm Quang Huy",
              phone: "0988 111 222",
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
              leader: "Đỗ Thành Đạt",
              phone: "0909 888 777",
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
              leader: "Vũ Thảo Nhi",
              phone: "0977 123 456",
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
              leader: "Ngô Thanh Bình",
              phone: "0905 222 333",
              email: "igoclubvicongdong@gmail.com",
            },
            location: "Phòng 204",
          },
        },
        {
          id: 8,
          name: "Mây Mưa Club - FPT Japan Club",
          details: {
            intro:
              "FPT 日本 クラブ - CLB Nhật Đại học FPT.",
            contact: {
              leader: "Hoàng Mỹ Dung",
              phone: "0916 555 444",
              email: "fjcmaymuaclub@gmail.com",
            },
            location: "Phòng 404",
          },
        },
      ],
    },
  ];

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
      title: "Theo dõi phí hoạt động",
      description: "Lên lịch thu phí và đối chiếu công nợ dễ dàng.",
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
    {
      title: "Báo cáo CLB",
      description: "Xuất báo cáo thành viên, ngân sách và kết quả hoạt động.",
    },
  ];

  const PROCESS_STEPS = [
    {
      number: "01",
      label: "Thiết lập",
      title: "Bản đồ câu lạc bộ",
      description: "Chuẩn hóa dữ liệu và cơ cấu ngay từ đầu.",
    },
    {
      number: "02",
      label: "Thiết lập",
      title: "Hồ sơ thành viên",
      description: "Ghi nhận thông tin, kỹ năng và quyền lãnh đạo.",
    },
    {
      number: "03",
      label: "Xử lý",
      title: "Đăng ký & Phí",
      description:
        "Sinh viên đăng ký, được duyệt và hoàn tất thanh toán tự động.",
    },
    {
      number: "04",
      label: "Xử lý",
      title: "Xử lý ngoại lệ",
      description: "Theo dõi lỗi, cảnh báo, phí chưa thanh toán.",
    },
    {
      number: "05",
      label: "Báo cáo",
      title: "Kết quả hoạt động",
      description: "KPI, tỉ lệ tham gia, doanh thu cuối kỳ.",
    },
  ];

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
            Điều phối toàn bộ vòng đời câu lạc bộ – dữ liệu, thành viên, tài
            chính và báo cáo.
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
                                <b>Chủ nhiệm:</b> {club.details.contact.leader}
                              </p>
                              <p className="mb-1">
                                <b>SĐT:</b> {club.details.contact.phone}
                              </p>
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
          <div className="flex justify-center items-start">
            <img
              src={ClubImage}
              alt="CLB"
              className="rounded-xl shadow-lg w-full"
            />
          </div>
        </div>
      </section>

      {/* === OPERATIONS === */}
      <section id="operations" className="py-24" data-animate>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12 text-center">
            Các thao tác chính
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* === PROCESS === */}
      <section id="process" className="py-24 bg-orange-50" data-animate>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-light mb-12 text-center">
            Quy trình vận hành
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {PROCESS_STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center transition-all duration-700 ${
                  visibleSections.has("process")
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-orange-200 mb-3">
                  <span className="text-[10px] tracking-widest text-orange-400 uppercase">
                    {step.label}
                  </span>
                  <span className="text-xl font-semibold">{step.number}</span>
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-600 font-light">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubHubHome;
