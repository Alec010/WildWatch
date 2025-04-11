CREATE TABLE IF NOT EXISTS office_admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    office_name VARCHAR(255) NOT NULL,
    office_code VARCHAR(50) NOT NULL UNIQUE,
    office_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 