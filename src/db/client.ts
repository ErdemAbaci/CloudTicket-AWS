import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { S3Client } from "@aws-sdk/client-s3";
// AWS SDK Clients
export const dbClient = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(dbClient);
export const eventBridgeClient = new EventBridgeClient({});
export const s3Client = new S3Client({});
