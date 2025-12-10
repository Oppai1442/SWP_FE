import { type ChangeEvent, type FormEvent, useRef } from 'react';
import { Loader2, MapPin, UploadCloud, X } from 'lucide-react';

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
  foundedDate: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
    <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400">New club</p>
          <h3 className="text-lg font-semibold text-slate-900">Submit a club for approval</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-orange-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Club name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="e.g. Green Horizon"
            />
          </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
          </label>
            <input
              type="text"
              value={form.category}
              onChange={(event) => onChange('category', event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Sports, Culture, Tech..."
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(event) => onChange('description', event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            placeholder="Summarize the club mission and planned programs."
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meeting location
            </label>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.meetingLocation}
                onChange={(event) => onChange('meetingLocation', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 pl-11 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Building A3, room 204..."
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Founded date
            </label>
            <input
              type="date"
              value={form.foundedDate}
              onChange={(event) => onChange('foundedDate', event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mission statement
          </label>
          <textarea
            value={form.mission}
            onChange={(event) => onChange('mission', event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            placeholder="Explain why the club exists and the value it brings."
          />
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50/40 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Operating schedule</p>
              <h4 className="text-base font-semibold text-slate-900">Thời gian hoạt động</h4>
              <p className="text-xs text-slate-500">Chọn các ngày và khung giờ sinh hoạt của câu lạc bộ.</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày hoạt động</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const selected = form.operatingDays?.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleOperatingDay(day.value)}
                    className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? 'border-orange-400 bg-orange-50 text-orange-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:text-orange-500'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                value={form.operatingStartTime}
                onChange={(event) => onChange('operatingStartTime', event.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Giờ kết thúc
              </label>
              <input
                type="time"
                value={form.operatingEndTime}
                onChange={(event) => onChange('operatingEndTime', event.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Club image
          </label>
          <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
            {form.imageUrl ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-white shadow-sm">
                  <img
                    src={form.imageUrl}
                    alt="Club cover"
                    className="h-48 w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600 shadow-sm">
                    {form.imageFileName ?? 'Uploaded image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-500"
                    disabled={isUploadingImage}
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="rounded-2xl border border-transparent px-3 py-1 font-semibold text-red-500 transition hover:text-red-600"
                    disabled={isUploadingImage}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-10 text-sm font-semibold text-slate-500 transition hover:border-orange-200 hover:text-orange-500 disabled:opacity-60"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-orange-500" />
                )}
                {isUploadingImage ? 'Uploading image...' : 'Upload club cover'}
                <span className="text-xs font-normal text-slate-400">PNG, JPG up to 5MB.</span>
              </button>
            )}
            {imageError && <p className="mt-2 text-xs text-red-500">{imageError}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit request
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export type { CreateClubForm, CreateClubModalProps };
export default CreateClubModal;
