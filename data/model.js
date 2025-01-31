import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(`${import.meta.dirname}/main.db`);

const initDatabase = `
CREATE TABLE IF NOT EXISTS approved_users (
    discord_id TEXT,
    permission INTEGER DEFAULT 0 
);
`;

database.exec(initDatabase);

export default database;
