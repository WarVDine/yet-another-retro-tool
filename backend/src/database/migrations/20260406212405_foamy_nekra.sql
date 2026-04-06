CREATE TYPE "public"."participant_role" AS ENUM('facilitator', 'participant');--> statement-breakpoint
CREATE TYPE "public"."retro_phase" AS ENUM('setup', 'writing', 'grouping', 'voting', 'discussing');--> statement-breakpoint
CREATE TABLE "card_group_memberships" (
	"card_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_group_memberships_card_id_group_id_pk" PRIMARY KEY("card_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "card_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"title" varchar(255),
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid,
	"group_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_participants" (
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" DEFAULT 'participant' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_participants_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"facilitator_code" varchar(50) NOT NULL,
	"participant_code" varchar(50) NOT NULL,
	"current_phase" "retro_phase" DEFAULT 'setup' NOT NULL,
	"max_votes_per_user" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_facilitator_code_unique" UNIQUE("facilitator_code"),
	CONSTRAINT "rooms_participant_code_unique" UNIQUE("participant_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_guest_id_unique" UNIQUE("guest_id")
);
--> statement-breakpoint
ALTER TABLE "card_group_memberships" ADD CONSTRAINT "card_group_memberships_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_group_memberships" ADD CONSTRAINT "card_group_memberships_group_id_card_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."card_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_groups" ADD CONSTRAINT "card_groups_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_group_id_card_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."card_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_group_memberships_card_id_idx" ON "card_group_memberships" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "card_group_memberships_group_id_idx" ON "card_group_memberships" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "card_groups_column_id_idx" ON "card_groups" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "card_groups_sort_order_idx" ON "card_groups" USING btree ("column_id","sort_order");--> statement-breakpoint
CREATE INDEX "cards_column_id_idx" ON "cards" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "cards_author_id_idx" ON "cards" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "cards_sort_order_idx" ON "cards" USING btree ("column_id","sort_order");--> statement-breakpoint
CREATE INDEX "columns_room_id_idx" ON "columns" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "columns_sort_order_idx" ON "columns" USING btree ("room_id","sort_order");--> statement-breakpoint
CREATE INDEX "likes_user_id_idx" ON "likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "likes_card_id_idx" ON "likes" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "likes_group_id_idx" ON "likes" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "likes_user_card_idx" ON "likes" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE INDEX "likes_user_group_idx" ON "likes" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE INDEX "room_participants_room_id_idx" ON "room_participants" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_participants_user_id_idx" ON "room_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rooms_facilitator_code_idx" ON "rooms" USING btree ("facilitator_code");--> statement-breakpoint
CREATE INDEX "rooms_participant_code_idx" ON "rooms" USING btree ("participant_code");--> statement-breakpoint
CREATE INDEX "rooms_active_idx" ON "rooms" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_guest_id_idx" ON "users" USING btree ("guest_id");