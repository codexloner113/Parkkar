-- ============================================================================
-- PARKKAR — PHASE 1 SEED / DEMO DATA
-- Run this AFTER schema/schema.sql. All names, emails, and plate numbers
-- below are fictional demo data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS
-- password_hash values are fictional placeholders (NOT real bcrypt output).
-- Phase 2 will generate real bcrypt hashes when signup is implemented.
-- commission_rate_percent is stored per PARTNER user.
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, phone, password_hash, role, account_status, commission_rate_percent) VALUES
  (1, 'Parkkar Admin',        'admin@parkkar.com',        '9000000001', '$2b$10$demoHashPlaceholder0000000000000000000000001', 'ADMIN',   'ACTIVE', NULL),
  (2, 'Ravi Malhotra',        'ravi.malhotra@tajstay.com','9000000002', '$2b$10$demoHashPlaceholder0000000000000000000000002', 'PARTNER', 'ACTIVE', 15.00),
  (3, 'Neha Kapoor',          'neha.kapoor@citymall.com', '9000000003', '$2b$10$demoHashPlaceholder0000000000000000000000003', 'PARTNER', 'ACTIVE', 12.00),
  (4, 'Arjun Bhatia',         'arjun.bhatia@skyline.com', '9000000004', '$2b$10$demoHashPlaceholder0000000000000000000000004', 'PARTNER', 'ACTIVE', 18.00),
  (5, 'Rohan Mehta',          'rohan.mehta@example.com',  '9000000005', '$2b$10$demoHashPlaceholder0000000000000000000000005', 'USER',    'ACTIVE', NULL),
  (6, 'Ananya Verma',         'ananya.verma@example.com', '9000000006', '$2b$10$demoHashPlaceholder0000000000000000000000006', 'USER',    'ACTIVE', NULL),
  (7, 'Karan Sethi',          'karan.sethi@example.com',  '9000000007', '$2b$10$demoHashPlaceholder0000000000000000000000007', 'USER',    'ACTIVE', NULL);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ----------------------------------------------------------------------------
-- PARKING LOCATIONS  (Kanpur + Lucknow demo cities)
-- ----------------------------------------------------------------------------
INSERT INTO parking_locations
  (id, partner_id, name, property_type, address, city, state, postal_code, latitude, longitude, description, contact_phone, status) VALUES
  (1, 2, 'Taj Comfort Inn Parking',      'HOTEL',               'Civil Lines Rd',       'Kanpur',   'Uttar Pradesh', '208001', 26.464700, 80.331900, 'Covered hotel parking, 24x7 security.', '9000000002', 'ACTIVE'),
  (2, 3, 'City Central Mall Parking',    'MALL',                'Mall Road',            'Kanpur',   'Uttar Pradesh', '208002', 26.470000, 80.325000, 'Multi-level mall parking with EV points.', '9000000003', 'ACTIVE'),
  (3, 4, 'Skyline Business Towers',      'COMMERCIAL_BUILDING', 'Gomti Nagar',          'Lucknow',  'Uttar Pradesh', '226010', 26.849500, 81.005600, 'Corporate building basement parking.', '9000000004', 'ACTIVE');

