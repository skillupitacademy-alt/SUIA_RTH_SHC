CREATE TYPE "public"."gateway_webhook_status" AS ENUM('received', 'processed', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_installment_status" AS ENUM('paid', 'due', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."payment_plan_status" AS ENUM('active', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "public"."payment_plan_type" AS ENUM('full', 'installment', 'scholarship', 'custom');--> statement-breakpoint
CREATE TYPE "public"."payment_transaction_gateway" AS ENUM('razorpay', 'stripe', 'manual', 'cashfree');--> statement-breakpoint
CREATE TYPE "public"."payment_transaction_status" AS ENUM('created', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "gateway_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_ref" text NOT NULL,
	"gateway" "payment_transaction_gateway" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "gateway_webhook_status" DEFAULT 'received' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "payment_plan_status" DEFAULT 'active' NOT NULL,
	"plan_type" "payment_plan_type" DEFAULT 'installment' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_installment_status" DEFAULT 'due' NOT NULL,
	"payment_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"installment_id" uuid NOT NULL,
	"payment_ref" text NOT NULL,
	"gateway" "payment_transaction_gateway" DEFAULT 'razorpay' NOT NULL,
	"status" "payment_transaction_status" DEFAULT 'created' NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_plan_id_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_installment_id_payment_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."payment_installments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gateway_webhook_logs_payment_ref" ON "gateway_webhook_logs" USING btree ("payment_ref");--> statement-breakpoint
CREATE INDEX "idx_gateway_webhook_logs_status_created_at" ON "gateway_webhook_logs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_plans_user" ON "payment_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_payment_plans_status" ON "payment_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payment_installments_plan_due" ON "payment_installments" USING btree ("plan_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_payment_installments_overdue" ON "payment_installments" USING btree ("status","due_date") WHERE "payment_installments"."status" = 'overdue';--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_payment_installments_plan_number" ON "payment_installments" USING btree ("plan_id","installment_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_payment_transactions_payment_ref" ON "payment_transactions" USING btree ("payment_ref");--> statement-breakpoint
CREATE INDEX "idx_payment_transactions_gateway" ON "payment_transactions" USING btree ("gateway","created_at");