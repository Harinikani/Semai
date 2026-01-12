-- wildlife_app_user_data.sql
-- SIMPLIFIED VERSION - 3 core users + incoming pending requests only

-- CLEAN UP EXISTING DATA
DELETE FROM reports;
DELETE FROM user_vouchers;
DELETE FROM points_transactions;
DELETE FROM friendships;
DELETE FROM scanned_species;

-- ADD SCANNED SPECIES (simplified)
INSERT INTO scanned_species (id, user_id, species_id, location, verified, image_url) VALUES
('scan1', (SELECT id FROM users WHERE email='alice@test.com'), 'species4', 'Borneo Rainforest, Malaysia', true, '/images/hornbill.jpg'),
('scan2', (SELECT id FROM users WHERE email='alice@test.com'), 'species5', 'Great Barrier Reef, Australia', true, '/images/blue-ringed.jpg'),
('scan3', (SELECT id FROM users WHERE email='alice@test.com'), 'species10', 'Kuala Selangor, Malaysia', true, '/images/pied-hornbill.jpg'),
('scan4', (SELECT id FROM users WHERE email='bob@test.com'), 'species8', 'Sumatra, Indonesia', true, '/images/orangutan.jpg'),
('scan6', (SELECT id FROM users WHERE email='bob@test.com'), 'species18', 'Belum-Temengor Forest', false, '/images/asian-elephant.jpg'),
('scan7', (SELECT id FROM users WHERE email='carol@test.com'), 'species9', 'Sabah, Malaysia', true, '/images/rafflesia.jpg'),
('scan8', (SELECT id FROM users WHERE email='carol@test.com'), 'species20', 'Kinabatangan River, Sabah', true, '/images/proboscis-monkey.jpg'),
('scan9', (SELECT id FROM users WHERE email='carol@test.com'), 'species23', 'Krau Wildlife Reserve', true, '/images/pangolin.jpg');

-- ADD POINTS TRANSACTIONS (varied points)
INSERT INTO points_transactions (id, user_id, transaction_type, points, description) VALUES
-- Alice's transactions (total: 150 + 200 + 120 = 470)
('points1', (SELECT id FROM users WHERE email='alice@test.com'), 'species_scan', 150, 'Scanned Rhinoceros Hornbill'),
('points2', (SELECT id FROM users WHERE email='alice@test.com'), 'species_scan', 200, 'Scanned Blue-Ringed Octopus'),
('points3', (SELECT id FROM users WHERE email='alice@test.com'), 'species_scan', 120, 'Scanned Oriental Pied Hornbill'),

-- Bob's transactions (total: 250 + 400 + 180 = 830)
('points4', (SELECT id FROM users WHERE email='bob@test.com'), 'species_scan', 250, 'Scanned Orangutan'),
('points5', (SELECT id FROM users WHERE email='bob@test.com'), 'species_scan', 400, 'Scanned Malayan Tiger'),
('points6', (SELECT id FROM users WHERE email='bob@test.com'), 'species_scan', 180, 'Scanned Asian Elephant'),

-- Carol's transactions (total: 300 + 280 + 350 = 930)
('points7', (SELECT id FROM users WHERE email='carol@test.com'), 'species_scan', 300, 'Scanned Rafflesia flower'),
('points8', (SELECT id FROM users WHERE email='carol@test.com'), 'species_scan', 280, 'Scanned Proboscis Monkey'),
('points9', (SELECT id FROM users WHERE email='carol@test.com'), 'species_scan', 350, 'Scanned Pangolin');

-- ADD USER VOUCHERS (different vouchers for each user)
INSERT INTO user_vouchers (id, user_id, voucher_id, redemption_code, expires_at) VALUES
-- Alice's vouchers (can afford voucher-1 and voucher-3)
('uservouch1', (SELECT id FROM users WHERE email='alice@test.com'), 'voucher-1', 'COFFEE-ALICE-2024', '2026-12-31'),
('uservouch2', (SELECT id FROM users WHERE email='alice@test.com'), 'voucher-3', 'BAG-ALICE-2024', '2026-08-31'),

-- Bob's vouchers (can afford voucher-2 and voucher-3)
('uservouch3', (SELECT id FROM users WHERE email='bob@test.com'), 'voucher-2', 'ADOPT-BOB-2024', '2026-09-30'),
('uservouch4', (SELECT id FROM users WHERE email='bob@test.com'), 'voucher-3', 'BAG-BOB-2024', '2026-08-31'),

