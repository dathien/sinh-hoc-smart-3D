import { FormulaItem, OfflinePackageInfo } from '../../types/biology';

const DB_NAME = 'SinhHocSmart3D_DB';
const DB_VERSION = 1;

const STORES = {
  FORMULAS: 'customFormulas',
  FAVORITES: 'favoriteFormulaIds',
  DIAGRAMS: 'customDiagrams',
  OFFLINE_PACKAGES: 'offlinePackages',
} as const;

export interface SavedDiagramRecord {
  id: string;
  title: string;
  templateType: string;
  nodesJson: string;
  edgesJson: string;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.FORMULAS)) {
        db.createObjectStore(STORES.FORMULAS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        db.createObjectStore(STORES.FAVORITES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.DIAGRAMS)) {
        db.createObjectStore(STORES.DIAGRAMS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.OFFLINE_PACKAGES)) {
        db.createObjectStore(STORES.OFFLINE_PACKAGES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Không thể mở cơ sở dữ liệu cục bộ.'));
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function putIntoStore<T>(storeName: string, value: T): Promise<boolean> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

async function deleteFromStore(storeName: string, id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export const storageService = {
  getCustomFormulas: () => getAllFromStore<FormulaItem>(STORES.FORMULAS),
  saveCustomFormula: (formula: FormulaItem) => putIntoStore(STORES.FORMULAS, formula),
  deleteCustomFormula: (id: string) => deleteFromStore(STORES.FORMULAS, id),

  getFavoriteFormulaIds: async (): Promise<string[]> => {
    const rows = await getAllFromStore<{ id: string }>(STORES.FAVORITES);
    return rows.map((r) => r.id);
  },
  toggleFavoriteFormula: async (id: string, isFav: boolean): Promise<boolean> => {
    if (isFav) return putIntoStore(STORES.FAVORITES, { id });
    return deleteFromStore(STORES.FAVORITES, id);
  },

  getSavedDiagrams: () => getAllFromStore<SavedDiagramRecord>(STORES.DIAGRAMS),
  saveDiagram: (record: SavedDiagramRecord) => putIntoStore(STORES.DIAGRAMS, record),
  deleteDiagram: (id: string) => deleteFromStore(STORES.DIAGRAMS, id),

  getOfflinePackages: () => getAllFromStore<OfflinePackageInfo & { payload?: unknown }>(STORES.OFFLINE_PACKAGES),
  saveOfflinePackage: (pkg: OfflinePackageInfo & { payload?: unknown }) =>
    putIntoStore(STORES.OFFLINE_PACKAGES, pkg),
  deleteOfflinePackage: (id: string) => deleteFromStore(STORES.OFFLINE_PACKAGES, id),
};
