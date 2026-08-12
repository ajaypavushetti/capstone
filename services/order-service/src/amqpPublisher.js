const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'cake_delight_events';
const ROUTING_KEY = 'order.completed';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004';

async function publishOrderCompletedEvent(orderData) {
  const eventPayload = {
    eventType: 'ORDER_COMPLETED',
    eventId: `evt_${Date.now()}`,
    timestamp: new Date().toISOString(),
    data: orderData
  };

  let publishedViaAMQP = false;

  try {
    console.log(`🐰 [RabbitMQ AMQP] Attempting connection to broker at ${RABBITMQ_URL}...`);
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(eventPayload)),
      { persistent: true }
    );

    console.log(`✅ [RabbitMQ AMQP] Published ORDER_COMPLETED event to Exchange: '${EXCHANGE_NAME}' (Routing Key: '${ROUTING_KEY}')`);

    setTimeout(async () => {
      await channel.close();
      await connection.close();
    }, 500);

    publishedViaAMQP = true;
  } catch (error) {
    console.log(`⚠️ [RabbitMQ AMQP] Broker connection unreached (${error.message}). Falling back to HTTP Webhook...`);
  }

  // Fallback using native Node.js built-in fetch()
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload)
    });
    console.log(`✅ [Order Service] Event delivered to Notification Service. Status: ${response.status}`);
  } catch (httpError) {
    if (!publishedViaAMQP) {
      console.error(`❌ [Order Service] Failed to deliver notification event: ${httpError.message}`);
    }
  }
}

module.exports = { publishOrderCompletedEvent };
