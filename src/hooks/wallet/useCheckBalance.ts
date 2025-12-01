import { getData } from '@/services/api/apiService';
import { useQuery } from '@tanstack/react-query';

const fetchBalance = async () => {
  const response = await getData("/wallet/balance");
  return response.data;
};

export const useCheckBalance = () => {
  const { data: balance, isLoading, isError } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: fetchBalance,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const hasSufficientBalance = (amount: number): boolean => {
    if (typeof balance !== 'number') return false;
    return balance >= amount;
  };

  return {
    balance,
    isLoading,
    isError,
    hasSufficientBalance,
  };
};
