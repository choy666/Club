import { handleApiError, jsonSuccess } from "@/lib/http";
import { getDashboardSummary } from "@/lib/dashboard/service";

export const revalidate = 60;

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return jsonSuccess(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
