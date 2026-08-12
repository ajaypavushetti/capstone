# Cake Delight - Cloud Native Microservices Capstone

Accenture Stream Training Capstone Project implementation for Cake Delight online bakery. Built using Node.js, Express Gateway, CloudAMQP RabbitMQ, MongoDB Atlas, Docker Compose, Kubernetes, and a Vanilla HTML/CSS/JS frontend.

---

## Architecture Overview

The system is designed as a set of loose-coupled microservices running behind Express Gateway with asynchronous AMQP messaging.

- **Frontend Client (Port 3000)**: Vanilla HTML5, CSS3, and JavaScript Single Page Application.
- **API Gateway (Port 4000)**: Express Gateway instance handling path routing to backend services.
- **Catalog Service (Port 4001)**: Manages cake products, categories, search, and price range filtering.
- **Order Service (Port 4002)**: Handles cart basket items (`+`/`-`), checkout execution, order totals, and publishes `ORDER_COMPLETED` events over CloudAMQP RabbitMQ.
- **Rating Service (Port 4003)**: Handles star ratings, user comments, and average rating aggregations.
- **Notification Service (Port 4004)**: Consumes `ORDER_COMPLETED` events via CloudAMQP AMQP consumer, creates in-app notifications, logs email/SMS delivery, and handles read status.
- **Message Broker**: CloudAMQP RabbitMQ (`amqps://`) with AMQP topic exchange `cake_delight_events` and routing key `order.completed`.
- **Database**: MongoDB Atlas cloud database (`cake_delight` DB).

```
[Frontend Client - 3000]
           │
           ▼
[API Gateway (Express Gateway) - 4000]
           │
 ┌─────────┼───────────────┬────────────────┐
 │         │               │                │
 ▼         ▼               ▼                ▼
[Catalog] [Order]      [Rating]       [Notification]
 (4001)    (4002)       (4003)           (4004)
              │                            ▲
              └── [CloudAMQP RabbitMQ] ────┘
                  Exchange: cake_delight_events
                  Routing Key: order.completed
                  Queue: notification_order_completed_queue
```

---

## Microservices & Port Allocation

| Service Name | Port | Directory | Description |
|---|---|---|---|
| Frontend Web App | 3000 | `services/frontend` | Web UI for browsing cakes, cart drawer, rating modal, and notifications |
| API Gateway | 4000 | `services/api-gateway` | Express Gateway routing requests to backend microservices |
| Catalog Service | 4001 | `services/catalog-service` | Product catalog, details, categories, and price filtering |
| Order Service | 4002 | `services/order-service` | Shopping basket, checkout processing, and CloudAMQP event publisher |
| Rating Service | 4003 | `services/rating-service` | Cake product reviews and average rating score aggregations |
| Notification Service | 4004 | `services/notification-service` | CloudAMQP AMQP event consumer and notification tracking |

---

## API Endpoints Reference

### 1. Catalog Microservice (Port 4001)
- `GET /` - Microservice info and status metadata
- `GET /api/cakes` - Get all cakes (Supports query parameters: `category`, `search`, `minPrice`, `maxPrice`)
- `GET /api/cakes/categories` - Get list of categories
- `GET /api/cakes/:id` - Get details of a single cake by ID
- `POST /api/cakes` - Add a new cake product
- `GET /health` - Service health status

### 2. Order Microservice (Port 4002)
- `GET /` - Microservice info and status metadata
- `GET /api/orders/basket/:userId` - Get shopping basket for user
- `POST /api/orders/basket/:userId` - Add item or change item quantity (+1 / -1)
- `PUT /api/orders/basket/:userId/item` - Set exact item quantity
- `DELETE /api/orders/basket/:userId/item/:cakeId` - Remove single item from basket
- `DELETE /api/orders/basket/:userId` - Clear basket
- `POST /api/orders/checkout` - Checkout basket and publish CloudAMQP AMQP `ORDER_COMPLETED` event
- `GET /api/orders/user/:userId` - Get order history for user
- `GET /api/orders/:id` - Get order details by ID
- `GET /api/orders` - Get all orders
- `GET /health` - Service health status

### 3. Rating Microservice (Port 4003)
- `GET /` - Microservice info and status metadata
- `POST /api/ratings` - Submit a new cake rating/review
- `GET /api/ratings` - List all submitted ratings across all cakes
- `GET /api/ratings/cake/:cakeId` - Get ratings for a specific cake
- `GET /api/ratings/cake/:cakeId/summary` - Get average score and review count for a cake
- `GET /api/ratings/summaries` - Get bulk calculated ratings map for all cakes
- `GET /health` - Service health status

### 4. Notification Microservice (Port 4004)
- `GET /` - Microservice info and status metadata
- `POST /api/notifications/event` - Webhook ingestion fallback endpoint
- `GET /api/notifications` - Get all notifications across all users
- `GET /api/notifications/user/:userId` - Get notifications for specific user
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/user/:userId/read-all` - Mark all notifications as read for user
- `GET /health` - Service health status

### 5. API Gateway Routes (Port 4000)
- Proxy `/` -> `http://localhost:3000` (Frontend App)
- Proxy `/api/cakes*` -> `http://localhost:4001`
- Proxy `/api/orders*` -> `http://localhost:4002`
- Proxy `/api/ratings*` -> `http://localhost:4003`
- Proxy `/api/notifications*` -> `http://localhost:4004`
- `GET /health` -> Gateway health status check

---

## 🐳 How Evaluators Can Run via Docker Compose

Evaluators can build and run all 6 containerized microservices with a single command:

```bash
docker compose up --build
```
*(or `docker-compose up --build`)*

All container environment variables (`MONGO_URI`, `RABBITMQ_URL`) are pre-configured with active cloud credentials in `docker-compose.yml`, so containers start up and connect to MongoDB Atlas and CloudAMQP out-of-the-box.

---

## ☸️ How Evaluators Can Deploy to Kubernetes

Deploy all 6 microservices to a Kubernetes cluster (Minikube / Docker Desktop K8s / AKS / EKS):

1. **Apply Manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

2. **Verify Pods and Services**:
   ```bash
   kubectl get pods
   kubectl get services
   ```

3. **Access Services**:
   - **Frontend App**: `http://localhost:30300` (NodePort)
   - **API Gateway**: `http://localhost:30400` (NodePort)

---

## How to Run Locally (Without Docker)

### 1. Install Dependencies
Run the install command from root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Ensure `.env` contains your CloudAMQP and MongoDB Atlas URIs:
```env
MONGO_URI=mongodb+srv://...
RABBITMQ_URL=amqps://...
```

### 3. Start Services
Run each service in separate terminals:

```bash
# Terminal 1 - Catalog Service
npm run start:catalog

# Terminal 2 - Order Service
npm run start:order

# Terminal 3 - Rating Service
npm run start:rating

# Terminal 4 - Notification Service
npm run start:notification

# Terminal 5 - Express Gateway
npm run start:gateway

# Terminal 6 - Frontend Web App
npm run start:frontend
```

### 4. Open in Browser
- Frontend Client UI: `http://localhost:3000`
- Express Gateway Root: `http://localhost:4000`
- Catalog Service Root Info: `http://localhost:4001`
- Order Service Root Info: `http://localhost:4002`
- Rating Service Root Info: `http://localhost:4003`
- Notification Service Root Info: `http://localhost:4004`