INSERT INTO parking_locations
  (id, partner_id, name, property_type, address, city, state, postal_code, latitude, longitude, description, contact_phone, status) VALUES
  (4, 2, 'Z Square Mall Parking', 'MALL', 'M.G. Marg, The Mall', 'Kanpur', 'Uttar Pradesh', '208001', 26.473380, 80.352730, 'Three-level basement parking. B1 is documented for bikes; B2 and B3 for cars. Parkkar slot layout is a verified product map, while live occupancy requires operator integration.', '9000000010', 'ACTIVE'),
  (5, 3, 'Rave 3 Mall Parking', 'MALL', 'Parwati Bagla Road', 'Kanpur', 'Uttar Pradesh', '208002', 26.492306, 80.327478, 'Mall and multiplex parking. Detailed live floor occupancy requires operator integration.', '9000000011', 'ACTIVE'),
  (6, 3, 'South X Mall Parking', 'MALL', 'Kidwai Nagar', 'Kanpur', 'Uttar Pradesh', '208011', 26.431000, 80.324000, 'Shopping and entertainment parking. Detailed live floor occupancy requires operator integration.', '9000000012', 'ACTIVE'),
  (7, 4, 'LuLu Mall Lucknow Parking', 'MALL', 'Amar Shaheed Path, Golf City', 'Lucknow', 'Uttar Pradesh', '226030', 26.784042, 80.991171, 'Large mall parking. Parkkar shows slots only when the operator provides live occupancy.', '9000000013', 'ACTIVE'),
  (8, 4, 'Phoenix Palassio Parking', 'MALL', 'Shaheed Path', 'Lucknow', 'Uttar Pradesh', '226010', 26.808740, 81.012730, 'Large retail complex parking. Live floor/slot data requires operator integration.', '9000000014', 'ACTIVE'),
  (9, 4, 'Phoenix United Mall Parking', 'MALL', 'LDA Colony, Kanpur Road', 'Lucknow', 'Uttar Pradesh', '226012', 26.797000, 80.913000, 'Retail mall parking. Live floor/slot data requires operator integration.', '9000000015', 'ACTIVE'),
  (10, 3, 'One Awadh Centre Parking', 'MALL', 'Vibhuti Khand, Gomti Nagar', 'Lucknow', 'Uttar Pradesh', '226010', 26.865000, 81.007000, 'Mall parking in Gomti Nagar. Live floor/slot data requires operator integration.', '9000000016', 'ACTIVE'),
  (11, 3, 'Wave Mall Lucknow Parking', 'MALL', 'TC-54, Vibhuti Khand, Gomti Nagar', 'Lucknow', 'Uttar Pradesh', '226010', 26.862000, 81.008000, 'Wave Mall parking. Official floor plans exist; slot occupancy requires operator integration.', '9000000017', 'ACTIVE'),
  (12, 3, 'Sahara Ganj Mall Parking', 'MALL', 'Shahnajaf Road, Hazratganj', 'Lucknow', 'Uttar Pradesh', '226001', 26.855168, 80.946258, 'Multi-level mall parking. Live slot occupancy requires operator integration.', '9000000018', 'ACTIVE');

SELECT setval('parking_locations_id_seq', (SELECT MAX(id) FROM parking_locations));

-- ----------------------------------------------------------------------------
-- PARKING SLOTS
-- ----------------------------------------------------------------------------
INSERT INTO parking_slots (id, location_id, slot_code, slot_type, status, price_per_hour) VALUES
  (1, 1, 'A1', 'CAR',        'ACTIVE', 40.00),
  (2, 1, 'A2', 'CAR',        'ACTIVE', 40.00),
  (3, 1, 'B1', 'BIKE',       'ACTIVE', 15.00),
  (4, 1, 'E1', 'EV',         'ACTIVE', 60.00),
  (5, 2, 'M1', 'CAR',        'ACTIVE', 35.00),
  (6, 2, 'M2', 'CAR',        'ACTIVE', 35.00),
  (7, 2, 'M3', 'ACCESSIBLE', 'ACTIVE', 30.00),
  (8, 3, 'S1', 'CAR',        'ACTIVE', 50.00),
  (9, 3, 'S2', 'BIKE',       'MAINTENANCE', 20.00);

