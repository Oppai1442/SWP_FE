import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getData, postData, putData, deleteData } from '@/services/api/apiService';
import { queryClient } from '@/lib/react-query';

export const useApiQuery = <TData = any, TError = AxiosError>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: async () => {
      const response = await getData<TData>(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// export const useApiMutation = <TData = any, TVariables = any, TError = AxiosError>(
//   url: string,
//   method: 'post' | 'put' | 'delete',
//   options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
// ) => {
//   const mutationFn = async (variables: TVariables) => {
//     const apiMethod = {
//       post: postData,
//       put: putData,
//       delete: deleteData,
//     }[method];

//     const response = await apiMethod<TData>(url, variables);
//     return response.data;
//   };

//   return useMutation<TData, TError, TVariables>({
//     mutationFn,
//     retry: 1,
//     ...options,
//   });
// };

export const useApiMutation = <TData = any, TVariables = any, TError = AxiosError>(
  url: string,
  method: 'post' | 'put' | 'delete',
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & {
    contentType?: 'json' | 'formData' | 'auto';
  }
) => {
  const mutationFn = async (variables: TVariables) => {
    const apiMethod = {
      post: postData,
      put: putData,
      delete: deleteData,
    }[method];

    const contentType = options?.contentType || 'auto';
    
    // Auto-detect content type nếu không được chỉ định
    const shouldUseFormData = contentType === 'formData' || 
      (contentType === 'auto' && (
        variables instanceof FormData ||
        hasFileContent(variables)
      ));

    if (shouldUseFormData) {
      // Xử lý FormData
      const formData = variables instanceof FormData 
        ? variables 
        : convertToFormData(variables);
      
      const response = await apiMethod<TData>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } else {
      // Xử lý JSON (mặc định)
      const response = await apiMethod<TData>(url, variables, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    }
  };

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    retry: 1,
    ...options,
  });
};

// Helper functions
const hasFileContent = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  return Object.values(data).some(value => {
    if (value instanceof File || value instanceof Blob) return true;
    if (Array.isArray(value)) {
      return value.some(item => item instanceof File || item instanceof Blob);
    }
    return false;
  });
};

const convertToFormData = (data: any): FormData => {
  const formData = new FormData();
  
  const appendToFormData = (key: string, value: any) => {
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item instanceof File || item instanceof Blob) {
          formData.append(key, item);
        } else {
          formData.append(`${key}[${index}]`, 
            typeof item === 'object' ? JSON.stringify(item) : String(item)
          );
        }
      });
    } else if (value !== null && value !== undefined) {
      formData.append(key, 
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );
    }
  };
  
  Object.entries(data).forEach(([key, value]) => {
    appendToFormData(key, value);
  });
  
  return formData;
};


// Custom hook for optimistic updates
export const useOptimisticMutation = <TData = any, TVariables = any, TError = AxiosError>(
  url: string,
  method: 'post' | 'put' | 'delete',
  queryKey: string[],
  updateOptimisticData: (oldData: TData, variables: TVariables) => TData,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) => {
  return useApiMutation<TData, TVariables, TError>(url, method, {
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TData>(queryKey);

      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, (old) => 
          updateOptimisticData(old as TData, variables)
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context?.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    ...options,
  });
};