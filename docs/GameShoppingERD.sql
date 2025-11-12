CREATE TYPE "user_role" AS ENUM (
  'user',
  'admin'
);

CREATE TYPE "order_status" AS ENUM (
  'pending',
  'paid',
  'canceled',
  'refunded',
  'failed'
);

CREATE TYPE "payment_status" AS ENUM (
  'initiated',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'canceled'
);

CREATE TYPE "coupon_discount_type" AS ENUM (
  'percentage',
  'fixed_amount'
);

CREATE TABLE "games" (
  "app_id" int PRIMARY KEY,
  "name" varchar NOT NULL,
  "type" varchar NOT NULL,
  "required_age" smallint NOT NULL DEFAULT 0,
  "release_date" timestamp,
  "recommendations_total" int NOT NULL DEFAULT 0,
  "price_final" decimal(10,2) NOT NULL,
  "price_org" decimal(10,2) NOT NULL,
  "discount_percent" int NOT NULL DEFAULT 0,
  "price_currency" char(3) NOT NULL,
  "platforms_windows" boolean NOT NULL DEFAULT false,
  "platforms_mac" boolean NOT NULL DEFAULT false,
  "platforms_linux" boolean NOT NULL DEFAULT false
);

CREATE TABLE "game_descriptions" (
  "app_id" int PRIMARY KEY,
  "detailed_description" text,
  "supported_languages" text,
  "website" varchar,
  "header_image" text,
  "background" text,
  "categories" text,
  "genres" text
);

CREATE TABLE "game_specs" (
  "app_id" int PRIMARY KEY,
  "pc_min_os" varchar,
  "pc_min_processor" varchar,
  "pc_min_memory" varchar,
  "pc_min_graphics" varchar,
  "pc_min_directx" varchar,
  "pc_min_network" varchar,
  "pc_min_storage" varchar,
  "pc_rec_os" varchar,
  "pc_rec_processor" varchar,
  "pc_rec_memory" varchar,
  "pc_rec_graphics" varchar,
  "pc_rec_directx" varchar,
  "pc_rec_network" varchar,
  "pc_rec_storage" varchar
);

