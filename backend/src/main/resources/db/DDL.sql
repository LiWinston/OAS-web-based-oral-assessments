-- we don't know how to generate root <with-no-name> (class Root) :(

create table assessment_submission
(
    id                    bigint auto_increment
        primary key,
    assignment_id         bigint                                not null,
    session_id            bigint                                null,
    subject_type          varchar(10)                           not null,
    subject_id            bigint                                not null,
    enrollment_id         bigint                                null,
    examiner_id           bigint                                not null,
    status                varchar(16) default 'DRAFT'           not null,
    overall_feedback      text                                  null,
    admin_note            text                                  null,
    total_score           decimal(7, 2)                         null,
    rubric_meta_snapshot  json                                  not null,
    rubrics_info_snapshot json                                  not null,
    scores_json           json                                  not null,
    submitted_at          datetime                              null,
    created_at            datetime    default CURRENT_TIMESTAMP not null,
    updated_at            datetime    default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    version               int         default 0                 not null,
    final_score_override  decimal(5, 2)                         null comment 'Final score override percentage (0-100)',
    override_reason       text                                  null comment 'Reason for score override',
    override_by_user_id   bigint                                null comment 'User ID who made the override',
    override_at           datetime                              null comment 'Timestamp when override was made',
    release_status        varchar(20) default 'NOT_RELEASED'    not null comment 'Release status for student visibility: NOT_RELEASED, RELEASED',
    release_mode          varchar(20) default 'FULL'            not null comment 'Release mode controlling student visibility: FULL, SCORES_ONLY',
    constraint uk_target
        unique (assignment_id, session_id, subject_type, subject_id, examiner_id)
);

create index idx_assignment_subject
    on assessment_submission (assignment_id, subject_type, subject_id);

create index idx_examiner_status
    on assessment_submission (examiner_id, status);

create table assignment_participant
(
    id            bigint auto_increment
        primary key,
    assignment_id bigint                             not null,
    user_id       bigint                             not null,
    role_id       bigint                             not null,
    if_join       tinyint                            not null,
    created_at    datetime default CURRENT_TIMESTAMP not null,
    updated_at    datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP
)
    comment 'Assignment participant table with timestamp tracking';

create index idx_assignment_participant_created_at
    on assignment_participant (created_at);

create index idx_assignment_participant_updated_at
    on assignment_participant (updated_at);

create table assignment_session_config
(
    assignment_id                     bigint                               not null
        primary key,
    session_length_min                int                                  not null,
    gap_time_min                      int                                  not null,
    examiners_per_session             int                                  not null,
    default_max_sessions_per_examiner int        default 0                 not null,
    is_configured                     tinyint(1) default 1                 not null,
    last_modified                     datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    updated_by                        bigint                               null
);

create table examiner_assignment_limit
(
    id            bigint auto_increment
        primary key,
    examiner_id   bigint not null,
    assignment_id bigint not null,
    max_sessions  int    not null,
    constraint examiner_id
        unique (examiner_id, assignment_id)
);

create table password_reset_codes
(
    id            bigint auto_increment
        primary key,
    user_id       bigint        not null,
    code_hash     varchar(128)  not null,
    expires_at    datetime      not null,
    used_at       datetime      null,
    attempt_count int default 0 null,
    created_at    datetime      not null,
    last_sent_at  datetime      null,
    created_ip    varchar(64)   null,
    user_agent    varchar(255)  null
);

create index idx_password_reset_expires_at
    on password_reset_codes (expires_at);

create index idx_password_reset_user_id
    on password_reset_codes (user_id);

create table session_examiners
(
    id          bigint auto_increment
        primary key,
    session_id  bigint   not null,
    examiner_id bigint   not null,
    assigned_at datetime null,
    assigned_by bigint   null,
    constraint uk_session_examiner
        unique (session_id, examiner_id)
);

create index idx_examiner
    on session_examiners (examiner_id);

create table session_student
(
    id          bigint auto_increment comment 'Primary key ID'
        primary key,
    session_id  bigint                             not null comment 'Session ID, foreign key to slot_session',
    type        varchar(10)                        not null comment 'Booking type: STUDENT or GROUP',
    subject_id  bigint                             not null comment 'User ID (for STUDENT) or Group ID (for GROUP)',
    booked_time datetime                           not null comment 'Booking timestamp',
    create_time datetime default CURRENT_TIMESTAMP null comment 'Creation timestamp',
    update_time datetime default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment 'Last update timestamp',
    constraint uk_session_subject
        unique (session_id, type, subject_id)
)
    comment 'Session student booking table' collate = utf8mb4_unicode_ci;

create index idx_session_student_booked_time
    on session_student (booked_time);

create index idx_session_student_session
    on session_student (session_id);

