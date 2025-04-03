# Mercy Messenger

A real-time messaging application for communication between volunteers, staff, and adopters at Mercy Full Project.

![Mercy Full Project Banner]([https://mercyfullprojects.org/about/)](https://mercyfullprojects.org/about/))

## Overview

Mercy Messenger provides a seamless communication platform for everyone involved with Mercy Full Project. The app follows the organization's brand theme emphasizing Empathy (blue), Kindness (teal), and Love (pink).

## Features

- **Real-time Messaging**: Instant message delivery and updates using Socket.io
- **Online Status**: See when users are online or typing
- **Direct & Group Conversations**: Chat one-on-one or create group discussions
- **Message Status**: Track when messages are delivered and read
- **User Authentication**: Secure login with JWT and Passport
- **Profile Management**: Update personal information and preferences
- **File Sharing**: Support for image and document uploads
- **Modern UI**: Beautiful interface with NativeWind styling

## Project Structure

```
mercy-messenger/
├── backend/                 # NestJS backend server
│   ├── src/                # Source code
│   ├── test/              # Test files
│   ├── uploads/           # File upload storage
│   └── dist/              # Compiled output
├── mobile/                 # React Native Expo app
│   ├── src/               # Source code
│   ├── assets/            # Images and static files
│   └── app/               # Expo Router pages
└── docs/                  # Documentation files
```

## Tech Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with Passport
- **Real-time**: Socket.io for WebSocket communication
- **API Documentation**: Swagger/OpenAPI
- **File Upload**: Multer for handling multipart/form-data
- **Testing**: Jest and Supertest

### Mobile App (React Native)
- **Framework**: React Native with Expo SDK
- **Navigation**: Expo Router for file-based routing
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand for global state
- **Form Validation**: Zod schema validation
- **Real-time**: Socket.io client
- **Chat UI**: React Native Gifted Chat
- **Storage**: AsyncStorage for local data

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio

### Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mercy-messenger.git
   cd mercy-messenger
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/mercy-messenger
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

3. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000` with Swagger docs at `/api-docs`.

### Mobile App Setup
1. Navigate to mobile directory:
   ```bash
   cd mobile
   npm install
   ```

2. Create a `.env` file with your configuration:
   ```
   API_URL=http://localhost:3000
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Use the Expo Go app on your device or press:
   - `i` for iOS simulator
   - `a` for Android emulator

## Development

### Backend Development
- Run tests: `npm test`
- Generate Swagger docs: `npm run swagger`
- Build for production: `npm run build`

### Mobile Development
- Run linter: `npm run lint`
- Run TypeScript check: `npm run typescript`
- Build for production: `eas build`

## Testing

The project includes comprehensive test suites:

### Backend Tests
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Test coverage: `npm run test:cov`

### Mobile Tests
- Unit tests: `npm test`
- E2E tests: `npm run e2e`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Mercy Full Project](https://mercyfullprojects.org/) for their incredible work helping animals in need
- All the volunteers, staff, and adopters who make a difference every day
- The open-source community for the amazing tools and libraries used in this project

## Future Enhancements

- Voice and video calling capabilities
- File/image sharing
- Push notifications
- Announcement broadcasts
- Event coordination features
- Integration with Mercy Full Project's adoption system 
