import database from "./model.js";

const addApprovedUser = database.prepare(`
  INSERT INTO approved_users (discord_id)
  VALUES (?)
  RETURNING discord_id
`);

const getApprovedUsers = database.prepare(`
  SELECT * FROM approved_users WHERE discord_id = ?
`);

export { addApprovedUser, getApprovedUsers };
