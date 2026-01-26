/**
 * IndexedDB 存储模块 - 电影海报墙数据持久化
 * 
 * 优势：
 * - 支持更大的存储容量（通常 50MB+，远超 localStorage 的 5-10MB）
 * - 异步操作，不阻塞主线程
 * - 支持事务，数据更安全
 * - 更适合存储大量图片 base64 数据
 */

const DB_NAME = 'CyberPosterWall';
const DB_VERSION = 1;
const STORE_NAME = 'posters';

let dbInstance = null;

/**
 * 打开/初始化数据库连接
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB connected');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 创建 posters 对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('year', 'year', { unique: false });
        console.log('📦 IndexedDB store created');
      }
    };
  });
}

/**
 * 获取所有海报
 */
export async function getAllPosters() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('❌ Failed to get posters:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ getAllPosters error:', err);
    return [];
  }
}

/**
 * 保存单个海报（新增或更新）
 */
export async function savePoster(poster) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(poster);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Failed to save poster:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ savePoster error:', err);
    return false;
  }
}

/**
 * 批量保存海报（全量替换）
 * 先清空再批量插入，确保数据一致性
 */
export async function saveAllPosters(posters) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // 先清空
      store.clear();

      // 批量插入
      posters.forEach((poster) => {
        store.put(poster);
      });

      transaction.oncomplete = () => {
        console.log(`✅ Saved ${posters.length} posters to IndexedDB`);
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('❌ Failed to save posters:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (err) {
    console.error('❌ saveAllPosters error:', err);
    return false;
  }
}

/**
 * 删除单个海报
 */
export async function deletePoster(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`🗑️ Deleted poster: ${id}`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Failed to delete poster:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ deletePoster error:', err);
    return false;
  }
}

/**
 * 清空所有数据
 */
export async function clearAllPosters() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 All posters cleared from IndexedDB');
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Failed to clear posters:', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ clearAllPosters error:', err);
    return false;
  }
}

/**
 * 从 localStorage 迁移数据到 IndexedDB（一次性迁移）
 */
export async function migrateFromLocalStorage(lsKey) {
  try {
    const raw = localStorage.getItem(lsKey);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;

    // 检查 IndexedDB 是否已有数据
    const existing = await getAllPosters();
    if (existing.length > 0) {
      console.log('ℹ️ IndexedDB already has data, skipping migration');
      return false;
    }

    // 迁移数据
    await saveAllPosters(parsed);
    console.log(`✅ Migrated ${parsed.length} posters from localStorage to IndexedDB`);
    
    // 迁移成功后清除 localStorage
    localStorage.removeItem(lsKey);
    console.log('🧹 Cleared old localStorage data');
    
    return true;
  } catch (err) {
    console.error('❌ Migration failed:', err);
    return false;
  }
}

/**
 * 获取存储统计信息
 */
export async function getStorageStats() {
  try {
    const posters = await getAllPosters();
    const dataSize = new Blob([JSON.stringify(posters)]).size;
    
    return {
      count: posters.length,
      sizeBytes: dataSize,
      sizeFormatted: formatBytes(dataSize),
    };
  } catch (err) {
    console.error('❌ getStorageStats error:', err);
    return { count: 0, sizeBytes: 0, sizeFormatted: '0 B' };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
