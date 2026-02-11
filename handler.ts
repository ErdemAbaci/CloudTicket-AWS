import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// İstemciler (Tip tanımlamaları otomatik gelir)
const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const eventBridgeClient = new EventBridgeClient({});
const s3Client = new S3Client({});

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || "";
const TABLE_NAME = process.env.EVENTS_TABLE || "";
const QUEUE_URL = process.env.QUEUE_URL || "";
const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "";

// --- TİP TANIMLAMALARI (INTERFACE) ---
// Veritabanına ne kaydedeceğimizi burada tanımlıyoruz.
// Birisi yanlışlıkla "price" alanını silerse kod hata verir!
interface TicketEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  imageUrl?: string; // Resim URL'i opsiyonel
  createdAt: string;
}

// --- CORS HEADERS ---
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

// 1. HELLO
export const hello = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: "Sistem Aktif! (TypeScript Powered) 🚀" }),
  };
};

// 2. CREATE EVENT (Producer)
export const createEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Body eksik" }) };
    }

    const body = JSON.parse(event.body) as Partial<TicketEvent>;

    // Basit bir validasyon
    if (!body.name || !body.price) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "İsim ve Fiyat zorunludur" }) };
    }

    const eventId = randomUUID();

    const messageBody: TicketEvent = {
      id: eventId,
      name: body.name,
      date: body.date || new Date().toISOString(),
      price: body.price,
      imageUrl: body.imageUrl,
      createdAt: new Date().toISOString()
    };

    await eventBridgeClient.send(new PutEventsCommand({
      Entries: [
        {
          Source: "com.cloudticket",    // Kuralda belirlediğimiz isimle AYNI olmalı
          DetailType: "OrderCreated",   // Kuralda belirlediğimiz tiple AYNI olmalı
          Detail: JSON.stringify(messageBody),
          EventBusName: EVENT_BUS_NAME,
        },
      ],
    }));

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({
        message: "İsteğiniz kuyruğa alındı.",
        id: eventId
      }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Sunucu hatası" }) };
  }
};

// 3. PROCESS EVENT (Consumer - SQS Worker)
export const processEvent = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      console.log("İşleniyor (Ham):", record.body);

      const body = JSON.parse(record.body);
      let eventData: TicketEvent;

      // EventBridge Envelope Check
      if (body.detail) {
        console.log("EventBridge Envelope detected, unwrapping...");
        eventData = body.detail;
      } else {
        console.log("Direct payload detected.");
        eventData = body as TicketEvent;
      }

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: eventData,
      }));

    } catch (error) {
      console.error("Hata:", error);
    }
  }
};

// 4. GET EVENTS
export const listEvents = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    return { statusCode: 200, headers, body: JSON.stringify(result.Items || []) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Hata" }) };
  }
};

// 5. GET EVENT BY ID
export const getEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, headers, body: "ID gerekli" };

    const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));

    if (!result.Item) return { statusCode: 404, headers, body: JSON.stringify({ error: "Bulunamadı" }) };

    return { statusCode: 200, headers, body: JSON.stringify(result.Item) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Hata" }) };
  }
};

// 6. GET UPLOAD URL (S3 Presigned URL)
export const getUploadUrl = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const contentType = event.queryStringParameters?.contentType;

    if (!contentType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "contentType is required" }) };
    }

    const fileExtension = contentType.split("/")[1] || "jpg";
    const key = `${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: MEDIA_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // 5 dakikalık (300 saniye) geçerli bir URL oluştur
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        key
      }),
    };
  } catch (error) {
    console.error("S3 Presigner Error:", error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not generate upload URL" }) };
  }
};