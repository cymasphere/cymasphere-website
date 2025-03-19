// Format success response
export function formatSuccess(data?: any): { success: boolean; data?: any } {
  return {
    success: true,
    ...(data !== undefined && { data }),
  };
}

// Format error response
export function formatError(error: string | Error): {
  success: boolean;
  error: string;
} {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    success: false,
    error: errorMessage,
  };
}

// Simplify slug
export function simplifySlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9]/g, "");
}
