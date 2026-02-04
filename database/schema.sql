-- GenDeck Database Schema
-- Run this to set up your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Decks table: Stores presentation metadata
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(500) NOT NULL,
    audience VARCHAR(255),
    purpose VARCHAR(255),
    color_palette VARCHAR(255),
    slide_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    full_html TEXT, -- Complete deck HTML for export
    document_content TEXT, -- Original input text
    outline_provider VARCHAR(50), -- e.g., 'google'
    outline_model VARCHAR(100), -- e.g., 'gemini-3-flash-preview'
    outline_base_url VARCHAR(500), -- e.g., 'https://api.openai.com/v1' (optional, for custom endpoints)
    slides_provider VARCHAR(50), -- e.g., 'openai'
    slides_model VARCHAR(100), -- e.g., 'gpt-4o'
    slides_base_url VARCHAR(500), -- e.g., 'https://api.deepseek.com' (optional, for custom endpoints)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) -- Optional: for multi-user support
);

-- Slides table: Stores individual slide versions
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    slide_index INTEGER NOT NULL, -- Position in deck (0, 1, 2...)
    title VARCHAR(500) NOT NULL,
    content_points TEXT[], -- Array of content points
    html_content TEXT, -- Full HTML content
    notes TEXT, -- Speaker notes
    layout_suggestion VARCHAR(100),
    version INTEGER DEFAULT 1, -- Version number for this slide
    is_current BOOLEAN DEFAULT true, -- Is this the current version
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deck history table: Stores all historical versions of full decks
CREATE TABLE IF NOT EXISTS deck_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    topic VARCHAR(500) NOT NULL,
    full_html TEXT, -- Complete deck HTML
    outline JSONB, -- Outline structure for editing
    color_palette VARCHAR(255),
    version INTEGER NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    saved_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slides_deck_id ON slides(deck_id);
CREATE INDEX IF NOT EXISTS idx_slides_slide_index ON slides(slide_index);
CREATE INDEX IF NOT EXISTS idx_slides_current ON slides(deck_id, slide_index, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_deck_history_deck_id ON deck_history(deck_id);
CREATE INDEX IF NOT EXISTS idx_decks_created_at ON decks(created_at DESC);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_decks_updated_at ON decks;
CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slides_updated_at ON slides;
CREATE TRIGGER update_slides_updated_at
    BEFORE UPDATE ON slides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Slide-level history removed. History is now tracked at deck level.
