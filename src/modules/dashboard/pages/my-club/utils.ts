const VND_FORMATTER = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export const formatJoinFeeValue = (value?: number | null) => VND_FORMATTER.format(value ?? 0);

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const buildVietQrUrl = ({
  bankId,
  bankAccountNumber,
  bankAccountName,
  amount,
  content,
}: {
  bankId?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  amount?: number | null;
  content?: string | null;
}) => {
  if (!bankId || !bankAccountNumber) {
    return '';
  }
  const params = new URLSearchParams();
  if (amount && amount > 0) {
    params.set('amount', Math.round(amount).toString());
  }
  if (content) {
    params.set('addInfo', content);
  }
  if (bankAccountName) {
    params.set('accountName', bankAccountName);
  }
  const query = params.toString();
  return `https://img.vietqr.io/image/${bankId}-${bankAccountNumber}-compact.png${
    query ? `?${query}` : ''
  }`;
};