CREATE TABLE "languages" (
  "id" bigserial PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "game_languages" (
  "app_id" int NOT NULL,
  "language_id" bigint NOT NULL,
  PRIMARY KEY(app_id,language_id)
);

CREATE TABLE "developers" (
  "id" bigserial PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "game_developers" (
  "app_id" int NOT NULL,
  "developer_id" bigint NOT NULL,
  PRIMARY KEY(app_id,developer_id)
);

CREATE TABLE "publishers" (
  "id" bigserial PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "game_publishers" (
  "app_id" int NOT NULL,
  "publisher_id" bigint NOT NULL,
  PRIMARY KEY(app_id,publisher_id)
);

CREATE TABLE "genres" (
  "id" bigserial PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "game_genres" (
  "app_id" int NOT NULL,
  "genre_id" bigint NOT NULL,
  PRIMARY KEY(app_id,genre_id)
);

CREATE TABLE "categories" (
  "id" bigserial PRIMARY KEY,
  "name" varchar UNIQUE NOT NULL
);

CREATE TABLE "game_categories" (
  "app_id" int NOT NULL,
  "category_id" bigint NOT NULL,
  PRIMARY KEY(app_id,category_id)
);

CREATE TABLE "users" (
  "id" bigserial PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL,
  "username" varchar UNIQUE NOT NULL,
  "password_hash" varchar NOT NULL,
  "role" user_role NOT NULL DEFAULT 'user',
  "date_of_birth" date,
  "country" varchar
);

CREATE TABLE "user_billing_addresses" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "full_name" varchar,
  "line1" varchar,
  "line2" varchar,
  "city" varchar,
  "state" varchar,
  "postal_code" varchar,
  "country" varchar
);

CREATE TABLE "carts" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint UNIQUE NOT NULL,
  "total_price" decimal(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE "cart_items" (
  "id" bigserial PRIMARY KEY,
  "cart_id" bigint NOT NULL,
  "app_id" int NOT NULL
);

CREATE TABLE "orders" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "total_price" decimal(10,2) NOT NULL DEFAULT 0,
  "discount_code" varchar,
  "discount_order" decimal(10,2) NOT NULL DEFAULT 0,
  "order_status" order_status NOT NULL DEFAULT 'pending',
  "billing_address_id" bigint,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "order_items" (
  "id" bigserial PRIMARY KEY,
  "order_id" bigint NOT NULL,
  "app_id" int NOT NULL,
  "unit_price_paid" decimal(10,2) NOT NULL,
  "discount_percent_applied" int NOT NULL DEFAULT 0
);

CREATE TABLE "payment_methods" (
  "id" bigserial PRIMARY KEY,
  "payment_name" varchar UNIQUE NOT NULL
);

CREATE TABLE "payments" (
  "id" bigserial PRIMARY KEY,
  "order_id" bigint NOT NULL,
  "payment_method_id" bigint NOT NULL,
  "payment_status" payment_status NOT NULL DEFAULT 'initiated',
  "payment_price" decimal(10,2) NOT NULL,
  "payment_created" timestamp DEFAULT (now())
);

CREATE TABLE "reviews" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "app_id" int NOT NULL,
  "review_text" text,
  "is_recommended" boolean NOT NULL
);

CREATE TABLE "user_profiles" (
  "user_id" bigint PRIMARY KEY,
  "prefer_lang_ids" int[],
  "prefer_genre_ids" int[],
  "prefer_cate_ids" int[],
  "prefer_platforms" varchar[]
);

CREATE TABLE "user_game_library" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "app_id" int NOT NULL,
  "order_id" bigint,
  "added_at" timestamp DEFAULT (now())
);

CREATE TABLE "user_wishlist_items" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "app_id" int NOT NULL,
  "added_at" timestamp DEFAULT (now())
);

CREATE TABLE "coupons" (
  "id" bigserial PRIMARY KEY,
  "code" varchar UNIQUE NOT NULL,
  "discount_type" coupon_discount_type NOT NULL, -- This is the corrected line
  "value" decimal(10,2) NOT NULL
);

CREATE TABLE "user_coupon_usage" (
  "id" bigserial PRIMARY KEY,
  "user_id" bigint NOT NULL,
  "coupon_id" bigint NOT NULL,
  "order_id" bigint NOT NULL,
  "used_at" timestamp DEFAULT (now())
);

CREATE INDEX ON "cart_items" ("cart_id");

CREATE UNIQUE INDEX ON "cart_items" ("cart_id", "app_id");

CREATE INDEX ON "payments" ("order_id");

CREATE INDEX ON "reviews" ("app_id");

CREATE UNIQUE INDEX ON "reviews" ("user_id", "app_id");

CREATE UNIQUE INDEX ON "user_game_library" ("user_id", "app_id");

CREATE UNIQUE INDEX ON "user_wishlist_items" ("user_id", "app_id");

CREATE UNIQUE INDEX ON "user_coupon_usage" ("user_id", "coupon_id");

COMMENT ON COLUMN "games"."app_id" IS 'Steam App ID';

COMMENT ON COLUMN "game_descriptions"."supported_languages" IS 'Raw string from dataset';

COMMENT ON COLUMN "game_descriptions"."categories" IS 'Raw string; also normalized via link table';

COMMENT ON COLUMN "game_descriptions"."genres" IS 'Raw string; also normalized via link table';

COMMENT ON COLUMN "carts"."user_id" IS 'One active cart per user (simple mode)';

COMMENT ON COLUMN "cart_items"."app_id" IS 'FK to games.app_id';

COMMENT ON COLUMN "orders"."discount_order" IS 'absolute discount on total';

COMMENT ON COLUMN "order_items"."unit_price_paid" IS 'Price of one item at time of purchase';

COMMENT ON COLUMN "reviews"."is_recommended" IS 'Was the game "Recommended" or "Not Recommended"?';

COMMENT ON COLUMN "user_profiles"."user_id" IS '1:1 with users';

COMMENT ON COLUMN "user_profiles"."prefer_lang_ids" IS 'Array of language IDs from languages table';

COMMENT ON COLUMN "user_profiles"."prefer_genre_ids" IS 'Array of genre IDs from genres table';

COMMENT ON COLUMN "user_profiles"."prefer_cate_ids" IS 'Array of category IDs from categories table';

COMMENT ON COLUMN "user_profiles"."prefer_platforms" IS 'Array of platform codes (windows/mac/linux)';

COMMENT ON COLUMN "user_game_library"."order_id" IS 'Which order did this come from?';

COMMENT ON COLUMN "coupons"."code" IS 'The code user types, e.g., HOLIDAY10';

COMMENT ON COLUMN "coupons"."value" IS 'e.g., 10 for 10% or 10.00 for $10';

COMMENT ON COLUMN "user_coupon_usage"."order_id" IS 'Which order used this coupon';

ALTER TABLE "game_descriptions" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_specs" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_languages" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_languages" ADD FOREIGN KEY ("language_id") REFERENCES "languages" ("id");

ALTER TABLE "game_developers" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_developers" ADD FOREIGN KEY ("developer_id") REFERENCES "developers" ("id");

ALTER TABLE "game_publishers" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_publishers" ADD FOREIGN KEY ("publisher_id") REFERENCES "publishers" ("id");

ALTER TABLE "game_genres" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_genres" ADD FOREIGN KEY ("genre_id") REFERENCES "genres" ("id");

ALTER TABLE "game_categories" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "game_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "user_billing_addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "carts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "carts" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "orders" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("billing_address_id") REFERENCES "user_billing_addresses" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "payments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "payments" ADD FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id");

ALTER TABLE "reviews" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "reviews" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "user_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_game_library" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_game_library" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "user_game_library" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "user_wishlist_items" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_wishlist_items" ADD FOREIGN KEY ("app_id") REFERENCES "games" ("app_id");

ALTER TABLE "user_coupon_usage" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_coupon_usage" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id");

ALTER TABLE "user_coupon_usage" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");
