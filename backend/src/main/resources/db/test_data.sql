-- Test Data Generation Script for sys_user, sys_role, and sys_user_role

-- Insert roles
INSERT INTO sys_role (role_name, role_key, create_time, creator, update_time, updater)
VALUES
('Administrator', 'ROLE_ADMIN', NOW(), 0, NOW(), 0),
('Student',          'ROLE_STUDENT',  NOW(), 0, NOW(), 0),
('Examiner',         'ROLE_EXAMINER', NOW(), 0, NOW(), 0),
('SUPERAdministrator', 'ROLE_SUPER_ADMIN', NOW(), 0, NOW(), 0);


-- Insert users
INSERT INTO sys_user (user_name, password, status, create_time, creator, update_time, updater)
VALUES
('alice', '$2a$10$REeMr6fg50aEBJRpqJG1QuPrurqFidjYfzhYfZ9toTkVA0PgHtWTG', '0', NOW(), 0, NOW(), 0),
('bob',   '$2a$10$liJ1qH4061vxB/JmjRxvVeXUuaJQYlNTNiAQOaspruC2rGEzRDzgW', '0', NOW(), 0, NOW(), 0),
('carol', '$2a$10$gFqVnerIx5aoZ.4452ky2OKHH830YFKfJGFwxqQ.6VmwoJJK3PuUm', '1', NOW(), 0, NOW(), 0),
('dave',  '$2a$10$tWWreAK7JL2ujswTc4HQUeYpCf1Tn15tQI7cAYZLpaE5JbCuVm7AK', '0', NOW(), 0, NOW(), 0),
('eve',   '$2a$10$1BoyqSeqgJq9TfEGeziObeP2.PHrhPUvDUFPNA1evgK72Q1iX9Yrq', '0', NOW(), 0, NOW(), 0);

-- Associate users with roles (assuming AUTO_INCREMENT starts at 1)
INSERT INTO sys_user_role (user_id, role_id) VALUES
 (1, 1),  -- alice as Administrator
 (2, 2),  -- bob as Student
 (3, 2),  -- carol as Student (but status = banned)
 (4, 3),  -- dave as Examiner
 (5, 3);  -- eve as Examiner

-- Insert into sys_student
INSERT INTO sys_student (user_id, token, student_number)
VALUES
    (2, 'token_bob_abc123', 'S2025001'),  -- bob: activated sysStudent
    (3, 'token_carol_xyz45', 'S2025002'); -- carol: not activated (maybe pending approval)
