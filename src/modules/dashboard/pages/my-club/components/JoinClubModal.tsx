import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  // modalTitle = 'Nhập mã mời của bạn',
  // showInviteCodeInput = false,
  // inviteCodeHint,
}: JoinClubModalProps) => {
  const [modalTab, setModalTab] = useState<'details' | 'payment'>('details');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [isQrTemporarilyHidden, setIsQrTemporarilyHidden] = useState(false);

  const sanitizedTransferCode = useMemo(() => {
    return transferCode?.replace(/-/g, '') ?? '';
  }, [transferCode]);

  const transferNote = useMemo(() => {
    const trimmedCode = sanitizedTransferCode.trim();
    return (
      trimmedCode ||
      preview?.bankTransferNote ||
      preview?.clubCode ||
      preview?.clubName ||
      ''
    );
  }, [sanitizedTransferCode, preview]);

  const qrUrl = useMemo(() => {
    if (!preview) return '';
    return buildVietQrUrl({
      bankId: preview.bankId,
      bankAccountNumber: preview.bankAccountNumber,
      bankAccountName: preview.bankAccountName ?? preview.clubName,
      amount: preview.joinFee ?? 0,
      content: transferNote,
    });
  }, [preview, transferNote]);

  const hasBankInstructions = Boolean(preview?.bankId && preview?.bankAccountNumber);

  useEffect(() => {
    if (sanitizedTransferCode) {
      setIsQrTemporarilyHidden(false);
    }
  }, [sanitizedTransferCode]);

  const handleCopyTransferCode = async () => {
    if (!sanitizedTransferCode) return;
    try {
      await navigator.clipboard.writeText(sanitizedTransferCode);
      setCopyState('copied');
    } catch (error) {
      console.error(error);
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 2000);
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
            <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Tham gia câu lạc bộ</p>
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
                { id: 'details', label: 'Thông tin' },
                { id: 'payment', label: 'Thanh toán' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id as 'details' | 'payment')}
                  className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${modalTab === tab.id
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
                  <p className="text-sm font-semibold text-slate-900">Thông tin tham gia</p>
                  <p className="text-xs text-slate-500">
                    Cung cấp thông tin ngắn gọn để ban quản trị hiểu rõ hơn về bạn.
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  {/* {showInviteCodeInput ? (
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
                  )} */}

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Động lực tham gia
                    </label>
                    <textarea
                      value={form.motivation}
                      onChange={(event) => onChange('motivation', event.target.value)}
                      rows={5}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      placeholder="Hãy chia sẻ lý do bạn muốn tham gia..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-4 ${modalTab === 'payment' ? 'block' : 'hidden'} md:block`}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-sm font-semibold text-slate-900">Hướng dẫn thanh toán</p>
                <p className="text-xs text-slate-500">
                  Thanh toán bằng mã QR bên dưới, sau đó gửi yêu cầu để ban quản trị xác minh.
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
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm text-slate-500">Nội dung chuyển khoản</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCopyTransferCode}
                              disabled={!sanitizedTransferCode}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Copy className="h-3 w-3" />
                              {copyState === 'copied'
                                ? 'Đã sao chép'
                                : copyState === 'error'
                                  ? 'Lỗi'
                                  : 'Sao chép'}
                            </button>
                            {onRefreshTransferCode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsQrTemporarilyHidden(true);
                                    onRefreshTransferCode?.();
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-orange-200 px-3 py-1 text-[11px] font-semibold text-orange-500 transition hover:bg-orange-50"
                                >
                                  <RefreshCcw className="h-3 w-3" />
                                Tạo mã mới
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                          {transferNote || 'Đang tạo mã...'}
                        </p>
                      </div>
                        {qrUrl && !isQrTemporarilyHidden && (
                        <button
                          type="button"
                          onClick={() => setIsQrExpanded(true)}
                          className="mt-3 w-full rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center transition hover:border-orange-200 hover:bg-orange-50"
                        >
                          <img
                            src={qrUrl}
                            alt="VietQR"
                            className="mx-auto h-36 w-36 rounded-2xl border border-white bg-white object-contain p-3 shadow-inner"
                          />
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                            Nhấn để phóng to • Quét mã trước khi gửi
                          </p>
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Hướng dẫn thanh toán sẽ hiển thị khi câu lạc bộ hoàn tất thông tin ngân hàng.
                    </p>
                  )}
                </div>
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
              disabled={isSubmitting || !sanitizedTransferCode}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Gửi yêu cầu
            </button>
          </div>
        </form>
        {isQrExpanded && qrUrl && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 px-4"
            onClick={() => setIsQrExpanded(false)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 text-center shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsQrExpanded(false)}
                className="absolute right-4 top-4 rounded-full border border-slate-200 p-1 text-slate-500 transition hover:text-orange-500"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="mb-4 text-sm font-semibold text-slate-800">
                Quét mã để hoàn tất thanh toán
              </p>
              <img
                src={qrUrl}
                alt="VietQR"
                className="mx-auto max-h-[80vh] w-auto max-w-full rounded-3xl border border-slate-100 bg-white p-4 shadow-inner"
              />
              <p className="mt-4 break-all text-xs text-slate-500">
                {transferNote}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinClubModal;
