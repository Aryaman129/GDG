-- Insert a demo user into the profiles table
INSERT INTO profiles (id, email, full_name, role, otp_verified, created_at)
VALUES (
  'demo-user-id',                -- id
  'demo@example.com',            -- email
  'Demo User',                   -- full_name
  'USER',                        -- role
  1,                             -- otp_verified (true)
  datetime('now')                -- created_at
);

-- Create a demo speaker as well
INSERT INTO profiles (id, email, full_name, role, otp_verified, created_at)
VALUES (
  'demo-speaker-id',             -- id
  'demo-speaker@example.com',    -- email
  'Demo Speaker',                -- full_name
  'SPEAKER',                     -- role
  1,                             -- otp_verified (true)
  datetime('now')                -- created_at
);

-- Create a speaker profile for the demo speaker
INSERT INTO speaker_profiles (id, expertise, bio, price_per_hour, created_at)
VALUES (
  'demo-speaker-id',             -- id (references profiles.id)
  'Demo Expertise',              -- expertise
  'This is a demo speaker for testing purposes.',  -- bio
  50.0,                          -- price_per_hour
  datetime('now')                -- created_at
);

-- Create some session slots for the demo speaker
INSERT INTO session_slots (speaker_id, session_date, hour, is_booked, created_at)
VALUES 
  ('demo-speaker-id', date('now', '+1 day'), 10, 0, datetime('now')),
  ('demo-speaker-id', date('now', '+1 day'), 11, 0, datetime('now')),
  ('demo-speaker-id', date('now', '+1 day'), 14, 0, datetime('now')),
  ('demo-speaker-id', date('now', '+2 day'), 9, 0, datetime('now')),
  ('demo-speaker-id', date('now', '+2 day'), 13, 0, datetime('now')),
  ('demo-speaker-id', date('now', '+2 day'), 15, 0, datetime('now'));
