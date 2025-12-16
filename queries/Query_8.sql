CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default", -- The Session ID (matches the cookie)
  "sess" json NOT NULL,                     -- Stores data like {"userId": 1, "role": "admin"}
  "expire" timestamp(6) NOT NULL            -- The exact time this session dies
)
WITH (OIDS=FALSE);

-- Make the Session ID the primary key
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Create an index so checking expiration is super fast
CREATE INDEX "IDX_session_expire" ON "session" ("expire");