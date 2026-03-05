/**
 * 帶身分驗證的檔案下載工具函式
 * 使用 fetch + blob 方式下載，確保 x-student-id header 會被送出
 */
export async function authenticatedDownload(url) {
  const studentId = localStorage.getItem('studentId');
  if (!studentId) {
    alert('尚未登入，請重新登入後再試。');
    return;
  }

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  try {
    const res = await fetch(`${API_BASE_URL}${url}`, {
      headers: { 'x-student-id': studentId },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      alert('無權限下載此檔案，請確認您的登入狀態。');
      return;
    }
    if (!res.ok) throw new Error('下載失敗');

    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    console.error('下載失敗:', e);
    alert('下載失敗，請稍後再試。');
  }
}