create index idx_session_student_subject
    on session_student (type, subject_id);

create table slot_sessions
(
    session_id               bigint auto_increment
        primary key,
    assignment_id            bigint                                                            null,
    slot_id                  bigint                                                            null,
    session_number           int                                                               not null,
    start_at                 datetime                                                          not null,
    end_at                   datetime                                                          not null,
    venue_id                 bigint                                                            null,
    capacity_groups          int                                     default 1                 not null comment '组容量',
    enrolled_groups          int                                     default 0                 not null comment '已报名组数',
    required_examiners       int                                     default 1                 not null,
    assign_mode              varchar(16)                             default 'INDIVIDUAL'      not null comment 'INDIVIDUAL/GROUP',
    is_published_to_examiner tinyint(1)                              default 0                 not null comment '是否对考官发布',
    is_published_to_student  tinyint(1)                              default 0                 not null comment '是否对学生发布',
    is_staffed               tinyint(1)                              default 0                 not null comment '是否已配员(至少一名考官)',
    status                   enum ('available', 'blocked', 'booked') default 'available'       not null,
    booked_subject_id        bigint                                                            null,
    booked_subject_type      enum ('STUDENT', 'GROUP')                                         null,
    booked_at                datetime                                                          null,
    created_at               datetime                                default CURRENT_TIMESTAMP not null,
    updated_at               datetime                                default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint uk_slot_sno
        unique (slot_id, session_number)
);

create index idx_session_slot_time
    on slot_sessions (slot_id, start_at, end_at);

create index idx_slot_sessions_assignment
    on slot_sessions (assignment_id);

create index idx_slot_sessions_status
    on slot_sessions (status);

create index idx_slot_sessions_time
    on slot_sessions (start_at, end_at);

create index idx_slot_sessions_venue
    on slot_sessions (venue_id);

create table subject
(
    subject_id    bigint auto_increment
        primary key,
    subject_code  varchar(20)                           not null comment 'Subject code (e.g., SWEN90017, COMP90082)',
    subject_name  varchar(200)                          not null comment 'Subject full name',
    description   text                                  null comment 'Subject description',
    academic_year int                                   not null comment 'Academic year (e.g., 2024, 2025)',
    semester      varchar(20)                           not null comment 'Semester (e.g., "1", "2", "summer")',
    admin_user_id bigint                                not null comment 'Administrator user ID (logical reference)',
    is_active     tinyint(1)  default 1                 null comment '1=active, 0=inactive',
    status        varchar(20) default 'active'          null comment 'Status: active, archived, etc.',
    create_time   datetime    default CURRENT_TIMESTAMP null,
    creator       bigint                                null comment 'Creator user ID (logical reference)',
    update_time   datetime    default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP,
    updater       bigint                                null comment 'Updater user ID (logical reference)',
    constraint uk_subject_year_semester
        unique (subject_code, academic_year, semester)
);

create table assignment
(
    id                  bigint auto_increment comment 'Primary key ID'
        primary key,
    subject_id          bigint                                  not null comment 'Subject ID, foreign key',
    name                varchar(255)                            not null comment 'Assignment name',
    description         text                                    null comment 'Assignment description',
    type                varchar(50)                             not null comment 'Assignment type',
    start_date          datetime                                not null comment 'Start date',
    end_date            datetime                                not null comment 'End date',
    weight              decimal(5, 2) default 0.00              null comment 'Weight percentage',
    progress            decimal(5, 2) default 0.00              null comment 'Progress percentage',
    status              varchar(20)   default 'PENDING'         not null comment 'Assignment status',
    rubric_meta_info    text                                    null comment 'Rubric meta information in JSON format: {name, description, totalPoints}',
    rubrics_info        text                                    null comment 'Rubric detailed information in JSON format: {description, weight, scaleType, performanceLevels}',
    creator             bigint                                  not null comment 'Creator user ID',
    updater             bigint                                  null comment 'Updater user ID',
    create_time         datetime      default CURRENT_TIMESTAMP null comment 'Creation timestamp',
    update_time         datetime      default CURRENT_TIMESTAMP null on update CURRENT_TIMESTAMP comment 'Last update timestamp',
    is_released         tinyint(1)    default 0                 not null,
    released_at         datetime                                null,
    results_released    tinyint(1)    default 0                 null comment 'Whether results are released to students',
    results_released_at datetime                                null comment 'When results were released to students',
    constraint fk_assignment_subject
        foreign key (subject_id) references subject (subject_id)
            on delete cascade
)
    comment 'Assignment table' collate = utf8mb4_unicode_ci;

create index idx_assignment_results_released
    on assignment (results_released);

create index idx_assignment_subject
    on assignment (subject_id);

create index idx_subject_active
    on subject (is_active);

