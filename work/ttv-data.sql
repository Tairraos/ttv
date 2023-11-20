DROP TABLE IF EXISTS "project";
CREATE TABLE 'project' (
    'projectid' TEXT PRIMARY KEY,
    'lesson'    TEXT NOT NULL DEFAULT 'chinese',
    'duration'  REAL NOT NULL DEFAULT 0,
    'stamp'     TEXT NOT NULL DEFAULT ''
);

DROP TABLE IF EXISTS "material";
CREATE TABLE 'material' (
    'id'        INTEGER PRIMARY KEY, 
    'type'      TEXT NOT NULL DEFAULT 'sentence',
    'group'     INTEGER NOT NULL DEFAULT 0,
    'chinese'   TEXT NOT NULL DEFAULT '',
    'english'   TEXT NOT NULL DEFAULT '', 
    'phonetic'  TEXT NOT NULL DEFAULT '', 
    'cn_male'   TEXT NOT NULL DEFAULT '', 
    'cn_female' TEXT NOT NULL DEFAULT '', 
    'en_male'   TEXT NOT NULL DEFAULT '', 
    'en_female' TEXT NOT NULL DEFAULT '', 
    'slide'     TEXT NOT NULL DEFAULT '', 
    'isready'   TEXT NOT NULL DEFAULT ''
);


DROP TABLE IF EXISTS "'id'，'type'，'group'，'chinese'，'english'，'phonetic'，";
CREATE TABLE 'archive' (
    'id'        INTEGER PRIMARY KEY, 
    'type'      TEXT NOT NULL DEFAULT 'sentence',
    'group'     INTEGER NOT NULL DEFAULT 0,
    'chinese'   TEXT NOT NULL DEFAULT '',
    'english'   TEXT NOT NULL DEFAULT '', 
    'phonetic'  TEXT NOT NULL DEFAULT '', 
    'projectid' TEXT NOT NULL DEFAULT ''
);


