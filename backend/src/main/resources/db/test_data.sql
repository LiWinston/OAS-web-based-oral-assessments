-- Test Data Generation Script for sys_user, sys_role, and sys_user_role

-- Insert roles
INSERT INTO sys_role (role_name, role_key, create_time, creator, update_time, updater)
VALUES
('Administrator', 'ROLE_ADMIN', NOW(), 0, NOW(), 0),
('Student',          'ROLE_STUDENT',  NOW(), 0, NOW(), 0),
('Examiner',         'ROLE_EXAMINER', NOW(), 0, NOW(), 0);

-- Insert users
INSERT INTO sys_user (user_name, password, status, create_time, creator, update_time, updater)
VALUES
('alice', 'password1', '0', NOW(), 0, NOW(), 0),
('bob',   'password2', '0', NOW(), 0, NOW(), 0),
('carol', 'password3', '1', NOW(), 0, NOW(), 0),
('dave',  'password4', '0', NOW(), 0, NOW(), 0),
('eve',   'password5', '0', NOW(), 0, NOW(), 0);

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