create index idx_subject_admin
    on subject (admin_user_id);

create index idx_subject_code
    on subject (subject_code);

create index idx_subject_semester
    on subject (semester);

create index idx_subject_status
    on subject (status);

create index idx_subject_year
    on subject (academic_year);

create table sys_admin
(
    user_id             bigint        not null
        primary key,
    department          varchar(100)  null,
    token               varchar(255)  null,
    courses_managed     int default 0 null,
    students_managed    int default 0 null,
    assignments_created int default 0 null
);

create index sys_admin_token_index
    on sys_admin (token);

create table sys_examiner
(
    user_id     bigint unsigned not null
        primary key,
    token       varchar(255)    null,
    sis_user_id varchar(64)     null,
    department  varchar(128)    null,
    constraint uk_sys_examiner_sis_user_id
        unique (sis_user_id),
    constraint uk_sys_examiner_token
        unique (token)
)
    collate = utf8mb4_general_ci;

create table sys_group
(
    group_id        bigint auto_increment
        primary key,
    group_name      varchar(100) not null,
    canvas_group_id varchar(50)  null,
    create_time     datetime     null,
    creator         bigint       null,
    assignment_id   bigint       null comment 'related assignment ID',
    constraint canvas_group_id
        unique (canvas_group_id)
);

create table sys_oper_log
(
    oper_id        bigint auto_increment comment 'Log ID'
        primary key,
    title          varchar(50)   default '' null comment 'Module title',
    business_type  int           default 0  null comment 'Business type (0=Other,1=Insert,2=Update,3=Delete,4=Query,5=Grant,6=Export,7=Import,8=Booking,9=Cancel Booking,10=Assessment,11=Feedback)',
    method         varchar(100)  default '' null comment 'Method name',
    request_method varchar(10)   default '' null comment 'Request method',
    operator_type  int           default 0  null comment 'Operator type (0=Other,1=Admin,2=Examiner,3=Student,4=Super Admin)',
    oper_name      varchar(50)   default '' null comment 'Operator name',
    oper_role      varchar(50)   default '' null comment 'Operator role',
    oper_url       varchar(255)  default '' null comment 'Request URL',
    oper_ip        varchar(128)  default '' null comment 'Operator IP',
    oper_location  varchar(255)  default '' null comment 'Operation location',
    oper_param     varchar(2000) default '' null comment 'Request parameters',
    json_result    varchar(2000) default '' null comment 'Response result',
    status         int           default 0  null comment 'Status (0=Normal,1=Exception)',
    error_msg      varchar(2000) default '' null comment 'Error message',
    oper_time      datetime                 null comment 'Operation time',
    cost_time      bigint        default 0  null comment 'Execution time (ms)',
    trace_id       varchar(64)   default '' null comment 'Trace ID for request tracking'
)
    comment 'Operation log table';

create index idx_sys_oper_log_bt
    on sys_oper_log (business_type);

create index idx_sys_oper_log_ot
    on sys_oper_log (oper_time);

create index idx_sys_oper_log_s
    on sys_oper_log (status);

create index idx_sys_oper_log_tid
    on sys_oper_log (trace_id);

-- email notification outbox queue
create table email_notification_queue
(
    id            bigint auto_increment primary key,
    type          varchar(64)                           not null comment 'Notification type, e.g., SCHEDULE_RELEASE_STUDENT/EXAMINER',
    to_user_id    bigint                                null comment 'Recipient user id (optional)',
    to_email      varchar(255)                          null comment 'Recipient email address',
    payload_json  json                                  not null comment 'Parameters required to build the email (assignmentId, courseName, assignmentName, message, etc.)',
    status        varchar(16) default 'PENDING'         not null comment 'PENDING|PROCESSING|SENT|FAILED',
    attempts      int          default 0                not null comment 'Send attempts',
    last_error    text                                   null comment 'Last error message',
    scheduled_at  datetime                              null comment 'When to deliver; null means immediately',
    sent_at       datetime                              null comment 'When sent successfully',
    dedup_key     varchar(128)                          null comment 'Optional de-duplication key',
    created_at    datetime     default CURRENT_TIMESTAMP not null,
    updated_at    datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint uk_email_notification_dedup unique (dedup_key)
);

create index idx_email_notification_status_scheduled
    on email_notification_queue (status, scheduled_at);

create table sys_refresh_token
(
    id          bigint auto_increment
        primary key,
    user_id     bigint               not null,
    token       varchar(255)         not null,
    expiry_time datetime             not null,
    issued_time datetime             not null,
    revoked     tinyint(1) default 0 null,
    constraint idx_token
        unique (token)
)
    comment 'refresh_token';

create index idx_user_id
    on sys_refresh_token (user_id);

