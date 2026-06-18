import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { listAllPurchaseHistory } from "../../db/historyRepository";
import { buildAnalyticsOverview } from "../../services/analyticsService";
import { formatResponse } from "../../utils/response";

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const history = await listAllPurchaseHistory();
    const overview = buildAnalyticsOverview(history);

    return formatResponse(200, overview);
  } catch (error) {
    console.error("Analytics Overview Error:", error);
    return formatResponse(500, { error: "Analitik özeti yüklenemedi" });
  }
};
