import { EventBridgeEvent } from "aws-lambda";
import * as QRCode from "qrcode";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../db/client";
import { randomUUID } from "crypto";
import { TicketPurchasedDetail } from "../../types";
import { getEventById } from "../../db/eventRepository";
import { createTicketRecord } from "../../db/ticketRepository";

const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "";

export const handler = async (event: EventBridgeEvent<"TicketPurchased", TicketPurchasedDetail>) => {
  try {
    const { eventId, userId, purchasedAt } = event.detail;
    const ticketId = randomUUID();

    const ticketEvent = await getEventById(eventId);
    const eventName = ticketEvent?.name || "Bilinmeyen Etkinlik";
    const eventDate = ticketEvent?.date || "";
    
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

    await createTicketRecord({
      userId,
      ticketId,
      eventId,
      eventName,
      eventDate,
      purchasedAt,
      qrUrl,
      status: "ACTIVE",
    });

    console.log(`Bilet ${ticketId} oluşturuldu. S3 Yüklemesi başarılı! Kullanıcı: ${userId}`);

  } catch (error) {
    console.error("QR oluşturma hatası:", error);
    throw error;
  }
};
