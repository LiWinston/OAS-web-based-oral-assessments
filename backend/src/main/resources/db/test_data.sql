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
('alice@student.unimelb.edu.au', '$2a$10$REeMr6fg50aEBJRpqJG1QuPrurqFidjYfzhYfZ9toTkVA0PgHtWTG', '0', NOW(), 0, NOW(), 0),
('bob@student.unimelb.edu.au',   '$2a$10$liJ1qH4061vxB/JmjRxvVeXUuaJQYlNTNiAQOaspruC2rGEzRDzgW', '0', NOW(), 0, NOW(), 0),
('carol@student.unimelb.edu.au', '$2a$10$gFqVnerIx5aoZ.4452ky2OKHH830YFKfJGFwxqQ.6VmwoJJK3PuUm', '1', NOW(), 0, NOW(), 0),
('dave@student.unimelb.edu.au',  '$2a$10$tWWreAK7JL2ujswTc4HQUeYpCf1Tn15tQI7cAYZLpaE5JbCuVm7AK', '0', NOW(), 0, NOW(), 0),
('eve@student.unimelb.edu.au',   '$2a$10$1BoyqSeqgJq9TfEGeziObeP2.PHrhPUvDUFPNA1evgK72Q1iX9Yrq', '0', NOW(), 0, NOW(), 0);

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

-- ----------------------------
-- Test data for Epic 4.1: Academic Structure
-- ----------------------------

-- Insert academic years
INSERT INTO academic_year (year_value, start_date, end_date, is_active, create_time, creator, update_time, updater)
VALUES
    ('2024', '2024-01-01', '2024-12-31', 1, NOW(), 1, NOW(), 1),
    ('2025', '2025-01-01', '2025-12-31', 1, NOW(), 1, NOW(), 1),
    ('2026', '2026-01-01', '2026-12-31', 1, NOW(), 1, NOW(), 1);

-- Insert semesters for 2025
INSERT INTO semester (academic_year_id, semester_name, semester_code, start_date, end_date, is_active, create_time, creator, update_time, updater)
VALUES
    (2, 'Semester 1', 'S1', '2025-02-24', '2025-06-27', 1, NOW(), 1, NOW(), 1),
    (2, 'Semester 2', 'S2', '2025-07-28', '2025-11-29', 1, NOW(), 1, NOW(), 1),
    (2, 'Summer Semester', 'SU', '2025-12-01', '2026-02-28', 1, NOW(), 1, NOW(), 1);

-- Insert semesters for 2024 (for historical data)
INSERT INTO semester (academic_year_id, semester_name, semester_code, start_date, end_date, is_active, create_time, creator, update_time, updater)
VALUES
    (1, 'Semester 1', 'S1', '2024-02-26', '2024-06-28', 1, NOW(), 1, NOW(), 1),
    (1, 'Semester 2', 'S2', '2024-07-29', '2024-11-29', 1, NOW(), 1, NOW(), 1);

-- Insert subjects for 2025 Semester 1
INSERT INTO subject (semester_id, subject_code, subject_name, description, admin_user_id, is_active, create_time, creator, update_time, updater)
VALUES
    (1, 'SWEN90017', 'Software Engineering Project Management', 'Master-level software engineering project management course focusing on real-world software development practices.', 1, 1, NOW(), 1, NOW(), 1),
    (1, 'COMP90024', 'Cluster and Cloud Computing', 'Advanced course covering distributed computing, cloud architectures, and big data processing.', 1, 1, NOW(), 1, NOW(), 1),
    (1, 'SWEN90016', 'Software Engineering Research Project', 'Research-focused software engineering course for advanced students.', 1, 1, NOW(), 1, NOW(), 1);

-- Insert subjects for 2025 Semester 2
INSERT INTO subject (semester_id, subject_code, subject_name, description, admin_user_id, is_active, create_time, creator, update_time, updater)
VALUES
    (2, 'SWEN90014', 'Masters Software Engineering Project', 'Capstone project course for Masters of Software Engineering students.', 1, 1, NOW(), 1, NOW(), 1),
    (2, 'COMP90056', 'Advanced Algorithms and Data Structures', 'Advanced study of algorithms, data structures, and computational complexity.', 1, 1, NOW(), 1, NOW(), 1);
