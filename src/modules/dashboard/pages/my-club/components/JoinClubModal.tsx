import { type FormEvent, useState } from 'react';
import { Copy, Loader2, RefreshCcw, X } from 'lucide-react';

import type { ClubSettingInfo } from '../services/myClubService';
import { buildVietQrUrl, formatJoinFeeValue } from '../utils';

export interface JoinClubForm {
  inviteCode: string;
  motivation: string;
}

export interface JoinClubModalProps {
  form: JoinClubForm;
  isSubmitting: boolean;
  preview?: ClubSettingInfo | null;
  isPreviewLoading?: boolean;
  previewError?: string | null;
  transferCode: string;
  onRefreshTransferCode?: () => void;
  onChange: (field: keyof JoinClubForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  modalTitle?: string;
  showInviteCodeInput?: boolean;
  inviteCodeHint?: string;
}

const JoinClubModal = ({
  form,
  isSubmitting,
  preview,
  isPreviewLoading,
  previewError,
  transferCode,
  onRefreshTransferCode,
  onChange,
  onSubmit,
  onClose,
  modalTitle = 'Nhập mã mời của bạn',
  showInviteCodeInput = false,
  inviteCodeHint,
}: JoinClubModalProps) => {
  const [modalTab, setModalTab] = useState<'details' | 'payment'>('details');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const transferNote =
    transferCode?.trim() ||
    preview?.bankTransferNote ||
    preview?.clubCode ||
    preview?.clubName ||
    '';

  const qrUrl = preview
    ? buildVietQrUrl({
        bankId: preview.bankId,
        bankAccountNumber: preview.bankAccountNumber,
        bankAccountName: preview.bankAccountName ?? preview.clubName,
        amount: preview.joinFee ?? 0,
        content: transferNote,
      })
    : '';

  const hasBankInstructions = Boolean(preview?.bankId && preview?.bankAccountNumber);

  const handleCopyTransferCode = async () => {
    if (!transferCode) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(transferCode);
      } else {
        const temp = document.createElement('input');
        temp.value = transferCode;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch (error) {
      console.error(error);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Tham gia CLB</p>
            <h3 className="text-lg font-semibold text-slate-900">{modalTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-orange-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 px-6 py-6">
          <div className="md:hidden">
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {[
                { id: 'details', label: 'Chi tiết tham gia' },
                { id: 'payment', label: 'Thanh toán & xác nhận' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id as 'details' | 'payment')}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
                    modalTab === tab.id
                      ? 'bg-white text-orange-600 shadow'
                      : 'text-slate-500 hover:text-orange-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className={`space-y-4 ${modalTab === 'details' ? 'block' : 'hidden'} md:block`}>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Chi tiết tham gia</p>
                  <p className="text-xs text-slate-500">
                    Cung cấp động lực ngắn gọn để giúp ban quản trị hiểu thêm về bạn.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  {showInviteCodeInput ? (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Mã mời
                      </label>
                      <input
                        type="text"
                        value={form.inviteCode}
                        onChange={(event) => onChange('inviteCode', event.target.value)}
                        required
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm uppercase tracking-wide outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {inviteCodeHint ?? 'Mã mời sẽ được xử lý tự động cho yêu cầu này.'}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Động lực (tùy chọn)
                    </label>
                    <textarea
                      value={form.motivation}
                      onChange={(event) => onChange('motivation', event.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      placeholder="Chia sẻ lý do bạn muốn tham gia..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-4 ${modalTab === 'payment' ? 'block' : 'hidden'} md:block`}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Hướng dẫn thanh toán</p>
                <p className="text-xs text-slate-500">
                  Thanh toán phí tham gia bằng mã QR bên dưới, sau đó gửi yêu cầu để ban quản trị xác minh.
                </p>
                <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3">
                  {isPreviewLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : previewError ? (
                    <p className="text-sm text-rose-500">{previewError}</p>
                  ) : hasBankInstructions ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Ngân hàng</span>
                        <span className="font-semibold text-slate-900">{preview?.bankId}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Tài khoản</span>
                        <span className="font-semibold text-slate-900">
                          {preview?.bankAccountNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Phí tham gia</span>
                        <span className="font-semibold text-slate-900">
                          {formatJoinFeeValue(preview?.joinFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="text-slate-500">Nội dung gợi ý</span>
                        <span className="font-semibold text-slate-900">
                          {transferNote || 'Đang tạo mã...'}
                        </span>
                      </div>
                      {qrUrl && (
                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                          <img
                            src={qrUrl}
                            alt="VietQR"
                            className="mx-auto h-36 w-36 rounded-2xl border border-white bg-white object-contain p-3 shadow-inner"
                          />
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                            Quét mã trước khi gửi yêu cầu
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Hướng dẫn thanh toán sẽ hiển thị khi câu lạc bộ cung cấp thông tin ngân hàng.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900">Mã chuyển khoản</p>
                  <p className="text-xs text-slate-500">
                    Sử dụng mã này làm nội dung chuyển khoản. Ban quản trị sẽ đối chiếu mã khi duyệt.
                  </p>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nội dung chuyển khoản
                  </p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="flex-1 break-all font-mono text-lg font-semibold text-slate-900">
                      {transferCode || 'Đang tạo mã...'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCopyTransferCode}
                        disabled={!transferCode}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copyState === 'copied'
                          ? 'Đã sao chép'
                          : copyState === 'error'
                          ? 'Không thể sao chép'
                          : 'Sao chép'}
                      </button>
                      {onRefreshTransferCode && (
                        <button
                          type="button"
                          onClick={onRefreshTransferCode}
                          className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                          Tạo mã mới
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Mỗi mã chỉ hợp lệ cho một yêu cầu tham gia. Hãy chắc chắn bạn đã thanh toán trước khi
                  gửi.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !transferCode}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinClubModal;
