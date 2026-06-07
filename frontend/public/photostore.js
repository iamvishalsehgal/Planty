/* IndexedDB-backed photo storage for Planty.
   Moves photos out of localStorage to avoid the 5MB limit.
   API: photoStore.init(), .savePhoto(), .getPhotos(), .deletePhoto(), .getStorageUsed() */

const photoStore = (() => {
  const DB_NAME = 'planty-photos';
  const DB_VERSION = 1;
  let db = null;

  async function init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          const store = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
          store.createIndex('plantId', 'plantId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(); };
      req.onerror = () => reject(req.error);
    });
  }

  async function savePhoto(plantId, base64data, caption = '') {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const record = { plantId, data: base64data, date: new Date().toISOString(), caption };
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotos(plantId) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const idx = store.index('plantId');
      const req = idx.getAll(plantId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function deletePhoto(id) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function getStorageUsed() {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      let bytes = 0;
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) { bytes += (cursor.value.data || '').length; cursor.continue(); }
        else { resolve(bytes); }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function getPhotoCount(plantId) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const idx = store.index('plantId');
      const req = idx.count(plantId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  return { init, savePhoto, getPhotos, deletePhoto, getStorageUsed, getPhotoCount };
})();
