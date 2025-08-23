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
-- Test data for Epic 4.1: Course Management (Simplified)
-- ----------------------------

-- Insert courses/subjects with embedded academic year and semester
INSERT INTO subject (subject_code, subject_name, description, academic_year, semester, admin_user_id, is_active, status, create_time, creator, update_time, updater)
VALUES
    -- 2025 Semester 1 courses
    ('SWEN90017', 'Software Engineering Project Management', 'Master-level software engineering project management course focusing on real-world software development practices.', 2025, '1', 1, 1, 'active', NOW(), 1, NOW(), 1),
    ('COMP90024', 'Cluster and Cloud Computing', 'Advanced course covering distributed computing, cloud architectures, and big data processing.', 2025, '1', 1, 1, 'active', NOW(), 1, NOW(), 1),
    ('SWEN90016', 'Software Engineering Research Project', 'Research-focused software engineering course for advanced students.', 2025, '1', 1, 1, 'active', NOW(), 1, NOW(), 1),
    ('INFO30005', 'Web Information Technologies', 'Modern web development technologies and frameworks.', 2025, '1', 1, 1, 'active', NOW(), 1, NOW(), 1),
    
    -- 2025 Semester 2 courses
    ('SWEN90014', 'Masters Software Engineering Project', 'Capstone project course for Masters of Software Engineering students.', 2025, '2', 1, 1, 'active', NOW(), 1, NOW(), 1),
    ('COMP90082', 'Software Project Management', 'Learn to manage software projects effectively.', 2025, '2', 1, 1, 'active', NOW(), 1, NOW(), 1),
    ('SWEN90009', 'Software Engineering Process', 'Software engineering methodologies and practices.', 2025, '2', 1, 1, 'active', NOW(), 1, NOW(), 1),
    
    -- 2024 historical data (archived)
    ('INFO20003', 'Database Systems', 'Database design and implementation.', 2024, '2', 1, 0, 'archived', NOW(), 1, NOW(), 1),
    ('COMP30024', 'Machine Learning', 'Introduction to machine learning concepts and applications.', 2024, '1', 1, 0, 'archived', NOW(), 1, NOW(), 1);
