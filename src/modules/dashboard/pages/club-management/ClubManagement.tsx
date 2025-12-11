import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import {
  getClubsAPI,
  getClubDetailAPI,
  getClubActivitiesAPI,
  type ClubSummary,
  type ClubDetail,
  type ClubActivity,
} from "../my-club/services/myClubService";
import { showToast } from "@/utils";

// Import các components con
import { ClubStats } from "./components/ClubStats";
import { ClubListTable } from "./components/ClubListTable";
import { ClubDetailDrawer } from "./components/ClubDetailDrawer";

type DetailTab = "overview" | "activities";

const ClubManagement = () => {
  // --- Global State ---
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Detail Drawer State ---
  const [selectedClub, setSelectedClub] = useState<ClubSummary | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [clubDetail, setClubDetail] = useState<ClubDetail | null>(null);
  const [activities, setActivities] = useState<ClubActivity[]>([]);

  // --- Actions ---
  const fetchClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getClubsAPI("all");
      setClubs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      showToast("error", "Không thể tải danh sách câu lạc bộ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClubs();
  }, [fetchClubs]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchClubs();
    setIsRefreshing(false);
    showToast("success", "Đã làm mới danh sách.");
  };

  const openDetail = useCallback(async (club: ClubSummary) => {
    setSelectedClub(club);
    setDetailTab("overview");
    setIsDetailLoading(true);
    // Reset data
    setClubDetail(null);
    setActivities([]);

    try {
      const [detail, actData] = await Promise.all([
        getClubDetailAPI(club.id),
        getClubActivitiesAPI(club.id),
      ]);
      setClubDetail(detail ?? club);
      setActivities(Array.isArray(actData) ? actData : []);
    } catch (e) {
      showToast("error", "Lỗi khi tải thông tin chi tiết.");
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeDetail = () => setSelectedClub(null);

  return (
    <div className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-orange-400">
            Quản lý câu lạc bộ
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Câu lạc bộ hệ thống
          </h1>
          <p className="text-sm text-slate-500">
            Giám sát tổng quan và tình trạng hoạt động của các CLB.
          </p>
        </div>
        <button
          onClick={() => void handleRefresh()}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 transition hover:bg-orange-50 disabled:opacity-70"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />{" "}
          Làm mới
        </button>
      </div>

      {/* Stats & Table */}
      <ClubStats clubs={clubs} />

      <ClubListTable
        clubs={clubs}
        isLoading={isLoading}
        onOpenDetail={openDetail}
      />

      {/* Drawer (Chỉ xem) */}
      {selectedClub && (
        <ClubDetailDrawer
          clubSummary={selectedClub}
          club={clubDetail}
          activities={activities}
          activeTab={detailTab}
          onTabChange={setDetailTab}
          isLoading={isDetailLoading}
          onClose={closeDetail}
        />
      )}
    </div>
  );
};

export default ClubManagement;