INSERT INTO parking_slots (id, location_id, slot_code, slot_type, status, price_per_hour) VALUES
  (10, 4, 'B1-01', 'BIKE', 'ACTIVE', 15.00),
  (11, 4, 'B1-02', 'BIKE', 'ACTIVE', 15.00),
  (12, 4, 'B1-03', 'BIKE', 'ACTIVE', 15.00),
  (13, 4, 'B1-04', 'BIKE', 'ACTIVE', 15.00),
  (14, 4, 'B1-05', 'BIKE', 'ACTIVE', 15.00),
  (15, 4, 'B1-06', 'BIKE', 'ACTIVE', 15.00),
  (16, 4, 'B1-07', 'BIKE', 'ACTIVE', 15.00),
  (17, 4, 'B1-08', 'BIKE', 'ACTIVE', 15.00),
  (18, 4, 'B1-09', 'BIKE', 'ACTIVE', 15.00),
  (19, 4, 'B1-10', 'BIKE', 'ACTIVE', 15.00),
  (20, 4, 'B1-11', 'BIKE', 'ACTIVE', 15.00),
  (21, 4, 'B1-12', 'BIKE', 'ACTIVE', 15.00),
  (22, 4, 'B1-13', 'BIKE', 'ACTIVE', 15.00),
  (23, 4, 'B1-14', 'BIKE', 'ACTIVE', 15.00),
  (24, 4, 'B1-15', 'BIKE', 'ACTIVE', 15.00),
  (25, 4, 'B1-16', 'BIKE', 'ACTIVE', 15.00),
  (26, 4, 'B1-17', 'BIKE', 'ACTIVE', 15.00),
  (27, 4, 'B1-18', 'BIKE', 'ACTIVE', 15.00),
  (28, 4, 'B2-01', 'CAR', 'ACTIVE', 35.00),
  (29, 4, 'B2-02', 'CAR', 'ACTIVE', 35.00),
  (30, 4, 'B2-03', 'CAR', 'ACTIVE', 35.00),
  (31, 4, 'B2-04', 'CAR', 'ACTIVE', 35.00),
  (32, 4, 'B2-05', 'CAR', 'ACTIVE', 35.00),
  (33, 4, 'B2-06', 'CAR', 'ACTIVE', 35.00),
  (34, 4, 'B2-07', 'CAR', 'ACTIVE', 35.00),
  (35, 4, 'B2-08', 'CAR', 'ACTIVE', 35.00),
  (36, 4, 'B2-09', 'CAR', 'ACTIVE', 35.00),
  (37, 4, 'B2-10', 'CAR', 'ACTIVE', 35.00),
  (38, 4, 'B2-11', 'CAR', 'ACTIVE', 35.00),
  (39, 4, 'B2-12', 'CAR', 'ACTIVE', 35.00),
  (40, 4, 'B2-13', 'CAR', 'ACTIVE', 35.00),
  (41, 4, 'B2-14', 'CAR', 'ACTIVE', 35.00),
  (42, 4, 'B2-15', 'CAR', 'ACTIVE', 35.00),
  (43, 4, 'B2-16', 'CAR', 'ACTIVE', 35.00),
  (44, 4, 'B2-17', 'CAR', 'ACTIVE', 35.00),
  (45, 4, 'B2-18', 'CAR', 'ACTIVE', 35.00),
  (46, 4, 'B2-19', 'CAR', 'ACTIVE', 35.00),
  (47, 4, 'B2-20', 'CAR', 'ACTIVE', 35.00),
  (48, 4, 'B2-21', 'CAR', 'ACTIVE', 35.00),
  (49, 4, 'B2-22', 'CAR', 'ACTIVE', 35.00),
  (50, 4, 'B2-23', 'CAR', 'ACTIVE', 35.00),
  (51, 4, 'B2-24', 'CAR', 'ACTIVE', 35.00),
  (52, 4, 'B2-25', 'CAR', 'ACTIVE', 35.00),
  (53, 4, 'B2-26', 'CAR', 'ACTIVE', 35.00),
  (54, 4, 'B2-27', 'CAR', 'ACTIVE', 35.00),
  (55, 4, 'B2-28', 'CAR', 'ACTIVE', 35.00),
  (56, 4, 'B2-29', 'CAR', 'ACTIVE', 35.00),
  (57, 4, 'B2-30', 'CAR', 'ACTIVE', 35.00),
  (58, 4, 'B3-01', 'CAR', 'ACTIVE', 35.00),
  (59, 4, 'B3-02', 'CAR', 'ACTIVE', 35.00),
  (60, 4, 'B3-03', 'CAR', 'ACTIVE', 35.00),
  (61, 4, 'B3-04', 'CAR', 'ACTIVE', 35.00),
  (62, 4, 'B3-05', 'CAR', 'ACTIVE', 35.00),
  (63, 4, 'B3-06', 'CAR', 'ACTIVE', 35.00),
  (64, 4, 'B3-07', 'CAR', 'ACTIVE', 35.00),
  (65, 4, 'B3-08', 'CAR', 'ACTIVE', 35.00),
  (66, 4, 'B3-09', 'CAR', 'ACTIVE', 35.00),
  (67, 4, 'B3-10', 'CAR', 'ACTIVE', 35.00),
  (68, 4, 'B3-11', 'CAR', 'ACTIVE', 35.00),
  (69, 4, 'B3-12', 'CAR', 'ACTIVE', 35.00),
  (70, 4, 'B3-13', 'CAR', 'ACTIVE', 35.00),
  (71, 4, 'B3-14', 'CAR', 'ACTIVE', 35.00),
  (72, 4, 'B3-15', 'CAR', 'ACTIVE', 35.00),
  (73, 4, 'B3-16', 'CAR', 'ACTIVE', 35.00),
  (74, 4, 'B3-17', 'CAR', 'ACTIVE', 35.00),
  (75, 4, 'B3-18', 'CAR', 'ACTIVE', 35.00),
  (76, 4, 'B3-19', 'CAR', 'ACTIVE', 35.00),
  (77, 4, 'B3-20', 'CAR', 'ACTIVE', 35.00),
  (78, 4, 'B3-21', 'CAR', 'ACTIVE', 35.00),
  (79, 4, 'B3-22', 'CAR', 'ACTIVE', 35.00),
  (80, 4, 'B3-23', 'CAR', 'ACTIVE', 35.00),
  (81, 4, 'B3-24', 'CAR', 'ACTIVE', 35.00),
  (82, 4, 'B3-25', 'CAR', 'ACTIVE', 35.00),
  (83, 4, 'B3-26', 'CAR', 'ACTIVE', 35.00),
  (84, 4, 'B3-27', 'CAR', 'ACTIVE', 35.00),
  (85, 4, 'B3-28', 'CAR', 'ACTIVE', 35.00),
  (86, 4, 'B3-29', 'CAR', 'ACTIVE', 35.00),
  (87, 4, 'B3-30', 'CAR', 'ACTIVE', 35.00),
  (88, 5, 'R3-01', 'BIKE', 'ACTIVE', 20.00),
  (89, 5, 'R3-02', 'BIKE', 'ACTIVE', 20.00),
  (90, 5, 'R3-03', 'EV', 'ACTIVE', 60.00),
  (91, 5, 'R3-04', 'CAR', 'ACTIVE', 40.00),
  (92, 5, 'R3-05', 'CAR', 'ACTIVE', 40.00),
  (93, 5, 'R3-06', 'CAR', 'ACTIVE', 40.00),
  (94, 5, 'R3-07', 'CAR', 'ACTIVE', 40.00),
  (95, 5, 'R3-08', 'CAR', 'ACTIVE', 40.00),
  (96, 5, 'R3-09', 'CAR', 'ACTIVE', 40.00),
  (97, 5, 'R3-10', 'CAR', 'ACTIVE', 40.00),
  (98, 5, 'R3-11', 'CAR', 'ACTIVE', 40.00),
  (99, 5, 'R3-12', 'CAR', 'ACTIVE', 40.00),
  (100, 6, 'SX-01', 'BIKE', 'ACTIVE', 20.00),
  (101, 6, 'SX-02', 'BIKE', 'ACTIVE', 20.00),
  (102, 6, 'SX-03', 'EV', 'ACTIVE', 60.00),
  (103, 6, 'SX-04', 'CAR', 'ACTIVE', 40.00),
  (104, 6, 'SX-05', 'CAR', 'ACTIVE', 40.00),
  (105, 6, 'SX-06', 'CAR', 'ACTIVE', 40.00),
  (106, 6, 'SX-07', 'CAR', 'ACTIVE', 40.00),
  (107, 6, 'SX-08', 'CAR', 'ACTIVE', 40.00),
  (108, 6, 'SX-09', 'CAR', 'ACTIVE', 40.00),
  (109, 6, 'SX-10', 'CAR', 'ACTIVE', 40.00),
  (110, 6, 'SX-11', 'CAR', 'ACTIVE', 40.00),
  (111, 6, 'SX-12', 'CAR', 'ACTIVE', 40.00),
  (112, 7, 'LU-01', 'BIKE', 'ACTIVE', 20.00),
  (113, 7, 'LU-02', 'BIKE', 'ACTIVE', 20.00),
  (114, 7, 'LU-03', 'EV', 'ACTIVE', 60.00),
  (115, 7, 'LU-04', 'CAR', 'ACTIVE', 40.00),
  (116, 7, 'LU-05', 'CAR', 'ACTIVE', 40.00),
  (117, 7, 'LU-06', 'CAR', 'ACTIVE', 40.00),
  (118, 7, 'LU-07', 'CAR', 'ACTIVE', 40.00),
  (119, 7, 'LU-08', 'CAR', 'ACTIVE', 40.00),
  (120, 7, 'LU-09', 'CAR', 'ACTIVE', 40.00),
  (121, 7, 'LU-10', 'CAR', 'ACTIVE', 40.00),
  (122, 7, 'LU-11', 'CAR', 'ACTIVE', 40.00),
  (123, 7, 'LU-12', 'CAR', 'ACTIVE', 40.00),
  (124, 8, 'PP-01', 'BIKE', 'ACTIVE', 20.00),
  (125, 8, 'PP-02', 'BIKE', 'ACTIVE', 20.00),
  (126, 8, 'PP-03', 'EV', 'ACTIVE', 60.00),
  (127, 8, 'PP-04', 'CAR', 'ACTIVE', 40.00),
  (128, 8, 'PP-05', 'CAR', 'ACTIVE', 40.00),
  (129, 8, 'PP-06', 'CAR', 'ACTIVE', 40.00),
  (130, 8, 'PP-07', 'CAR', 'ACTIVE', 40.00),
  (131, 8, 'PP-08', 'CAR', 'ACTIVE', 40.00),
  (132, 8, 'PP-09', 'CAR', 'ACTIVE', 40.00),
  (133, 8, 'PP-10', 'CAR', 'ACTIVE', 40.00),
  (134, 8, 'PP-11', 'CAR', 'ACTIVE', 40.00),
  (135, 8, 'PP-12', 'CAR', 'ACTIVE', 40.00),
  (136, 9, 'PU-01', 'BIKE', 'ACTIVE', 20.00),
  (137, 9, 'PU-02', 'BIKE', 'ACTIVE', 20.00),
  (138, 9, 'PU-03', 'EV', 'ACTIVE', 60.00),
  (139, 9, 'PU-04', 'CAR', 'ACTIVE', 40.00),
  (140, 9, 'PU-05', 'CAR', 'ACTIVE', 40.00),
  (141, 9, 'PU-06', 'CAR', 'ACTIVE', 40.00),
  (142, 9, 'PU-07', 'CAR', 'ACTIVE', 40.00),
  (143, 9, 'PU-08', 'CAR', 'ACTIVE', 40.00),
  (144, 9, 'PU-09', 'CAR', 'ACTIVE', 40.00),
  (145, 9, 'PU-10', 'CAR', 'ACTIVE', 40.00),
  (146, 9, 'PU-11', 'CAR', 'ACTIVE', 40.00),
  (147, 9, 'PU-12', 'CAR', 'ACTIVE', 40.00),
  (148, 10, 'OA-01', 'BIKE', 'ACTIVE', 20.00),
  (149, 10, 'OA-02', 'BIKE', 'ACTIVE', 20.00),
  (150, 10, 'OA-03', 'EV', 'ACTIVE', 60.00),
  (151, 10, 'OA-04', 'CAR', 'ACTIVE', 40.00),
  (152, 10, 'OA-05', 'CAR', 'ACTIVE', 40.00),
  (153, 10, 'OA-06', 'CAR', 'ACTIVE', 40.00),
  (154, 10, 'OA-07', 'CAR', 'ACTIVE', 40.00),
  (155, 10, 'OA-08', 'CAR', 'ACTIVE', 40.00),
  (156, 10, 'OA-09', 'CAR', 'ACTIVE', 40.00),
  (157, 10, 'OA-10', 'CAR', 'ACTIVE', 40.00),
  (158, 10, 'OA-11', 'CAR', 'ACTIVE', 40.00),
  (159, 10, 'OA-12', 'CAR', 'ACTIVE', 40.00),
  (160, 11, 'WM-01', 'BIKE', 'ACTIVE', 20.00),
  (161, 11, 'WM-02', 'BIKE', 'ACTIVE', 20.00),
  (162, 11, 'WM-03', 'EV', 'ACTIVE', 60.00),
  (163, 11, 'WM-04', 'CAR', 'ACTIVE', 40.00),
  (164, 11, 'WM-05', 'CAR', 'ACTIVE', 40.00),
  (165, 11, 'WM-06', 'CAR', 'ACTIVE', 40.00),
  (166, 11, 'WM-07', 'CAR', 'ACTIVE', 40.00),
  (167, 11, 'WM-08', 'CAR', 'ACTIVE', 40.00),
  (168, 11, 'WM-09', 'CAR', 'ACTIVE', 40.00),
  (169, 11, 'WM-10', 'CAR', 'ACTIVE', 40.00),
  (170, 11, 'WM-11', 'CAR', 'ACTIVE', 40.00),
  (171, 11, 'WM-12', 'CAR', 'ACTIVE', 40.00),
  (172, 12, 'SG-01', 'BIKE', 'ACTIVE', 20.00),
  (173, 12, 'SG-02', 'BIKE', 'ACTIVE', 20.00),
  (174, 12, 'SG-03', 'EV', 'ACTIVE', 60.00),
  (175, 12, 'SG-04', 'CAR', 'ACTIVE', 40.00),
  (176, 12, 'SG-05', 'CAR', 'ACTIVE', 40.00),
  (177, 12, 'SG-06', 'CAR', 'ACTIVE', 40.00),
  (178, 12, 'SG-07', 'CAR', 'ACTIVE', 40.00),
  (179, 12, 'SG-08', 'CAR', 'ACTIVE', 40.00),
  (180, 12, 'SG-09', 'CAR', 'ACTIVE', 40.00),
  (181, 12, 'SG-10', 'CAR', 'ACTIVE', 40.00),
  (182, 12, 'SG-11', 'CAR', 'ACTIVE', 40.00),
  (183, 12, 'SG-12', 'CAR', 'ACTIVE', 40.00);

