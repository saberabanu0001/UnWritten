CREATE DATABASE IF NOT EXISTS unwritten;
USE unwritten;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    is_guest BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'My Unwritten Book',
    description TEXT,
    cover_style VARCHAR(50) DEFAULT 'classic',
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36) NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255),
    raw_input TEXT NOT NULL,
    input_method ENUM('text', 'voice') DEFAULT 'text',
    language VARCHAR(10) DEFAULT 'en',
    followup_question TEXT,
    followup_answer TEXT,
    scene_data JSON,
    prose TEXT,
    pull_quote TEXT,
    image_prompt TEXT,
    is_sealed BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapter_images (
    id VARCHAR(36) PRIMARY KEY,
    chapter_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500),
    image_data LONGBLOB,
    style VARCHAR(50) DEFAULT 'ink_sketch',
    width INT DEFAULT 400,
    height INT DEFAULT 350,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapters_book ON chapters(book_id, sort_order);
CREATE INDEX idx_books_user ON books(user_id);
