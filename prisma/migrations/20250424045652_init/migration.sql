-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'BUSINESS_OWNER', 'DRIVER', 'CUSTOMER_SUPPORT');

-- CreateEnum
CREATE TYPE "ThemeType" AS ENUM ('LIGHT', 'DARK', 'SEPIA', 'HIGH_CONTRAST', 'RIDER', 'DRIVER', 'OWNER', 'SOLARIZED', 'NEON', 'PASTEL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'WALLET');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "Data" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedIP" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "blockedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BlockedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhitelistedIP" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "whitelistedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitelistedIP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipHistory" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,

    CONSTRAINT "ipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "ipAddress" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IPNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IPNoteAttachment" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IPNoteAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colors" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "shareCode" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colors" JSONB NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeRating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "themeId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThemeRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" UUID NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "refundedAmount" DOUBLE PRECISION DEFAULT 0,
    "invoiceUrl" TEXT,
    "paypalOrderId" TEXT,
    "paypalPayerId" TEXT,
    "paypalCaptureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "storeId" TEXT,
    "driverId" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "items" JSONB NOT NULL,
    "deliveryAddress" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "successfulTransactions" INTEGER NOT NULL,
    "failedTransactions" INTEGER NOT NULL,
    "refundedTransactions" INTEGER NOT NULL,
    "averageAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "storeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMetrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "successfulTransactions" INTEGER NOT NULL,
    "failedTransactions" INTEGER NOT NULL,
    "refundedTransactions" INTEGER NOT NULL,
    "averageAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "storeId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DownloadLog" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "downloadSpeed" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Data_email_key" ON "Data"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIP_ip_key" ON "BlockedIP"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "WhitelistedIP_ip_key" ON "WhitelistedIP"("ip");

-- CreateIndex
CREATE INDEX "IPNote_ipAddress_idx" ON "IPNote"("ipAddress");

-- CreateIndex
CREATE INDEX "IPNote_userId_idx" ON "IPNote"("userId");

-- CreateIndex
CREATE INDEX "IPNoteAttachment_noteId_idx" ON "IPNoteAttachment"("noteId");

-- CreateIndex
CREATE INDEX "CustomTheme_userId_idx" ON "CustomTheme"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedTheme_shareCode_key" ON "SharedTheme"("shareCode");

-- CreateIndex
CREATE INDEX "SharedTheme_userId_idx" ON "SharedTheme"("userId");

-- CreateIndex
CREATE INDEX "SharedTheme_shareCode_idx" ON "SharedTheme"("shareCode");

-- CreateIndex
CREATE INDEX "Theme_userId_idx" ON "Theme"("userId");

-- CreateIndex
CREATE INDEX "Theme_category_idx" ON "Theme"("category");

-- CreateIndex
CREATE INDEX "ThemeRating_themeId_idx" ON "ThemeRating"("themeId");

-- CreateIndex
CREATE INDEX "ThemeRating_userId_idx" ON "ThemeRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThemeRating_themeId_userId_key" ON "ThemeRating"("themeId", "userId");

-- CreateIndex
CREATE INDEX "ThemeComment_themeId_idx" ON "ThemeComment"("themeId");

-- CreateIndex
CREATE INDEX "ThemeComment_userId_idx" ON "ThemeComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_key" ON "Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_invitedBy_idx" ON "Invitation"("invitedBy");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_paypalOrderId_idx" ON "Transaction"("paypalOrderId");

-- CreateIndex
CREATE INDEX "Transaction_paymentMethod_paymentProvider_idx" ON "Transaction"("paymentMethod", "paymentProvider");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_status_idx" ON "Transaction"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_storeId_idx" ON "Order"("storeId");

-- CreateIndex
CREATE INDEX "Order_driverId_idx" ON "Order"("driverId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");

-- CreateIndex
CREATE INDEX "PaymentAnalytics_date_idx" ON "PaymentAnalytics"("date");

-- CreateIndex
CREATE INDEX "PaymentAnalytics_storeId_idx" ON "PaymentAnalytics"("storeId");

-- CreateIndex
CREATE INDEX "PaymentAnalytics_paymentMethod_idx" ON "PaymentAnalytics"("paymentMethod");

-- CreateIndex
CREATE INDEX "PaymentAnalytics_paymentProvider_idx" ON "PaymentAnalytics"("paymentProvider");

-- CreateIndex
CREATE INDEX "PaymentMetrics_date_idx" ON "PaymentMetrics"("date");

-- CreateIndex
CREATE INDEX "PaymentMetrics_storeId_idx" ON "PaymentMetrics"("storeId");

-- CreateIndex
CREATE INDEX "PaymentMetrics_paymentMethod_idx" ON "PaymentMetrics"("paymentMethod");

-- CreateIndex
CREATE INDEX "PaymentMetrics_paymentProvider_idx" ON "PaymentMetrics"("paymentProvider");

-- CreateIndex
CREATE INDEX "Store_userId_idx" ON "Store"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "DownloadLog_userId_idx" ON "DownloadLog"("userId");

-- CreateIndex
CREATE INDEX "DownloadLog_createdAt_idx" ON "DownloadLog"("createdAt");

-- AddForeignKey
ALTER TABLE "BlockedIP" ADD CONSTRAINT "BlockedIP_blockedBy_fkey" FOREIGN KEY ("blockedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhitelistedIP" ADD CONSTRAINT "WhitelistedIP_whitelistedBy_fkey" FOREIGN KEY ("whitelistedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipHistory" ADD CONSTRAINT "ipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPNote" ADD CONSTRAINT "IPNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IPNoteAttachment" ADD CONSTRAINT "IPNoteAttachment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "IPNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTheme" ADD CONSTRAINT "CustomTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTheme" ADD CONSTRAINT "SharedTheme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeRating" ADD CONSTRAINT "ThemeRating_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeRating" ADD CONSTRAINT "ThemeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeComment" ADD CONSTRAINT "ThemeComment_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThemeComment" ADD CONSTRAINT "ThemeComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAnalytics" ADD CONSTRAINT "PaymentAnalytics_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMetrics" ADD CONSTRAINT "PaymentMetrics_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DownloadLog" ADD CONSTRAINT "DownloadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
