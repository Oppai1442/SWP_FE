import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useState,
} from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
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
  paymentProofUrl: string | null;
  paymentProofFileName?: string | null;
  isUploadingProof?: boolean;
  proofError?: string | null;
  allowUpload?: boolean;
  onUploadProof: (file: File) => void;
  onRemoveProof: () => void;
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
  paymentProofUrl,
  paymentProofFileName,
  isUploadingProof,
  proofError,
  allowUpload = false,
  onUploadProof,
  onRemoveProof,
  onChange,
  onSubmit,
  onClose,
  modalTitle = 'Nhập mã mời của bạn',
  showInviteCodeInput = false,
  inviteCodeHint,
}: JoinClubModalProps) => {
  const [modalTab, setModalTab] = useState<'details' | 'payment'>('details');
  const qrUrl = preview
    ? buildVietQrUrl({
        bankId: preview.bankId,
        bankAccountNumber: preview.bankAccountNumber,
        bankAccountName: preview.bankAccountName ?? preview.clubName,
        amount: preview.joinFee ?? 0,
        content: preview.bankTransferNote ?? preview.clubCode ?? preview.clubName,
      })
    : '';
  const hasBankInstructions = Boolean(preview?.bankId && preview?.bankAccountNumber);
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadProof(file);
    }
    event.target.value = '';
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!allowUpload || isUploadingProof) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onUploadProof(file);
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
                { id: 'details', label: 'Chi tiết tham gia' },
                { id: 'payment', label: 'Thanh toán & bằng chứng' },
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
                    Cung cấp mã mời và một động lực ngắn gọn.
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
                      {inviteCodeHint ?? 'Mã mời được cung cấp tự động cho câu lạc bộ này.'}
                    </div>
                  )} */}
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
                  Thanh toán phí tham gia bằng mã QR được tạo bên dưới, sau đó gửi yêu cầu của bạn. Trưởng nhóm xem xét mọi hồ sơ theo cách thủ công.
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
                      {preview?.bankTransferNote && (
                        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <span className="text-slate-500">Ghi chú chuyển khoản</span>
                          <span className="font-semibold text-slate-900">
                            {preview.bankTransferNote}
                          </span>
                        </div>
                      )}
                      {qrUrl && (
                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
                          <img
                            src={qrUrl}
                            alt="VietQR"
                            className="mx-auto h-36 w-36 rounded-2xl border border-white bg-white object-contain p-3 shadow-inner"
                          />
                          <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">
                            Quét để thanh toán trước khi gửi
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Hướng dẫn thanh toán sẽ xuất hiện khi câu lạc bộ cung cấp.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-900">Bằng chứng thanh toán</p>
                  <p className="text-xs text-slate-500">
                    Tải lên ảnh chụp màn hình biên lai. Kéo & thả hoặc chọn tệp. Các tệp được hỗ trợ: hình ảnh, tối đa 10MB.
                  </p>
                </div>
                {paymentProofUrl ? (
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                      <img
                        src={paymentProofUrl}
                        alt="Payment evidence"
                        className="h-32 w-32 rounded-xl object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-slate-900">{paymentProofFileName ?? 'bang-chung-thanh-toan.jpg'}</p>
                      <p className="text-xs text-slate-500">Tải lên thành công.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={onRemoveProof}
                          className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-500"
                        >
                          Xóa
                        </button>
                        <a
                          href={paymentProofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-500 transition hover:bg-orange-50"
                        >
                          Xem đầy đủ
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`mt-4 rounded-2xl border border-dashed px-4 py-6 text-center ${
                      allowUpload ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200 bg-slate-50'
                    } ${isUploadingProof ? 'opacity-70' : ''}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="payment-proof-input"
                      className="hidden"
                      disabled={!allowUpload || isUploadingProof}
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="payment-proof-input"
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 ${
                        !allowUpload ? 'pointer-events-none' : ''
                      }`}
                    >
                      <UploadCloud className="h-8 w-8 text-orange-400" />
                      <p className="text-sm font-semibold text-slate-900">
                        {allowUpload ? 'Thả hình ảnh của bạn vào đây' : 'Nhập mã mời để kích hoạt tải lên'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {allowUpload
                          ? 'hoặc nhấp để duyệt tệp'
                          : 'Tải lên sẽ mở khóa sau khi có hướng dẫn.'}
                      </p>
                    </label>
                    {isUploadingProof && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Đang tải bằng chứng lên...
                      </div>
                    )}
                  </div>
                )}
                {proofError && <p className="mt-2 text-xs text-rose-500">{proofError}</p>}
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-60"
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
