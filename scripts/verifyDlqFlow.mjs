import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const queueUrl = args.get("--queue-url") || process.env.QUEUE_URL;
const dlqUrl = args.get("--dlq-url") || process.env.DLQ_URL;
const region = args.get("--region") || process.env.AWS_REGION || "eu-central-1";
const waitSeconds = Number(args.get("--wait-seconds") || process.env.WAIT_SECONDS || 25);

if (!queueUrl || !dlqUrl) {
  console.error("Usage: node scripts/verifyDlqFlow.mjs --queue-url <queueUrl> --dlq-url <dlqUrl> [--region eu-central-1] [--wait-seconds 25]");
  process.exit(1);
}

const sqs = new SQSClient({ region });

await sqs.send(new SendMessageCommand({
  QueueUrl: queueUrl,
  MessageBody: "{ invalid-json-for-dlq-test",
}));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await sleep(waitSeconds * 1000);

const response = await sqs.send(new ReceiveMessageCommand({
  QueueUrl: dlqUrl,
  MaxNumberOfMessages: 1,
  WaitTimeSeconds: 2,
}));

const message = response.Messages?.[0];

if (!message) {
  console.error(JSON.stringify({
    success: false,
    message: "DLQ mesajı bulunamadı. WaitTime veya queue URL kontrol edilmeli.",
  }, null, 2));
  process.exit(2);
}

if (message.ReceiptHandle) {
  await sqs.send(new DeleteMessageCommand({
    QueueUrl: dlqUrl,
    ReceiptHandle: message.ReceiptHandle,
  }));
}

console.log(JSON.stringify({
  success: true,
  message: "Hatalı mesaj DLQ üzerinde bulundu ve temizlendi.",
  messageId: message.MessageId,
}, null, 2));
