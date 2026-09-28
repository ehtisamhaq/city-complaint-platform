--liquibase formatted sql

-- Baseline of the schema as it exists in the database.
--
-- This database predates Liquibase, so the tables already exist. Every change
-- below therefore carries a precondition: if its table is already present the
-- change is recorded as ran and no DDL is issued; if the table is absent the
-- CREATE runs normally. That means the same file serves both an existing
-- database (adopted) and a brand-new one (built from scratch) without needing
-- 'baseline-on-migrate', which Spring Boot 4 no longer supports.
--
-- The check queries information_schema rather than the table itself, so on a
-- fresh database it returns 0 and passes instead of erroring on a missing
-- relation. It is written to be portable so it also works on H2.
--
-- Column types, lengths, nullability and defaults are taken from the live
-- schema. Constraint names are deterministic here, unlike the random ones
-- Hibernate generated originally (ukmoq26usurebvbvt9i10oh2np9 and friends).
--
-- Primary keys are application-generated UUIDs (see @UuidGenerator on the
-- entities), so there are no sequences or identity columns to declare.
--
-- Caution when editing: this is a "formatted SQL" changelog, so the parser
-- reads a comment line that begins with a directive word (even with a space
-- after the dashes, as in "-- changeset") as that directive rather than prose.

--changeset citycomplaints:1-citizens
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'citizens'
CREATE TABLE citizens (
    id         VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    full_name  VARCHAR(150) NOT NULL,
    phone      VARCHAR(20),
    address    VARCHAR(500),
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_citizens PRIMARY KEY (id),
    CONSTRAINT uk_citizens_email UNIQUE (email)
);
CREATE INDEX idx_citizen_email ON citizens (email);

--changeset citycomplaints:1-departments
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments'
CREATE TABLE departments (
    id         VARCHAR(255) NOT NULL,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    location   VARCHAR(300),
    phone      VARCHAR(20),
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_departments PRIMARY KEY (id),
    CONSTRAINT uk_departments_email UNIQUE (email),
    CONSTRAINT uk_departments_name  UNIQUE (name)
);
CREATE INDEX idx_department_name ON departments (name);

--changeset citycomplaints:1-staff
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff'
CREATE TABLE staff (
    id            VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(30)  NOT NULL,
    is_active     BOOLEAN      NOT NULL,
    department_id VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP    NOT NULL,
    CONSTRAINT pk_staff PRIMARY KEY (id),
    CONSTRAINT uk_staff_email UNIQUE (email),
    CONSTRAINT fk_staff_department FOREIGN KEY (department_id) REFERENCES departments (id)
);
CREATE INDEX idx_staff_email      ON staff (email);
CREATE INDEX idx_staff_department ON staff (department_id);

--changeset citycomplaints:1-complaints
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints'
CREATE TABLE complaints (
    id                 VARCHAR(255)  NOT NULL,
    title              VARCHAR(300)  NOT NULL,
    description        TEXT,
    category           VARCHAR(100)  NOT NULL,
    severity           VARCHAR(20)   NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    location_name      VARCHAR(500),
    latitude           DOUBLE PRECISION,
    longitude          DOUBLE PRECISION,
    photo_url          VARCHAR(1000),
    ai_summary         TEXT,
    suggested_category VARCHAR(100),
    object_type        VARCHAR(100),
    object_measurement VARCHAR(100),
    severity_score     DOUBLE PRECISION,
    resolution_notes   TEXT,
    resolved_at        TIMESTAMP,
    citizen_id         VARCHAR(255)  NOT NULL,
    department_id      VARCHAR(255),
    assigned_to_id     VARCHAR(255),
    endorse_count      INTEGER       NOT NULL DEFAULT 0,
    created_at         TIMESTAMP     NOT NULL,
    updated_at         TIMESTAMP     NOT NULL,
    CONSTRAINT pk_complaints PRIMARY KEY (id),
    CONSTRAINT fk_complaints_citizen    FOREIGN KEY (citizen_id)     REFERENCES citizens (id),
    CONSTRAINT fk_complaints_department FOREIGN KEY (department_id)  REFERENCES departments (id),
    CONSTRAINT fk_complaints_assignee   FOREIGN KEY (assigned_to_id) REFERENCES staff (id)
);
CREATE INDEX idx_complaint_status     ON complaints (status);
CREATE INDEX idx_complaint_severity   ON complaints (severity);
CREATE INDEX idx_complaint_department ON complaints (department_id);
CREATE INDEX idx_complaint_citizen    ON complaints (citizen_id);
CREATE INDEX idx_complaint_created_at ON complaints (created_at);

--changeset citycomplaints:1-feedbacks
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedbacks'
CREATE TABLE feedbacks (
    id           VARCHAR(255) NOT NULL,
    rating       INTEGER      NOT NULL,
    comment      TEXT,
    citizen_id   VARCHAR(255) NOT NULL,
    complaint_id VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP    NOT NULL,
    CONSTRAINT pk_feedbacks PRIMARY KEY (id),
    CONSTRAINT uk_feedbacks_complaint UNIQUE (complaint_id),
    CONSTRAINT fk_feedbacks_citizen   FOREIGN KEY (citizen_id)   REFERENCES citizens (id),
    CONSTRAINT fk_feedbacks_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (id)
);

--changeset citycomplaints:1-knowledge_articles
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_articles'
CREATE TABLE knowledge_articles (
    id         VARCHAR(255) NOT NULL,
    title      VARCHAR(300) NOT NULL,
    content    TEXT         NOT NULL,
    category   VARCHAR(100) NOT NULL,
    tags       VARCHAR(500),
    created_at TIMESTAMP    NOT NULL,
    updated_at TIMESTAMP    NOT NULL,
    CONSTRAINT pk_knowledge_articles PRIMARY KEY (id)
);
CREATE INDEX idx_knowledge_category ON knowledge_articles (category);
CREATE INDEX idx_knowledge_tags     ON knowledge_articles (tags);

--changeset citycomplaints:1-status_history
--preconditions onFail:MARK_RAN onError:HALT
--precondition-sql-check expectedResult:0 SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'status_history'
CREATE TABLE status_history (
    id           VARCHAR(255) NOT NULL,
    complaint_id VARCHAR(255) NOT NULL,
    status       VARCHAR(20)  NOT NULL,
    note         TEXT,
    changed_by   VARCHAR(255),
    created_at   TIMESTAMP    NOT NULL,
    CONSTRAINT pk_status_history PRIMARY KEY (id),
    CONSTRAINT fk_status_history_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (id)
);
CREATE INDEX idx_sh_complaint ON status_history (complaint_id);
