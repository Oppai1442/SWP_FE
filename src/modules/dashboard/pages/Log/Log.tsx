import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Terminal, Search, Download, Trash2, Play, Pause, Copy, Settings } from 'lucide-react';

type LogEntry = {
  id: number;
  timestamp: string;
  level: string;
  thread: string;
  logger: string;
  message: string;
  stackTrace: string[];
  formatted: string;
};

type IncomingLogPayload = Partial<LogEntry> & {
  formatted?: string;
  stackTrace?: string[] | null;
};

const MAX_LOG_ITEMS = 2000;
const RECONNECT_DELAY_MS = 2000;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\\]/g, '\\$&');

const buildLogWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const base = new URL(apiUrl);
      const wsProtocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      const basePath = base.pathname.replace(/\/$/, '');
      base.protocol = wsProtocol;
      base.pathname = `${basePath}/ws/logs`;
      base.search = '';
      base.hash = '';
      return base.toString();
    } catch {
      // Fallback to window location below.
    }
  }
  const { protocol, host, pathname } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  const basePath = pathname.startsWith('/api') ? '/api' : '';
  return `${wsProtocol}//${host}${basePath}/ws/logs`;
};

const normaliseLogPayload = (data: IncomingLogPayload): LogEntry => {
  const timestamp = data.timestamp ?? new Date().toISOString();
  const level = (data.level ?? 'INFO').toUpperCase();
  const thread = data.thread ?? 'main';
  const logger = data.logger ?? 'application';
  const message = data.message ?? '';
  const stackTrace = Array.isArray(data.stackTrace) ? data.stackTrace : [];

  const baseFormatted = `${timestamp} ${level.padEnd(5)} [${thread}] ${logger} - ${message}`;
  const formatted =
    typeof data.formatted === 'string' && data.formatted.length > 0
      ? data.formatted
      : stackTrace.length > 0
        ? `${baseFormatted}\n${stackTrace.join('\n')}`
        : baseFormatted;

  const id =
    typeof data.id === 'number' && Number.isFinite(data.id)
      ? data.id
      : Date.now();

  return {
    id,
    timestamp,
    level,
    thread,
    logger,
    message,
    stackTrace,
    formatted
  };
};

const trimLogs = (items: LogEntry[]) => {
  if (items.length <= MAX_LOG_ITEMS) {
    return items;
  }
  return items.slice(items.length - MAX_LOG_ITEMS);
};

const ConsoleLogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [fontSize, setFontSize] = useState(12);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [bufferSize, setBufferSize] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const bufferRef = useRef<LogEntry[]>([]);
  const isStreamingRef = useRef(isStreaming);

  const logStreamUrl = useMemo(() => buildLogWebSocketUrl(), []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
    if (isStreaming && bufferRef.current.length > 0) {
      setLogs((prev) => trimLogs([...prev, ...bufferRef.current]));
      bufferRef.current = [];
      setBufferSize(0);
    }
  }, [isStreaming]);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      setConnectionState('connecting');
      try {
        const socket = new WebSocket(logStreamUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnectionState('open');
          setLastConnectedAt(new Date());
        };

        socket.onmessage = (event) => {
          let payload: IncomingLogPayload | null = null;
          try {
            payload = JSON.parse(event.data) as IncomingLogPayload;
          } catch {
            return;
          }

          if (!payload) {
            return;
          }

          const entry = normaliseLogPayload(payload);
          if (isStreamingRef.current) {
            setLogs((prev) => trimLogs([...prev, entry]));
          } else {
            bufferRef.current.push(entry);
            setBufferSize(bufferRef.current.length);
          }
        };

        socket.onerror = () => {
          setConnectionState('error');
          socket.close();
        };

        socket.onclose = (_event) => {
          if (!shouldReconnectRef.current) {
            setConnectionState('closed');
            return;
          }

          setConnectionState('connecting');
          if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
        };
      } catch {
        setConnectionState('error');
        if (reconnectTimerRef.current !== null) {
          window.clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounted');
        } catch {
          // Ignore close failures.
        }
        wsRef.current = null;
      }
    };
  }, [logStreamUrl]);

  useEffect(() => {
    if (!autoScroll || !logContainerRef.current) {
      return;
    }
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) {
      return logs;
    }
    const query = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const formattedMatch = log.formatted.toLowerCase().includes(query);
      if (formattedMatch) {
        return true;
      }
      return log.stackTrace.some((line) => line.toLowerCase().includes(query));
    });
  }, [logs, searchQuery]);

  const getLogColor = useCallback((level: string) => {
    switch ((level ?? '').toUpperCase()) {
      case 'ERROR':
        return 'text-rose-500';
      case 'WARN':
        return 'text-amber-500';
      case 'DEBUG':
        return 'text-emerald-500';
      case 'TRACE':
        return 'text-purple-500';
      default:
        return 'text-orange-500';
    }
  }, []);

  const highlightText = useCallback((text: string) => {
    if (!searchQuery.trim()) {
      return text;
    }
    const pattern = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
    const fragments = text.split(pattern);
    return fragments.map((fragment, index) => {
      if (index % 2 === 1) {
        return (
          <mark key={`${fragment}-${index}`} className="rounded-sm bg-orange-100 px-0.5 text-orange-600">
            {fragment}
          </mark>
        );
      }
      return fragment;
    });
  }, [searchQuery]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    bufferRef.current = [];
    setBufferSize(0);
  }, []);

  const handleDownloadLogs = useCallback(() => {
    if (logs.length === 0) {
      return;
    }
    const content = logs.map((log) => log.formatted).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `console-logs-${new Date().toISOString()}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const handleCopyAll = useCallback(() => {
    if (logs.length === 0) {
      return;
    }
    const content = logs.map((log) => log.formatted).join('\n\n');
    void navigator.clipboard.writeText(content);
  }, [logs]);

  const handleToggleStreaming = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

  const connectionLabel = useMemo(() => {
    switch (connectionState) {
      case 'open':
        return 'Đã kết nối';
      case 'connecting':
        return 'Đang kết nối...';
      case 'error':
        return 'Lỗi kết nối';
      case 'closed':
      default:
        return 'Đã ngắt kết nối';
    }
  }, [connectionState]);


  const lastLogTimestamp = logs.length > 0 ? logs[logs.length - 1].timestamp : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Nhật ký hệ thống</p>
              <h1 className="mt-3 flex items-center gap-2 text-4xl font-semibold text-slate-900">
                <Terminal className="h-6 w-6 text-orange-500" /> Bảng điều khiển trực tiếp
              </h1>
              <p className="mt-2 text-sm text-slate-500">Theo dõi hoạt động backend thời gian thực để xử lý sự cố và kiểm toán.</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <span className={`inline-flex h-2 w-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span>{isStreaming ? 'Đang truyền...' : 'Đã tạm dừng'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-500">
                <span className="font-semibold text-orange-500">{connectionLabel}</span>
                {bufferSize > 0 && (
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                    Đệm: {bufferSize}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhật ký..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSettings((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
              >
                <Settings className="h-4 w-4" /> Cài đặt
              </button>
              <button
                onClick={handleCopyAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                title="Sao chép tất cả"
              >
                <Copy className="h-4 w-4" /> Sao chép
              </button>
              <button
                onClick={handleDownloadLogs}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-600"
                title="Tải xuống nhật ký"
              >
                <Download className="h-4 w-4" /> Tải xuống
              </button>
              <button
                onClick={handleToggleStreaming}
                className="inline-flex items-center gap-2 rounded-2xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-400"
              >
                {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isStreaming ? 'Tạm dừng luồng' : 'Tiếp tục luồng'}
              </button>
              <button
                onClick={handleClearLogs}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                title="Xóa bảng điều khiển"
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </button>
            </div>
          </div>
        </section>

        {showSettings && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Cỡ chữ</label>
                <input
                  type="range"
                  min="10"
                  max="16"
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="w-40 accent-orange-500"
                />
                <span className="text-sm font-semibold text-orange-500">{fontSize}px</span>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                  checked={autoScroll}
                  onChange={(event) => setAutoScroll(event.target.checked)}
                />
                Tự động cuộn
              </label>
              <span className="ml-auto text-sm text-slate-500">
                {filteredLogs.length.toLocaleString()} / {logs.length.toLocaleString()} dòng
              </span>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span>Điểm cuối: {logStreamUrl}</span>
              <span className="text-slate-300">|</span>
              <span>Nhật ký cuối: {lastLogTimestamp}</span>
              {lastConnectedAt && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>Kết nối lúc: {lastConnectedAt.toLocaleTimeString()}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span>Tổng: {logs.length.toLocaleString()}</span>
              <span className="text-slate-300">|</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </section>

        <div
          ref={logContainerRef}
          className="min-h-[480px] rounded-3xl border border-slate-200 bg-slate-950 font-mono text-slate-100 shadow-inner scrollbar-thin"
          style={{ fontSize: `${fontSize}px` }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <Terminal className="h-12 w-12 text-slate-600" />
              <p className="text-lg font-semibold">Không có nhật ký nào để hiển thị</p>
              <p className="text-sm text-slate-500">
                {logs.length === 0 ? 'Đang chờ đầu ra của console...' : 'Không tìm thấy kết quả nào cho tìm kiếm của bạn.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredLogs.map((log) => {
                const lines = log.formatted.split(/\r?\n/);
                return (
                  <div key={log.id} className={`${getLogColor(log.level)} rounded-2xl px-3 py-2 transition hover:bg-white/5`}>
                    {lines.map((line, index) => (
                      <pre
                        key={`${log.id}-${index}`}
                        className={`whitespace-pre-wrap ${index === 0 ? 'font-semibold' : 'text-slate-300'}`}
                      >
                        {highlightText(line)}
                      </pre>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 10px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(249, 115, 22, 0.3);
          border-radius: 999px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </div>
  );
}

export default ConsoleLogViewer;