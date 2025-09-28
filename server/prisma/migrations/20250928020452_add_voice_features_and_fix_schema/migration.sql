-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Channel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'WEBSITE', 'VOICE_CALL', 'SMS');

-- CreateEnum
CREATE TYPE "public"."ConvStatus" AS ENUM ('OPEN', 'HUMAN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."Sender" AS ENUM ('CUSTOMER', 'AI', 'HUMAN');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "public"."CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('RINGING', 'ANSWERED', 'BUSY', 'NO_ANSWER', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "channel" "public"."Channel" NOT NULL DEFAULT 'WEBSITE',
    "status" "public"."ConvStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "callDuration" INTEGER,
    "recordingUrl" TEXT,
    "transcriptionUrl" TEXT,
    "userId" TEXT,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" "public"."Sender" NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "transcription" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "businessName" TEXT,
    "contactEmail" TEXT,
    "phoneNumber" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "queriesUsed" INTEGER NOT NULL DEFAULT 0,
    "nextBilling" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "direction" "public"."CallDirection" NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "status" "public"."CallStatus" NOT NULL,
    "recordingUrl" TEXT,
    "transcriptionUrl" TEXT,
    "aiResponseCount" INTEGER NOT NULL DEFAULT 0,
    "escalatedToHuman" BOOLEAN NOT NULL DEFAULT false,
    "customerSatisfaction" INTEGER,
    "cost" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoiceAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "averageDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiResolutionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customerSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "VoiceAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "public"."Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_status_idx" ON "public"."Conversation"("status");

-- CreateIndex
CREATE INDEX "Conversation_channel_idx" ON "public"."Conversation"("channel");

-- CreateIndex
CREATE INDEX "Conversation_customerPhone_idx" ON "public"."Conversation"("customerPhone");

-- CreateIndex
CREATE INDEX "Conversation_createdAt_idx" ON "public"."Conversation"("createdAt");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "public"."Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "public"."Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "public"."Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_messageType_idx" ON "public"."Message"("messageType");

-- CreateIndex
CREATE INDEX "Message_sender_idx" ON "public"."Message"("sender");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "public"."Message"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_userId_key" ON "public"."Setting"("userId");

-- CreateIndex
CREATE INDEX "Setting_userId_idx" ON "public"."Setting"("userId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "public"."Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "public"."Integration"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CallLog_callId_key" ON "public"."CallLog"("callId");

-- CreateIndex
CREATE INDEX "CallLog_conversationId_idx" ON "public"."CallLog"("conversationId");

-- CreateIndex
CREATE INDEX "CallLog_phoneNumber_idx" ON "public"."CallLog"("phoneNumber");

-- CreateIndex
CREATE INDEX "CallLog_startTime_idx" ON "public"."CallLog"("startTime");

-- CreateIndex
CREATE INDEX "CallLog_status_idx" ON "public"."CallLog"("status");

-- CreateIndex
CREATE INDEX "CallLog_direction_idx" ON "public"."CallLog"("direction");

-- CreateIndex
CREATE INDEX "CallLog_callId_idx" ON "public"."CallLog"("callId");

-- CreateIndex
CREATE INDEX "VoiceAnalytics_userId_idx" ON "public"."VoiceAnalytics"("userId");

-- CreateIndex
CREATE INDEX "VoiceAnalytics_date_idx" ON "public"."VoiceAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceAnalytics_userId_date_key" ON "public"."VoiceAnalytics"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallLog" ADD CONSTRAINT "CallLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoiceAnalytics" ADD CONSTRAINT "VoiceAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
