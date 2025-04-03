# Swagger API Documentation

## Overview

The MercyFull Messenger API includes comprehensive Swagger documentation that allows you to:

- Explore available API endpoints
- Test API functionality directly from your browser
- View request/response models for each endpoint
- Understand authentication requirements

## Accessing Swagger UI

When the server is running, you can access the Swagger UI at:

```
http://localhost:3000/api
```

## Available Endpoints

The API is organized into the following categories:

### Chat Endpoints

- `GET /chat/rooms` - Get all chat rooms for the authenticated user
- `GET /chat/rooms/{id}` - Get a specific chat room by ID
- `POST /chat/rooms` - Create a new chat room
- `GET /chat/rooms/{id}/messages` - Get messages for a specific chat room
- `POST /chat/rooms/{id}/messages` - Send a message to a chat room
- `PATCH /chat/rooms/{id}/read` - Mark all messages in a chat room as read

### Authentication

All API endpoints (except auth endpoints) require authentication. To use them in Swagger UI:

1. Authenticate using the `/auth/login` endpoint
2. Copy the returned JWT token
3. Click the "Authorize" button at the top of the Swagger UI
4. Enter your token in the format: `Bearer your_token_here`
5. Click "Authorize"

## Using Models

Each endpoint shows the expected request and response models:

- `CreateChatRoomDto` - Used when creating a new chat room
- `CreateMessageDto` - Used when sending a new message
- `ChatRoomDto` - The response model for chat room data
- `MessageDto` - The response model for message data

## Testing with Swagger

1. Navigate to the endpoint you want to test
2. Click "Try it out"
3. Fill in any required parameters or request body
4. Click "Execute"
5. View the server response below

## API JSON Schema

The raw OpenAPI specification is available at:

```
http://localhost:3000/api-json
```

This can be imported into tools like Postman or used to generate client code. 