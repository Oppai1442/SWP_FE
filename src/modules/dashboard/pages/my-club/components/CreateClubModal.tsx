import { type ChangeEvent, type FormEvent, useRef } from 'react';
import { CalendarClock, Info, Loader2, MapPin, UploadCloud, X } from 'lucide-react';

const WEEKDAY_OPTIONS = [
  { value: 'MONDAY', label: 'Thứ 2' },
  { value: 'TUESDAY', label: 'Thứ 3' },
  { value: 'WEDNESDAY', label: 'Thứ 4' },
  { value: 'THURSDAY', label: 'Thứ 5' },
  { value: 'FRIDAY', label: 'Thứ 6' },
  { value: 'SATURDAY', label: 'Thứ 7' },
  { value: 'SUNDAY', label: 'Chủ nhật' },
] as const;

interface CreateClubForm {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  imageFileName?: string;
  meetingLocation: string;
  mission: string;
  operatingDays: string[];
  operatingStartTime: string;
  operatingEndTime: string;
}

interface CreateClubModalProps {
  form: CreateClubForm;
  isSubmitting: boolean;
  onChange: (field: keyof CreateClubForm, value: CreateClubForm[keyof CreateClubForm]) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  isUploadingImage: boolean;
  imageError?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const CreateClubModal = ({
  form,
  isSubmitting,
  onChange,
  onUploadImage,
  onRemoveImage,
  isUploadingImage,
  imageError,
  onSubmit,
  onClose,
}: CreateClubModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleOperatingDay = (dayValue: string) => {
    const current = form.operatingDays ?? [];
    const set = new Set(current);
    if (set.has(dayValue)) {
      set.delete(dayValue);
    } else {
      set.add(dayValue);
    }
    onChange('operatingDays', Array.from(set));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadImage(file);
    }
    event.target.value = '';
  };

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* 1. Mở rộng max-width thành 5xl và dùng grid layout */}
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <form onSubmit={onSubmit} className="grid md:grid-cols-12 md:h-[85vh]">
          
          {/* --- LEFT PANEL: Header + Image Upload (Chiếm 4/12 cột) --- */}
          <div className="col-span-12 flex flex-col justify-between border-r border-slate-100 bg-slate-50/50 p-6 md:col-span-4 md:p-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-orange-500 font-bold">Câu lạc bộ mới</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 leading-tight">
                  Đăng ký<br />Câu lạc bộ mới
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Điền thông tin chi tiết để gửi yêu cầu phê duyệt thành lập câu lạc bộ.
                </p>
              </div>

              {/* Image Upload Area moved to Left Side */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ảnh bìa câu lạc bộ
                </label>
                <div className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-white transition hover:border-orange-300">
                  {form.imageUrl ? (
                    <>
                      <img
                        src={form.imageUrl}
                        alt="Club cover"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                         <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mb-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-orange-500"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={onRemoveImage}
                          className="rounded-full bg-red-500/80 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500"
                        >
                          Xóa
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 p-6 text-slate-400 hover:bg-slate-50 transition"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      ) : (
                        <div className="rounded-full bg-slate-100 p-3">
                            <UploadCloud className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="text-center">
                        <span className="block text-sm font-semibold text-slate-600">Nhấn để tải lên</span>
                        <span className="text-xs">PNG, JPG tối đa 5MB</span>
                      </div>
                    </button>
                  )}
                  {imageError && <div className="bg-red-50 p-2 text-center text-xs text-red-500">{imageError}</div>}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* --- RIGHT PANEL: Scrollable Form Inputs (Chiếm 8/12 cột) --- */}
          <div className="col-span-12 flex min-h-0 flex-col bg-white md:col-span-8">
            {/* Header Sticky trong cột phải (để chứa nút Close) */}
            <div className="sticky top-0 z-10 flex items-center justify-end border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur-md">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content Scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8 min-h-0">
              <div className="space-y-6">
                {/* Basic Info Group */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tên câu lạc bộ
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => onChange('name', event.target.value)}
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      placeholder="Ví dụ: Green Horizon"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Thể loại
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(event) => onChange('category', event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                      placeholder="Công nghệ, Nghệ thuật..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Mô tả
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) => onChange('description', event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Mô tả ngắn gọn về CLB..."
                  />
                </div>

                <div className="h-px bg-slate-100" />

                {/* Logistics Group */}
                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Địa điểm sinh hoạt
                        </label>
                        <div className="relative mt-1.5">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={form.meetingLocation}
                            onChange={(event) => onChange('meetingLocation', event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 pl-11 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            placeholder="Tòa nhà A3, phòng 204..."
                        />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Sứ mệnh
                    </label>
                    <textarea
                    value={form.mission}
                    onChange={(event) => onChange('mission', event.target.value)}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/30 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Sứ mệnh và giá trị cốt lõi..."
                    />
                </div>

                {/* Operating Schedule Block */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <CalendarClock className="h-5 w-5" />
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-slate-900">Thời gian hoạt động</h4>
                            <p className="text-xs text-slate-500">Lịch sinh hoạt định kỳ.</p>
                         </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="mb-2 text-xs font-semibold text-slate-500">Chọn ngày trong tuần</p>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAY_OPTIONS.map((day) => {
                                const selected = form.operatingDays?.includes(day.value);
                                return (
                                    <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleOperatingDay(day.value)}
                                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${selected
                                        ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-orange-300 hover:text-orange-500'
                                        }`}
                                    >
                                    {day.label}
                                    </button>
                                );
                                })}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Bắt đầu</label>
                                <input
                                type="time"
                                value={form.operatingStartTime}
                                onChange={(event) => onChange('operatingStartTime', event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Kết thúc</label>
                                <input
                                type="time"
                                value={form.operatingEndTime}
                                onChange={(event) => onChange('operatingEndTime', event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-slate-100 bg-white p-6 md:px-8">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-orange-500 hover:shadow-orange-200 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export type { CreateClubForm, CreateClubModalProps };
export default CreateClubModal;
