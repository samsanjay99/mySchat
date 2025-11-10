import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        throw new Error(`${res.status}: ${errorData.message || JSON.stringify(errorData)}`);
      } else {
        const text = await res.text();
        // Check if response is HTML (likely a server error page)
        if (text.includes("<!DOCTYPE html>") || text.includes("<html>")) {
          throw new Error(`${res.status}: Server error. Please try again later.`);
        }
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('schat_token');
  const headers: HeadersInit = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <TQueryFnData = unknown>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<TQueryFnData, readonly [string, ...unknown[]]> => 
  async ({ queryKey }) => {
    const token = localStorage.getItem('schat_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      console.log('Making API request to:', queryKey[0], 'with token:', token ? 'present' : 'missing');
      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });

      console.log('Response status:', res.status);
      
      if (options.on401 === "returnNull" && res.status === 401) {
        console.log('Returning null due to 401 status');
        return null as TQueryFnData;
      }

      await throwIfResNotOk(res);
      const data = await res.json() as TQueryFnData;
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error("Query Error:", error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
