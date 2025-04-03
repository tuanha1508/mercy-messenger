import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { networkInterfaces } from 'os';

// Helper function to get local IPv4 address
function getLocalIpv4Address(): string | null {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (interfaces) {
      for (const net of interfaces) {
        // Skip over non-IPv4 and internal (loopback) addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return null;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle('MercyFull Messenger API')
    .setDescription('API documentation for the MercyFull Messenger app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const host = '0.0.0.0';  // Listen on all network interfaces
  const port = process.env.PORT ?? 3000;
  
  await app.listen(port, host);
  
  const ipv4Address = getLocalIpv4Address();
  
  console.log(`✅ Application is running on: http://localhost:${port}`);
  if (ipv4Address) {
    console.log(`✅ Server accessible via network at: http://${ipv4Address}:${port}`);
  }
  console.log(`🔥 Swagger API documentation available at: http://localhost:${port}/api`);
  console.log(`📄 OpenAPI specification available at: http://localhost:${port}/api-json`);
}
bootstrap();
