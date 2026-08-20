import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
@Controller() class HealthController { @Get("/health") health() { return { status: "ok", service: "api", version: "0.1.0" }; } }
@Module({ controllers: [HealthController] }) class AppModule {}
async function bootstrap() { const app = await NestFactory.create(AppModule); app.enableCors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }); await app.listen(Number(process.env.API_PORT ?? 4000)); }
void bootstrap();
