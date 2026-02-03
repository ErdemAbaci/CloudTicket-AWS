import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

// İstemciler (Tip tanımlamaları otomatik gelir)
const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);
const sqsClient = new SQSClient({});

const TABLE_NAME = process.env.EVENTS_TABLE || "";
const QUEUE_URL = process.env.QUEUE_URL || "";

// --- TİP TANIMLAMALARI (INTERFACE) ---
// Veritabanına ne kaydedeceğimizi burada tanımlıyoruz.
// Birisi yanlışlıkla "price" alanını silerse kod hata verir!
interface TicketEvent {
  id: string;
  name: string;
  date: string;
  price: number;
  createdAt: string;
}

// 1. HELLO
export const hello = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Sistem Aktif! (TypeScript Powered) 🚀" }),
  };
};

// 2. CREATE EVENT (Producer)
export const createEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body eksik" }) };
    }

    const body = JSON.parse(event.body) as Partial<TicketEvent>;
    
    // Basit bir validasyon
    if (!body.name || !body.price) {
       return { statusCode: 400, body: JSON.stringify({ error: "İsim ve Fiyat zorunludur" }) };
    }

    const eventId = randomUUID();

    const messageBody: TicketEvent = {
      id: eventId,
      name: body.name,
      date: body.date || new Date().toISOString(),
      price: body.price,
      createdAt: new Date().toISOString()
    };

    await sqsClient.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    }));

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: "İsteğiniz kuyruğa alındı.",
        id: eventId
      }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Sunucu hatası" }) };
  }
};

// 3. PROCESS EVENT (Consumer - SQS Worker)
export const processEvent = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      console.log("İşleniyor:", record.body);
      const eventData = JSON.parse(record.body) as TicketEvent;

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: eventData, // Typescript burada veri tipini kontrol eder!
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
    return { statusCode: 200, body: JSON.stringify(result.Items || []) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Hata" }) };
  }
};

// 5. GET EVENT BY ID
export const getEvent = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return { statusCode: 400, body: "ID gerekli" };

    const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
    
    if (!result.Item) return { statusCode: 404, body: JSON.stringify({ error: "Bulunamadı" }) };
    
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: "Hata" }) };
  }
};