SELECT setval('parking_slots_id_seq', (SELECT MAX(id) FROM parking_slots));

-- ----------------------------------------------------------------------------
-- VEHICLES
-- ----------------------------------------------------------------------------
INSERT INTO vehicles (id, user_id, vehicle_type, plate_number, make, model) VALUES
  (1, 5, 'CAR', 'UP78AB1234', 'Maruti Suzuki', 'Swift'),
  (2, 5, 'BIKE', 'UP78CD5678', 'Honda',         'Activa'),
  (3, 6, 'CAR', 'UP32EF9012', 'Hyundai',        'i20'),
  (4, 7, 'EV',  'UP32GH3456', 'Tata',           'Nexon EV');

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- ----------------------------------------------------------------------------
-- PARKING SERVICES (catalog)
-- ----------------------------------------------------------------------------
INSERT INTO parking_services (id, name, description, price, is_active) VALUES
  (1, 'Car Cleaning', 'Normal exterior wash with mats, vacuum and basic finish while parked.', 150.00, TRUE),
  (2, 'EV Charging',  'Per-hour EV charging at an EV slot.', 50.00, TRUE),
  (3, 'Valet Parking', 'Attendant parks and retrieves your vehicle.', 150.00, TRUE),
  (4, 'Interior Cleaning', 'Interior vacuum, dashboard wipe, mats and seat-area cleaning.', 149.00, TRUE),
  (5, 'Complete Car Clean', 'Exterior wash plus interior vacuum, dashboard and glass cleaning.', 299.00, TRUE),
  (6, 'Bike Wash', 'Normal two-wheeler wash with tyre cleaning and finish.', 99.00, TRUE),
  (7, 'Tubeless Puncture Assistance', 'Emergency one-puncture assistance for eligible tubeless tyres; parts are extra.', 199.00, TRUE),
  (8, 'Tyre Air Top-up', 'Tyre pressure check and air top-up.', 30.00, TRUE),
  (9, 'Polish Finish', 'Basic polish finish after wash.', 249.00, TRUE);

