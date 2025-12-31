import { AppError } from "@/lib/errors";

interface ApiOptions extends RequestInit {
  parseAs?: "json" | "text";
}

async function parseResponse(
  response: Response,
  parseAs: ApiOptions["parseAs"],
) {
  if (parseAs === "text") {
    return response.text();
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  { parseAs = "json", headers, ...init }: ApiOptions = {},
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    let errorBody: unknown = undefined;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    throw new AppError(
      (errorBody as { error?: string })?.error ?? "Error inesperado en la API.",
      response.status,
      errorBody,
    );
  }

  return parseResponse(response, parseAs) as Promise<T>;
}
