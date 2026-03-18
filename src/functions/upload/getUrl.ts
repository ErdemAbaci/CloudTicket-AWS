import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { formatResponse } from "../../utils/response";
import { s3Client } from "../../db/client";

const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const contentType = event.queryStringParameters?.contentType;

    if (!contentType) {
      return formatResponse(400, { error: "contentType is required" });
    }

    const fileExtension = contentType.split("/")[1] || "jpg";
    const key = `${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return formatResponse(200, {
      uploadUrl,
      key
    });
  } catch (error) {
    console.error("S3 Presigner Error:", error);
    return formatResponse(500, { error: "Could not generate upload URL" });
  }
};
