/**
 * 請瀏覽器把這個網站的儲存空間標記為「持久」。
 *
 * iOS Safari 分頁預設會在 7 天沒互動之後清掉 localStorage；加到主畫面的
 * web app 不受這個限制。這支 API 是額外的一層保險，能不能成功由瀏覽器決定，
 * 失敗也無所謂 —— 真正的保險是「進度」頁裡的備份碼。
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
  try {
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
