----------- Check pour automatiser ça avec Python, pour init la DB au lancement et pas juste mettre dans DBeaver manuellement

-- Activer PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;






-------- TABLES POUR LES DONNEES GEOSPATIALES --------

-- Table: Projets/Simulations (Neuville, Québec..)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: Couches de données/layers
CREATE TABLE IF NOT EXISTS layers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50), -- 'velocity', 'temperature', etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Points géospatiaux + propriétés
CREATE TABLE IF NOT EXISTS geo_points (
    id SERIAL PRIMARY KEY,
    layer_id INTEGER REFERENCES layers(id) ON DELETE CASCADE,
    -- Géométrie PostGIS : point avec coordonnées
    geom GEOMETRY(Point, 4326) NOT NULL,
    -- Propriétés du point (velocity, temp...)
    properties JSONB,
    -- Timestamp pour animation temporelle
    timestamp TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index spatial pour accélérer les requêtes géo
CREATE INDEX IF NOT EXISTS idx_geo_points_geom ON geo_points USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_geo_points_layer ON geo_points(layer_id);
CREATE INDEX IF NOT EXISTS idx_geo_points_timestamp ON geo_points(timestamp);







------- TABLES POUR LES USERS (Auth0) ----------

-- Table: Utilisateurs (infos provenant d'Auth0)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL, -- ID unique d'Auth0
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    picture TEXT, -- URL de la photo
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);





------ TABLES POUR LES JEUX/DÉFIS ----------

-- Table: Défis disponibles
CREATE TABLE IF NOT EXISTS defis (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    game_type VARCHAR(50), -- 'depollue', 'findValue' et à voir
    difficulty VARCHAR(20), -- 'easy', 'medium', 'hard' ?
    max_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: Sessions de jeu (quand un user joue à un défi)
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    defi_id INTEGER REFERENCES defis(id) ON DELETE CASCADE,
    score INTEGER,
    time_spent INTEGER, -- en secondes
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Table: Records persos
CREATE TABLE IF NOT EXISTS user_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    defi_id INTEGER REFERENCES defis(id) ON DELETE CASCADE,
    best_score INTEGER,
    best_time INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, defi_id) -- 1 seul record par user par défi
);




------- TABLES POUR LES STATS UTILISATEUR -----------

-- Table: Stats globales par user
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_play_time INTEGER DEFAULT 0, -- en secondes
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);




-------------- VUES UTILES -------------

-- Vue: Classement global par défi, à check après
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    d.id as defi_id,
    d.title as defi_title,
    u.name as user_name,
    ur.best_score,
    ur.best_time,
    RANK() OVER (PARTITION BY d.id ORDER BY ur.best_score DESC) as rank
FROM user_records ur
JOIN users u ON ur.user_id = u.id
JOIN defis d ON ur.defi_id = d.id;





------------ DONNEES INIT ------------


-- Insertion des projets existants
INSERT INTO projects (name, location, description) VALUES
('Neuville', 'Saint Laurent', 'Simulation de Neuville'),
('Saint-Jean-Port-Joli', 'Saint Laurent', 'Simulation de Saint-Jean-Port-Joli'),
('Saint-Bernard-sur-Mer', 'Saint Laurent', 'Simulation de Saint-Bernard-sur-Mer'),
('Beaupré', 'Saint Laurent', 'Simulation de Beaupré'),
('Québec', 'Saint Laurent', 'Simulation de Québec'),
('Saint Rédempteur', 'Rivière Thaudière', 'Simulation de Saint Rédempteur'),
('Innondation 132', 'Rivière Ouelle', 'Simulation Innondation 132')
ON CONFLICT DO NOTHING;

-- Insertion des défis
INSERT INTO defis (title, description, game_type, difficulty, max_score) VALUES
('Dépolue ton Saint Laurent', 'Collecte les éléments nocifs qui menacent l''écosystème', 'depollue', 'medium', 100000),
('Trouve la valeur', 'Identifie l''endroit où une valeur est présente', 'trouve_valeur', 'medium', 100000)
ON CONFLICT DO NOTHING;



-------- VERIF : Afficher les tables créées -------------

SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;