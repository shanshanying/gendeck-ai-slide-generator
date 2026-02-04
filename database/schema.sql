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

-- Slide history table: Stores all historical versions of slides
CREATE TABLE IF NOT EXISTS slide_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    slide_index INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_points TEXT[],
    html_content TEXT,
    notes TEXT,
    layout_suggestion VARCHAR(100),
    version INTEGER NOT NULL,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    saved_by VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slides_deck_id ON slides(deck_id);
CREATE INDEX IF NOT EXISTS idx_slides_slide_index ON slides(slide_index);
CREATE INDEX IF NOT EXISTS idx_slides_current ON slides(deck_id, slide_index, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_slide_history_slide_id ON slide_history(slide_id);
CREATE INDEX IF NOT EXISTS idx_slide_history_deck_id ON slide_history(deck_id);
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

-- Trigger to save slide history when slide is updated
CREATE OR REPLACE FUNCTION save_slide_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only save history if content actually changed
    IF OLD.html_content IS DISTINCT FROM NEW.html_content OR
       OLD.title IS DISTINCT FROM NEW.title OR
       OLD.content_points IS DISTINCT FROM NEW.content_points THEN
        
        INSERT INTO slide_history (
            slide_id, deck_id, slide_index, title, content_points,
            html_content, notes, layout_suggestion, version
        ) VALUES (
            OLD.id, OLD.deck_id, OLD.slide_index, OLD.title, OLD.content_points,
            OLD.html_content, OLD.notes, OLD.layout_suggestion, OLD.version
        );
        
        -- Increment version
        NEW.version = OLD.version + 1;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_save_slide_history ON slides;
CREATE TRIGGER trigger_save_slide_history
    BEFORE UPDATE ON slides
    FOR EACH ROW
    EXECUTE FUNCTION save_slide_history();
