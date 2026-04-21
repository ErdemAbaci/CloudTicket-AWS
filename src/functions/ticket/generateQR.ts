import { EventBridgeEvent } from "aws-lambda";
import * as QRCode from "qrcode";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "../../db/client";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const s3Client = new S3Client({});
const TICKETS_TABLE = process.env.TICKETS_TABLE || "";
const EVENTS_TABLE = process.env.EVENTS_TABLE || "";
const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "";

interface TicketPurchasedDetail {
  eventId: string;
  userId: string;
  purchasedAt: string;
}

export const handler = async (event: EventBridgeEvent<"TicketPurchased", TicketPurchasedDetail>) => {
  try {
    const { eventId, userId, purchasedAt } = event.detail;
    const ticketId = randomUUID();

    // Etkinlik detayını çek (Denormalizasyon için)
    const eventResult = await docClient.send(new GetCommand({
      TableName: EVENTS_TABLE,
      Key: { id: eventId }
    }));
    const eventName = eventResult.Item?.name || "Bilinmeyen Etkinlik";
    const eventDate = eventResult.Item?.date || "";
    
    // QR Code içeriği olarak bilet ID ve etkinlik ID gizliyoruz
    const qrData = JSON.stringify({ ticketId, eventId, userId });
    const qrBuffer = await QRCode.toBuffer(qrData, { type: 'png', margin: 2, scale: 8 });

    const objectKey = `qrcodes/${eventId}/${ticketId}.png`;

    // 1. S3'e QR kod görselini yükle
    await s3Client.send(new PutObjectCommand({
      Bucket: MEDIA_BUCKET_NAME,
      Key: objectKey,
      Body: qrBuffer,
      ContentType: "image/png",
    }));

    // Public URL formatı
    const qrUrl = `https://${MEDIA_BUCKET_NAME}.s3.eu-central-1.amazonaws.com/${objectKey}`;

    // 2. DynamoDB'ye Bilet Kaydı Ekle
    await docClient.send(new PutCommand({
      TableName: TICKETS_TABLE,
      Item: {
        userId,
        ticketId,
        eventId,
        eventName,
        eventDate,
        purchasedAt,
        qrUrl,
        status: "ACTIVE" // İleride güvenlik kamerasıyla okutulunca "USED" olabilir
      }
    }));

    console.log(`Bilet ${ticketId} oluşturuldu. S3 Yüklemesi başarılı! Kullanıcı: ${userId}`);

  } catch (error) {
    console.error("QR oluşturma hatası:", error);
    throw error;
  }
};
