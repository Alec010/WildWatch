-- Create badges tables

-- Badge table
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255),
    point_reward INTEGER NOT NULL,
    badge_type VARCHAR(50) NOT NULL,
    max_level INTEGER NOT NULL DEFAULT 3,
    CONSTRAINT uq_badge_name UNIQUE (name),
    CONSTRAINT uq_badge_type UNIQUE (badge_type)
);

-- Badge levels table
CREATE TABLE IF NOT EXISTS badge_levels (
    id SERIAL PRIMARY KEY,
    badge_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    requirement INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    CONSTRAINT fk_badge_level_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    CONSTRAINT uq_badge_level UNIQUE (badge_id, level)
);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id INTEGER NOT NULL,
    current_level INTEGER NOT NULL DEFAULT 0,
    current_progress INTEGER NOT NULL DEFAULT 0,
    level1_awarded_date TIMESTAMP,
    level2_awarded_date TIMESTAMP,
    level3_awarded_date TIMESTAMP,
    is_notified BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_user_badge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badge_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- Insert default badges
INSERT INTO badges (name, description, icon_url, point_reward, badge_type, max_level)
VALUES 
    ('First Responder', 'Submit your very first incident report', '/images/badges/first-responder.png', 10, 'FIRST_RESPONDER', 3),
    ('Community Helper', 'Receive upvotes on your incident reports', '/images/badges/community-helper.png', 75, 'COMMUNITY_HELPER', 3),
    ('Campus Legend', 'Achieve and maintain Gold rank', '/images/badges/campus-legend.png', 150, 'CAMPUS_LEGEND', 3);

-- Insert badge levels
-- First Responder badge levels
INSERT INTO badge_levels (badge_id, level, requirement, description)
VALUES 
    (1, 1, 1, 'Submit 1 incident report'),
    (1, 2, 3, 'Submit 3 incident reports'),
    (1, 3, 5, 'Submit 5 incident reports');

-- Community Helper badge levels
INSERT INTO badge_levels (badge_id, level, requirement, description)
VALUES 
    (2, 1, 25, 'Receive 25 upvotes'),
    (2, 2, 50, 'Receive 50 upvotes'),
    (2, 3, 100, 'Receive 100 upvotes');

-- Campus Legend badge levels
INSERT INTO badge_levels (badge_id, level, requirement, description)
VALUES 
    (3, 1, 100, 'Achieve Bronze rank (100 points)'),
    (3, 2, 200, 'Achieve Silver rank (200 points)'),
    (3, 3, 300, 'Achieve Gold rank (300 points)');

-- Create index for faster badge lookups
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_badge_levels_badge_id ON badge_levels(badge_id);




