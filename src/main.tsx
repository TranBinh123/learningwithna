import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './index.css';

// Hiển thị lỗi trực tiếp lên màn hình khi có sự cố xảy ra NGOÀI vòng render của React (ví dụ: lỗi cú pháp lúc load module, lỗi trong Promise không được bắt, v.v). Nhờ vậy khi test trên điện thoại cũng thấy được lỗi mà không cần mở console.
function showFatalError(title: string, detail: string) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#fff3f3;color:#7a1212;' +
    'font-family:monospace;font-size:13px;line-height:1.5;padding:20px;' +
    'white-space:pre-wrap;word-break:break-word;overflow:auto;';
  el.innerText = `🔴 ${title}\n\n${detail}`;
  document.body.appendChild(el);
}

window.addEventListener('error', event => {
  console.error('[window.onerror]', event.error || event.message);
  showFatalError('Lỗi JavaScript', String(event.error?.stack || event.message));
});

window.addEventListener('unhandledrejection', event => {
  console.error('[unhandledrejection]', event.reason);
  showFatalError('Promise bị lỗi (unhandled rejection)', String(event.reason?.stack || event.reason));
});

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('Không tìm thấy phần tử #root trong index.html');
  }

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  console.error('[main.tsx] Lỗi khi khởi tạo app:', err);
  showFatalError('Lỗi khi khởi tạo app', String((err as Error)?.stack || err));
}
