-- OAS Database Seed Data
-- This file will be automatically executed after schema initialization

USE oas_database;

-- Insert test users
INSERT INTO users (email, password, name, role, department, is_active) VALUES
('superadmin@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'Super Administrator', 'SUPER_ADMIN', 'IT', true),
('admin@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'Course Administrator', 'COURSE_ADMIN', 'Computer Science', true),
('examiner@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'Dr. Jane Examiner', 'EXAMINER', 'Computer Science', true),
('student@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'John Student', 'STUDENT', 'Computer Science', true),
('student2@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'Jane Student', 'STUDENT', 'Computer Science', true),
('examiner2@example.com', '$2b$10$kVZF3nVu5U6h.4LcMNJsn.f8QXUGkl0m7xYZOvPu5QqZ1B0L8A5wi', 'Dr. Bob Examiner', 'EXAMINER', 'Computer Science', true);

-- Insert test courses
INSERT INTO courses (name, code, description, department, admin_id, is_active) VALUES
('Software Engineering Advanced Project', 'SWEN90017', 'Advanced software engineering project course', 'Computer Science', 2, true),
('Database Systems', 'COMP90007', 'Advanced database systems and design', 'Computer Science', 2, true),
('Machine Learning', 'COMP90049', 'Introduction to machine learning algorithms', 'Computer Science', 2, true);

-- Insert test assignments
INSERT INTO assignments (course_id, title, description, instructions, is_group_assignment, max_group_size, booking_start_date, booking_end_date, assessment_start_date, assessment_end_date, is_active) VALUES
(1, 'Final Project Presentation', 'Present your software engineering project', 'Prepare a 15-minute presentation covering your project development process, challenges faced, and solutions implemented.', true, 4, '2024-01-15 09:00:00', '2024-01-25 17:00:00', '2024-01-26 09:00:00', '2024-01-30 17:00:00', true),
(1, 'Mid-term Design Review', 'Present your system design and architecture', 'Present your system architecture, design decisions, and progress so far.', true, 4, '2024-01-01 09:00:00', '2024-01-10 17:00:00', '2024-01-11 09:00:00', '2024-01-15 17:00:00', true),
(2, 'Database Design Presentation', 'Present your database design project', 'Present your database schema, normalization process, and query optimization strategies.', false, 1, '2024-01-20 09:00:00', '2024-01-28 17:00:00', '2024-01-29 09:00:00', '2024-02-02 17:00:00', true);

-- Insert test groups
INSERT INTO groups (assignment_id, name) VALUES
(1, 'Team Alpha'),
(1, 'Team Beta'),
(2, 'Design Squad'),
(2, 'Architecture Team');

-- Insert group members
INSERT INTO group_members (group_id, user_id) VALUES
(1, 4), -- John Student in Team Alpha
(1, 5), -- Jane Student in Team Alpha
(2, 4), -- John Student also in Team Beta (different assignment)
(3, 4), -- John Student in Design Squad
(4, 5); -- Jane Student in Architecture Team

-- Insert test time slots
INSERT INTO time_slots (assignment_id, start_time, end_time, venue, max_bookings, current_bookings, is_active) VALUES
(1, '2024-01-26 09:00:00', '2024-01-26 09:30:00', 'Room 101', 1, 0, true),
(1, '2024-01-26 09:30:00', '2024-01-26 10:00:00', 'Room 101', 1, 0, true),
(1, '2024-01-26 10:00:00', '2024-01-26 10:30:00', 'Room 101', 1, 0, true),
(1, '2024-01-26 10:30:00', '2024-01-26 11:00:00', 'Room 101', 1, 0, true),
(2, '2024-01-11 14:00:00', '2024-01-11 14:30:00', 'Room 102', 1, 0, true),
(2, '2024-01-11 14:30:00', '2024-01-11 15:00:00', 'Room 102', 1, 0, true),
(3, '2024-01-29 13:00:00', '2024-01-29 13:20:00', 'Lab 201', 1, 0, true),
(3, '2024-01-29 13:20:00', '2024-01-29 13:40:00', 'Lab 201', 1, 0, true);

-- Insert test rubrics
INSERT INTO rubrics (assignment_id, name, description, total_points, is_active) VALUES
(1, 'Final Project Presentation Rubric', 'Rubric for evaluating final project presentations', 100.00, true),
(2, 'Design Review Rubric', 'Rubric for evaluating design review presentations', 80.00, true),
(3, 'Database Design Rubric', 'Rubric for evaluating database design presentations', 90.00, true);

-- Insert rubric criteria
INSERT INTO rubric_criteria (rubric_id, name, description, weight, max_points, order_index) VALUES
-- Final Project Presentation Rubric
(1, 'Technical Implementation', 'Quality and complexity of the technical solution', 1.00, 30.00, 1),
(1, 'Presentation Skills', 'Clarity, organization, and delivery of the presentation', 1.00, 20.00, 2),
(1, 'Problem Solving', 'Demonstration of problem-solving approach and critical thinking', 1.00, 25.00, 3),
(1, 'Team Collaboration', 'Evidence of effective teamwork and collaboration', 1.00, 15.00, 4),
(1, 'Documentation', 'Quality and completeness of project documentation', 1.00, 10.00, 5),

-- Design Review Rubric
(2, 'Architecture Design', 'Quality and appropriateness of system architecture', 1.00, 25.00, 1),
(2, 'Design Patterns', 'Effective use of design patterns and principles', 1.00, 20.00, 2),
(2, 'Scalability Considerations', 'Consideration of scalability and performance', 1.00, 20.00, 3),
(2, 'Presentation Quality', 'Clarity and organization of the design presentation', 1.00, 15.00, 4),

-- Database Design Rubric
(3, 'Schema Design', 'Quality and normalization of database schema', 1.00, 30.00, 1),
(3, 'Query Optimization', 'Understanding and application of query optimization', 1.00, 25.00, 2),
(3, 'Data Integrity', 'Implementation of constraints and data integrity measures', 1.00, 20.00, 3),
(3, 'Performance Analysis', 'Analysis of database performance and indexing strategies', 1.00, 15.00, 4);

-- Insert some comment templates
INSERT INTO comment_templates (user_id, category, title, content, is_public, usage_count) VALUES
(3, 'Technical', 'Strong Implementation', 'Excellent technical implementation with clean, well-structured code. Good use of design patterns and best practices.', true, 15),
(3, 'Technical', 'Needs Improvement', 'The technical implementation needs some refinement. Consider reviewing the design patterns and code organization.', true, 8),
(3, 'Presentation', 'Clear Communication', 'Very clear and well-organized presentation. Good use of visual aids and effective communication of key concepts.', true, 12),
(3, 'Presentation', 'Time Management', 'Good content but needs better time management. Consider practicing to fit within the allocated time slot.', true, 6),
(6, 'General', 'Good Progress', 'Shows good progress and understanding of the requirements. Keep up the good work!', true, 10),
(6, 'Teamwork', 'Collaborative Effort', 'Excellent demonstration of teamwork and collaboration. All team members contributed effectively.', true, 7);

-- Note: All test passwords are "password123" - hashed with bcrypt
-- In production, these should be proper secure passwords