-- Carol's vouchers (can afford all except voucher-4)
('uservouch5', (SELECT id FROM users WHERE email='carol@test.com'), 'voucher-1', 'COFFEE-CAROL-2024', '2026-12-31'),
('uservouch6', (SELECT id FROM users WHERE email='carol@test.com'), 'voucher-5', 'BIRD-CAROL-2024', '2026-10-31');

-- UPDATE USER POINTS (varied and realistic)
UPDATE users SET points = 470 WHERE email = 'alice@test.com';  -- Can redeem voucher-1 (200) and voucher-3 (300)
UPDATE users SET points = 830 WHERE email = 'bob@test.com';    -- Can redeem voucher-2 (500) and voucher-3 (300)
UPDATE users SET points = 930 WHERE email = 'carol@test.com';  -- Can redeem all except voucher-4 (800)

-- Reset other users to low points for pending requests
UPDATE users SET points = 475 WHERE email NOT IN ('alice@test.com', 'bob@test.com', 'carol@test.com');

-- ADD FRIENDSHIPS (Triangle + incoming pending requests only)
INSERT INTO friendships (id, user_id, friend_id, status, accepted_at) VALUES
-- ACCEPTED FRIENDSHIPS (Triangle - everyone friends with everyone)
('friend1', (SELECT id FROM users WHERE email='alice@test.com'), (SELECT id FROM users WHERE email='bob@test.com'), 'accepted', NOW()),
('friend2', (SELECT id FROM users WHERE email='alice@test.com'), (SELECT id FROM users WHERE email='carol@test.com'), 'accepted', NOW()),
('friend3', (SELECT id FROM users WHERE email='bob@test.com'), (SELECT id FROM users WHERE email='carol@test.com'), 'accepted', NOW()),

-- PENDING REQUESTS TO ALICE (1 incoming request)
('friend4', (SELECT id FROM users WHERE email='david@test.com'), (SELECT id FROM users WHERE email='alice@test.com'), 'pending', NULL),

-- PENDING REQUESTS TO BOB (1 incoming request) 
('friend5', (SELECT id FROM users WHERE email='david@test.com'), (SELECT id FROM users WHERE email='bob@test.com'), 'pending', NULL),

-- PENDING REQUESTS TO CAROL (1 incoming request)
('friend6', (SELECT id FROM users WHERE email='david@test.com'), (SELECT id FROM users WHERE email='carol@test.com'), 'pending', NULL);

-- ADD REPORTS (one per user)
INSERT INTO reports (id, user_id, scanned_species_id, species, location, endangered_status, status, remarks) VALUES
('report1', (SELECT id FROM users WHERE email='alice@test.com'), 'scan1', 'Rhinoceros Hornbill', 'Borneo Rainforest', 'Vulnerable', 'approved', 'Observed nesting behavior in natural tree cavity'),
('report2', (SELECT id FROM users WHERE email='bob@test.com'), 'scan4', 'Orangutan', 'Sumatra Rainforest', 'Critically Endangered', 'pending', 'Young orangutan using stick tool to extract honey'),
('report3', (SELECT id FROM users WHERE email='carol@test.com'), 'scan7', 'Rafflesia', 'Sabah, Malaysia', 'Endangered', 'under_review', 'Found blooming specimen measuring 85cm diameter');

-- wildlife_app_user_data.sql - ADD THESE LINES

-- ENSURE BOTH POINTS AND CURRENCY COLUMNS ARE PROPERLY SET
-- Points = Permanent achievement points (for leaderboard)
-- Currency = Spendable coins (for rewards)

-- Update the main 3 users with separate points and currency
UPDATE users SET 
    points = 470,  -- Achievement points (permanent)
    currency = 470  -- Spendable coins
WHERE email = 'alice@test.com';

UPDATE users SET 
    points = 830,   -- Achievement points  
    currency = 830  -- Spendable coins
WHERE email = 'bob@test.com';

UPDATE users SET 
    points = 930,   -- Achievement points
    currency = 930   -- Spendable coins
WHERE email = 'carol@test.com';

-- Update other users with realistic separated values
UPDATE users SET 
    currency = points
WHERE email NOT IN ('alice@test.com', 'bob@test.com', 'carol@test.com');

-- Verify the data
SELECT email, first_name, points, currency FROM users ORDER BY points DESC;


SELECT '✅ Enhanced user data loaded! 3 main users + incoming pending requests only' as status;