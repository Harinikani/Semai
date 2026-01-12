-- wildlife_app_database.sql
-- PostgreSQL database setup for Wildlife Conservation App

-- CLEAR existing data (in correct order to handle foreign key constraints)
DELETE FROM user_vouchers;
DELETE FROM vouchers;
DELETE FROM points_transactions;
DELETE FROM reports;
DELETE FROM scanned_species;
DELETE FROM species;
DELETE FROM animal_class;
DELETE FROM friendships;
DELETE FROM users;

-- ADD ANIMAL CLASSES
INSERT INTO animal_class (id, class_name) VALUES
('class1', 'Mammals'),
('class2', 'Birds'),
('class3', 'Reptiles'),
('class4', 'Amphibians'),
('class5', 'Fish'),
('class6', 'Invertebrates'),
('class7', 'Plants'),
('class8', 'Mollusks');

-- ADD VOUCHERS
INSERT INTO public.vouchers(
    id, title, description, points_required, expiry_date, merchant_name, is_active, created_at)
VALUES 
    ('voucher-1', 'Free Conservation Coffee', 'Enjoy a free organic coffee while supporting sustainable farming', 200, '2026-06-30', 'Eco Coffee Co.', true, NOW()),
    ('voucher-2', 'Wildlife Adoption Kit', 'Adopt a symbolic animal and receive an adoption certificate', 500, '2026-08-31', 'WWF Conservation', true, NOW()),
    ('voucher-3', 'Eco-Friendly Tote Bag', 'Durable reusable tote bag made from recycled materials', 300, '2026-10-31', 'Green Living Store', true, NOW()),
    ('voucher-4', 'Zoo Family Pass', 'One-day family pass for 4 people to visit the zoo', 800, '2026-12-31', 'National Wildlife Zoo', true, NOW()),
    ('voucher-5', 'Bird Watching Kit', 'Binoculars and bird identification guide for beginners', 450, '2026-09-15', 'Nature Explorers', true, NOW());

-- Note: User-related inserts (scanned_species, reports, points_transactions, user_vouchers, friendships)
-- should be executed AFTER users are created through your application API

SELECT '✅ Enhanced database ready! Now register users through API' as status;