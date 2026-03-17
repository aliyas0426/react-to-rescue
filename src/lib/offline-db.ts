import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'disaster-mgmt-offline';
const DB_VERSION = 1;

interface OfflineReport {
  id: string;
  title: string;
  description: string;
  disaster_type: string;
  severity: string;
  location_lat: number;
  location_lng: number;
  location_name?: string;
  image_data?: string; // base64
  created_at: string;
  synced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_reports')) {
          const store = db.createObjectStore('offline_reports', { keyPath: 'id' });
          store.createIndex('synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineReport(report: Omit<OfflineReport, 'synced'>) {
  const db = await getDB();
  await db.put('offline_reports', { ...report, synced: false });
}

export async function getUnsyncedReports(): Promise<OfflineReport[]> {
  const db = await getDB();
  return db.getAllFromIndex('offline_reports', 'synced', false);
}

export async function markReportSynced(id: string) {
  const db = await getDB();
  const report = await db.get('offline_reports', id);
  if (report) {
    report.synced = true;
    await db.put('offline_reports', report);
  }
}

export async function getAllOfflineReports(): Promise<OfflineReport[]> {
  const db = await getDB();
  return db.getAll('offline_reports');
}

export async function deleteOfflineReport(id: string) {
  const db = await getDB();
  await db.delete('offline_reports', id);
}
