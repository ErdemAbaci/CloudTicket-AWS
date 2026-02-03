const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs"); // SQS Kütüphanesi
const crypto = require("crypto");

// İstemciler
const dbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dbClient);
const sqsClient = new SQSClient();

const TABLE_NAME = process.env.EVENTS_TABLE;
const QUEUE_URL = process.env.QUEUE_URL;

module.exports.hello = async (event) => {
  return { statusCode: 200, body: JSON.stringify({ message: "Sistem Aktif! 🚀" }) };
};

// 1. PRODUCER: İsteği al, kuyruğa at, kullanıcıya hemen dön.
module.exports.createEvent = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const eventId = crypto.randomUUID(); // ID'yi burada oluşturuyoruz

    // Kuyruğa gidecek mesaj paketi
    const messageBody = {
      id: eventId,
      name: body.name,
      date: body.date,
      price: body.price,
      createdAt: new Date().toISOString()
    };

    // SQS'e gönder
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(messageBody),
    });

    await sqsClient.send(command);

    console.log(`Mesaj kuyruğa atıldı. ID: ${eventId}`);

    // Kullanıcıya ANINDA cevap ver (DB yazma işlemini beklemeden)
    return {
      statusCode: 202, // 202 Accepted (Kabul Edildi ama henüz bitmedi)
      body: JSON.stringify({
        message: "İsteğiniz kuyruğa alındı, işleniyor.",
        id: eventId // Kullanıcı bu ID ile sonra sorgu yapabilir
      }),
    };

  } catch (error) {
    console.error("Kuyruk Hatası:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "İstek kuyruğa atılamadı" }) };
  }
};

// 2. CONSUMER: Kuyruğu dinle, veriyi al, DynamoDB'ye yaz.
module.exports.processEvent = async (event) => {
  // SQS'den gelen mesajlar "Records" dizisi içinde gelir
  for (const record of event.Records) {
    try {
      console.log("Kuyruktan mesaj alındı:", record.body);
      
      const eventData = JSON.parse(record.body);

      // DynamoDB'ye yazma işlemi (Eskiden createEvent içindeydi)
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: eventData,
      });

      await docClient.send(command);
      console.log(`Etkinlik başarıyla veritabanına yazıldı: ${eventData.id}`);

    } catch (error) {
      console.error("İşleme Hatası:", error);
      // Not: Burada hata fırlatırsak SQS mesajı silinmez, tekrar denenir (Retry)
    }
  }
};

// --- Okuma Fonksiyonları (Değişiklik Yok) ---
module.exports.listEvents = async (event) => {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    return { statusCode: 200, body: JSON.stringify(result.Items || []) };
  } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};

module.exports.getEvent = async (event) => {
  try {
    const { id } = event.pathParameters;
    const result = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
    if (!result.Item) return { statusCode: 404, body: JSON.stringify({ error: "Bulunamadı" }) };
    return { statusCode: 200, body: JSON.stringify(result.Item) };
  } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};