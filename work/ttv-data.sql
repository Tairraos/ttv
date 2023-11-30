DROP TABLE IF EXISTS "project";
CREATE TABLE 'project' (
    'projectid'     INTEGER NOT NULL DEFAULT 0,
    'lesson'        TEXT NOT NULL DEFAULT '',
    'theme'         TEXT NOT NULL DEFAULT '',
    'duration'      REAL NOT NULL DEFAULT 0,
    'stamp'         TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('projectid', 'lesson')
);

DROP TABLE IF EXISTS "material";
CREATE TABLE 'material' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'group'         INTEGER NOT NULL DEFAULT 0,
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'cn_male'       TEXT NOT NULL DEFAULT '', 
    'cn_female'     TEXT NOT NULL DEFAULT '', 
    'en_male'       TEXT NOT NULL DEFAULT '', 
    'en_female'     TEXT NOT NULL DEFAULT '', 
    'slide'         TEXT NOT NULL DEFAULT '', 
    'isready'       TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('id', 'lesson')
);

DROP TABLE IF EXISTS "archive";
CREATE TABLE 'archive' (
    'id'            INTEGER NOT NULL DEFAULT 0, 
    'lesson'        TEXT NOT NULL DEFAULT '',
    'type'          TEXT NOT NULL DEFAULT '',
    'chinese'       TEXT NOT NULL DEFAULT '',
    'english'       TEXT NOT NULL DEFAULT '', 
    'phonetic'      TEXT NOT NULL DEFAULT '', 
    'projectid'     TEXT NOT NULL DEFAULT '',
    PRIMARY KEY ('id', 'lesson')
);