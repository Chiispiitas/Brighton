(() => {
  "use strict";

  const databaseName = "brighton-placement-recordings";
  const storeName = "pending";
  const maxAge = 60 * 60 * 1000;
  let connection;

  function openDatabase() {
    if (connection) return connection;
    connection = new Promise((resolve) => {
      let expired = false;
      const timer = window.setTimeout(() => {
        expired = true;
        resolve(null);
      }, 2500);
      try {
        const request = window.indexedDB.open(databaseName, 1);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore(storeName, { keyPath: "key" });
          store.createIndex("savedAt", "savedAt");
        };
        request.onerror = () => {
          window.clearTimeout(timer);
          resolve(null);
        };
        request.onsuccess = () => {
          window.clearTimeout(timer);
          const db = request.result;
          if (expired) { db.close(); return; }
          db.onversionchange = () => { db.close(); connection = null; };
          resolve(db);
        };
      } catch {
        window.clearTimeout(timer);
        resolve(null);
      }
    }).then(db => {
      if (!db) connection = null;
      return db;
    });
    return connection;
  }

  async function transaction(mode, action) {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise(resolve => {
      let tx;
      let request;
      let timer;
      try {
        tx = db.transaction(storeName, mode);
        timer = window.setTimeout(() => {
          try { tx.abort(); } catch {}
          resolve(null);
        }, 5000);
        tx.onabort = tx.onerror = () => { window.clearTimeout(timer); resolve(null); };
        tx.oncomplete = () => { window.clearTimeout(timer); resolve(request?.result ?? true); };
        request = action(tx.objectStore(storeName));
      } catch {
        window.clearTimeout(timer);
        resolve(null);
      }
    });
  }

  function remove(key) {
    if (key) return transaction("readwrite", store => {
      store.delete(key + ":progress");
      return store.delete(key);
    });
  }

  window.BrightonSpeakingDrafts = {
    async save(record) {
      if (await transaction("readwrite", store => store.put(record))) return true;
      // Some browsers can persist ArrayBuffers but reject cloning a Blob.
      try {
        const {blob, ...metadata} = record;
        const bytes = await blob.arrayBuffer();
        return Boolean(await transaction("readwrite", store => store.put({...metadata, bytes})));
      } catch { return false; }
    },
    checkpoint(key, uploadId, nextChunk) {
      return transaction("readwrite", store => store.put({
        key: key + ":progress", uploadId, nextChunk, savedAt: Date.now()
      }));
    },
    async read(key) {
      if (!key) return null;
      const record = await transaction("readonly", store => store.get(key));
      if (record?.bytes) {
        record.blob = new Blob([record.bytes], {type:record.metrics.audioMimeType});
        delete record.bytes;
      }
      if (!record?.blob?.size) return null;
      if (Date.now() - record.savedAt >= maxAge) {
        await remove(key);
        return null;
      }
      const progress = await transaction("readonly", store => store.get(key + ":progress"));
      record.nextChunk = progress?.uploadId === record.uploadId ? progress.nextChunk : 0;
      record.persisted = true;
      return record;
    },
    remove
  };

  // A browser can close before the usual result or expiry cleanup runs.
  transaction("readwrite", store => {
    const range = IDBKeyRange.upperBound(Date.now() - maxAge);
    const request = store.index("savedAt").openKeyCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      store.delete(cursor.primaryKey);
      cursor.continue();
    };
  });
})();
