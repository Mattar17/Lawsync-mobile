import * as SQLite from "expo-sqlite";
import { CaseT } from "./types";

const dbPromise = SQLite.openDatabaseAsync("lawsync");

export const CreateCasesTable = async function () {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      case_number TEXT NOT NULL,
      case_year TEXT NOT NULL,

      client_name TEXT NOT NULL,
      client_opponent_name TEXT NOT NULL,

      client_role TEXT,
      client_opponent_role TEXT,

      client_national_id TEXT,
      client_opponent_national_id TEXT,

      latest_court_session_date TEXT,
      next_court_session_date TEXT,

      case_status TEXT,

      case_notes TEXT,

      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const getAllCases = async function () {
  const db = await dbPromise;
  const result = await db.getAllAsync(`SELECT * FROM cases`);
  return result;
};

export async function dropTableCases() {
  const db = await dbPromise;

  await db.runAsync(`DROP TABLE cases`);

  console.log("DONE!!!");
}

export async function createCase(caseDetails: CaseT) {
  const db = await dbPromise;

  const result = await db.runAsync(
    `
    INSERT INTO cases (
      case_number,
      case_year,
      client_name,
      client_opponent_name,
      client_role,
      client_opponent_role,
      client_national_id,
      client_opponent_national_id,
      latest_court_session_date,
      next_court_session_date,
      case_status,
      case_notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      caseDetails.case_number,
      caseDetails.case_year,

      caseDetails.client_name,
      caseDetails.client_opponent_name,

      caseDetails.client_role,
      caseDetails.client_opponent_role,

      caseDetails.client_national_id,
      caseDetails.client_opponent_national_id,

      caseDetails.latest_court_session_date,
      caseDetails.next_court_session_date,

      caseDetails.case_status,
      caseDetails.case_notes,
    ],
  );

  return result.lastInsertRowId;
}

export async function getCaseById(id: string) {
  const db = await dbPromise;
  const result = db.getFirstAsync<CaseT>(
    `SELECT * FROM cases WHERE case_number = ?`,
    [id],
  );
  return result;
}

export async function updateCase(id: string, data: CaseT) {
  const db = await dbPromise;

  return await db.runAsync(
    `UPDATE cases
     SET
       case_year = ?,
       client_name = ?,
       client_opponent_name = ?,
       client_role = ?,
       client_opponent_role = ?,
       client_national_id = ?,
       client_opponent_national_id = ?,
       latest_court_session_date = ?,
       next_court_session_date = ?,
       case_status = ?,
       case_notes = ?
     WHERE case_number = ?`,
    [
      data.case_year,
      data.client_name,
      data.client_opponent_name,
      data.client_role,
      data.client_opponent_role,
      data.client_national_id,
      data.client_opponent_national_id,
      data.latest_court_session_date,
      data.next_court_session_date,
      data.case_status,
      data.case_notes,
      id,
    ],
  );
}

export async function deleteCase(id: string) {
  const db = await dbPromise;
  const result = db.runAsync(
    `DELETE FROM cases
     WHERE case_number = ?`,
    [id],
  );
  return result;
}