create table sys_role
(
    role_id     bigint auto_increment
        primary key,
    role_name   varchar(50) not null,
    role_key    varchar(50) not null,
    create_time datetime    null,
    creator     bigint      null,
    update_time datetime    null,
    updater     bigint      null,
    constraint role_key
        unique (role_key),
    constraint role_name
        unique (role_name)
);

create table sys_student
(
    user_id        bigint       not null
        primary key,
    token          varchar(255) null,
    student_number varchar(50)  null,
    sis_user_id    varchar(128) null,
    constraint sis_user_id
        unique (sis_user_id),
    constraint student_number
        unique (student_number)
);

create index sys_student_token_index
    on sys_student (token);

create table sys_student_group
(
    user_id  bigint not null,
    group_id bigint not null,
    primary key (user_id, group_id)
);

create index group_id
    on sys_student_group (group_id);

create table sys_user
(
    user_id             bigint auto_increment
        primary key,
    user_name           varchar(50)      not null,
    email               varchar(255)     not null,
    department          varchar(255)     null,
    password            varchar(100)     not null,
    status              char default '0' null comment '0 normal 1 ban',
    create_time         datetime         null,
    creator             bigint           null,
    update_time         datetime         null,
    updater             bigint           null,
    invited_at          datetime         null comment 'Invitation time',
    registered_at       datetime         null comment 'Registration time',
    last_login_at       datetime         null comment 'Last login time',
    registration_status char default '0' null,
    constraint sys_email
        unique (email)
);

create table sys_user_role
(
    user_id bigint not null,
    role_id bigint not null,
    primary key (user_id, role_id)
);

create table time_slot_examiners
(
    slot_id     bigint                             not null,
    examiner_id bigint                             not null,
    assigned_at datetime default CURRENT_TIMESTAMP not null,
    assigned_by bigint                             null,
    primary key (slot_id, examiner_id)
);

create index idx_examiner_slots
    on time_slot_examiners (examiner_id, slot_id);

create table time_slots
(
    slot_id            bigint auto_increment
        primary key,
    assignment_id      bigint                                                                         not null,
    slot_date          date                                                                           not null,
    start_at           datetime                                                                       not null,
    end_at             datetime                                                                       not null,
    venue_id           bigint                                                                         not null,
    session_count      int                                                                            not null,
    required_examiners int                                                                            not null,
    status             enum ('draft', 'empty', 'partial', 'full', 'closed') default 'empty'           not null,
    current_examiners  int                                                  default 0                 not null,
    booked_sessions    int                                                  default 0                 not null,
    booking_open       tinyint(1)                                           default 0                 not null,
    created_at         datetime                                             default CURRENT_TIMESTAMP not null,
    updated_at         datetime                                             default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    version            int                                                  default 0                 not null
);

create index idx_ts_assignment_date
    on time_slots (assignment_id, slot_date);

create index idx_ts_status
    on time_slots (assignment_id, status);

create index idx_ts_timewin
    on time_slots (start_at, end_at);

create table transaction_log
(
    id             bigint auto_increment
        primary key,
    transaction_id varchar(64)                         not null,
    create_time    timestamp default CURRENT_TIMESTAMP null,
    token          varchar(255)                        null,
    constraint transaction_id
        unique (transaction_id)
);

create table user_notification_preferences
(
    user_id            bigint                               not null
        primary key,
    email_enabled      tinyint(1) default 1                 not null,
    desktop_enabled    tinyint(1) default 0                 not null,
    booking_updates    tinyint(1) default 1                 not null,
    examiner_updates   tinyint(1) default 1                 not null,
    assignment_updates tinyint(1) default 1                 not null,
    result_updates     tinyint(1) default 1                 not null,
    group_updates      tinyint(1) default 1                 not null,
    system_alerts      tinyint(1) default 1                 not null,
    updated_at         datetime   default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP,
    constraint fk_user_prefs_user
        foreign key (user_id) references sys_user (user_id)
            on delete cascade
);

create table user_profile
(
    user_id      bigint                                    not null
        primary key,
    full_name    varchar(120)                              null,
    department   varchar(120)                              null,
    phone        varchar(32)                               null,
    timezone     varchar(60) default 'Australia/Melbourne' not null,
    language     varchar(10) default 'en'                  not null,
    completeness int         default 0                     not null,
    created_at   datetime    default CURRENT_TIMESTAMP     not null,
    updated_at   datetime    default CURRENT_TIMESTAMP     not null on update CURRENT_TIMESTAMP,
    constraint fk_user_profile_user
        foreign key (user_id) references sys_user (user_id)
            on delete cascade
);

create table venue
(
    id            bigint unsigned auto_increment
        primary key,
    room_name     varchar(255) not null,
    assignment_id bigint       null
);