SELECT setval('parking_services_id_seq', (SELECT MAX(id) FROM parking_services));

-- ----------------------------------------------------------------------------
-- BOOKINGS
-- Mix of COMPLETED (past), CONFIRMED (upcoming), and CANCELLED, all built
-- relative to now() so the seed stays realistic whenever it's run.
-- ----------------------------------------------------------------------------
INSERT INTO bookings
  (id, user_id, slot_id, vehicle_id, start_time, end_time, status,
   price_per_hour_snapshot, total_amount, cancelled_at, cancelled_by, cancellation_reason) VALUES
  -- Completed booking from 3 days ago (Rohan, hotel slot A1, 2 hours)
  (1, 5, 1, 1, now() - interval '3 days' - interval '2 hours', now() - interval '3 days', 'COMPLETED', 40.00, 80.00, NULL, NULL, NULL),

  -- Completed booking from yesterday (Ananya, mall slot M1, 3 hours, with car cleaning add-on)
  (2, 6, 5, 3, now() - interval '1 day' - interval '3 hours', now() - interval '1 day', 'COMPLETED', 35.00, 205.00, NULL, NULL, NULL),

  -- Upcoming confirmed booking (Rohan, hotel EV slot, tomorrow, 2 hours)
  (3, 5, 4, 1, now() + interval '1 day', now() + interval '1 day' + interval '2 hours', 'CONFIRMED', 60.00, 120.00, NULL, NULL, NULL),

  -- Upcoming confirmed booking (Karan, Lucknow commercial slot, 2 days from now, 4 hours)
  (4, 7, 8, 4, now() + interval '2 days', now() + interval '2 days' + interval '4 hours', 'CONFIRMED', 50.00, 200.00, NULL, NULL, NULL),

  -- Cancelled booking (Ananya cancelled a mall slot booking she made for next week)
  (5, 6, 6, 3, now() + interval '5 days', now() + interval '5 days' + interval '2 hours', 'CANCELLED', 35.00, 70.00, now() - interval '1 hour', 'USER', 'Change of plans');

SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- ----------------------------------------------------------------------------
-- BOOKING SERVICES (add-ons purchased with a booking)
-- ----------------------------------------------------------------------------
INSERT INTO booking_services (id, booking_id, service_id, quantity, price_at_booking) VALUES
  (1, 2, 1, 1, 100.00);  -- Ananya's completed mall booking included a Car Cleaning

SELECT setval('booking_services_id_seq', (SELECT MAX(id) FROM booking_services));

-- ----------------------------------------------------------------------------
-- PAYMENTS
-- ----------------------------------------------------------------------------
INSERT INTO payments (id, booking_id, amount, status, method, transaction_ref, paid_at) VALUES
  (1, 1, 80.00,  'PAID', 'UPI',  'TXN-DEMO-0001', now() - interval '3 days' - interval '2 hours'),
  (2, 2, 205.00, 'PAID', 'CARD', 'TXN-DEMO-0002', now() - interval '1 day' - interval '3 hours'),
  (3, 3, 120.00, 'PAID', 'UPI',  'TXN-DEMO-0003', now() - interval '1 hour'),
  (4, 4, 200.00, 'PAID', 'UPI',  'TXN-DEMO-0004', now() - interval '30 minutes');

-- Booking 5 (cancelled) intentionally has no payment row: it was cancelled
-- before payment completed. If a real refund scenario is needed later,
-- a payments row with status REFUNDED would be added — Phase 1 doesn't
-- fabricate one since it wasn't paid for in this demo scenario.

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- ----------------------------------------------------------------------------
-- REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, user_id, location_id, rating, review_text) VALUES
  (1, 5, 1, 5, 'Very secure and easy to find. Staff was helpful.'),
  (2, 6, 2, 4, 'Good spot, slightly tight for bigger cars.');

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ----------------------------------------------------------------------------
-- FAVORITES
-- ----------------------------------------------------------------------------
INSERT INTO favorites (id, user_id, location_id) VALUES
  (1, 5, 2),  -- Rohan favorited the mall
  (2, 6, 1);  -- Ananya favorited the hotel

SELECT setval('favorites_id_seq', (SELECT MAX(id) FROM favorites));

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
