import { type FormEvent } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';

interface CreateClubForm {
  name: string;
  description: string;
  category: string;
  meetingLocation: string;
  mission: string;
  foundedDate: string;
}

interface CreateClubModalProps {
  form: CreateClubForm;
  isSubmitting: boolean;
  onChange: (field: keyof CreateClubForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const CreateClubModal = ({ form, isSubmitting, onChange, onSubmit, onClose }: CreateClubModalProps) => (
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

export type { CreateClubForm, CreateClubModalProps };
export default CreateClubModal;
