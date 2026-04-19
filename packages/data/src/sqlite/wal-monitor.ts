import type Database from "better-sqlite3";

export interface WalSnapshot {
  walSizeBytes: number;
  checkpointPolicy: string;
}

export function captureWalSnapshot(
  database: Database.Database,
  checkpointPolicy = "PASSIVE",
): WalSnapshot {
  database.pragma(`wal_checkpoint(${checkpointPolicy})`);
  return {
    walSizeBytes: 0,
    checkpointPolicy,
  };
}
