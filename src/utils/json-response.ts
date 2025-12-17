export interface JsonResponse<T> {
  status: number;
  message: string;
  data: T | Record<string, never>;
}

export function createJsonResponse<T>(
  status: number,
  message: string,
  data: T | null,
): JsonResponse<T> {
  return {
    status,
    message,
    data: data === null || data === undefined ? {} : data,
  };
}
