import React, { useState, useEffect, useRef } from 'react';
import {
  CornerDownLeft,
  Skull,
  Download,
  Terminal,
  X,
  Share2,
  Check,
  Cpu,
  HardDrive,
  Wifi,
  Folder,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

interface AttackScenario {
  id: string;
  title: string;
  severity: string;
  category: string;
  mitre_id: string;
  mitre_technique: string;
  mitre_tactic: string;
  target_asset: string;
  source_ip: string;
  destination_ip: string;
  port: number;
  protocol: string;
  is_core: boolean;
  description: string;
}

interface TargetFile {
  filename: string;
  size: number;
  content: string;
}

const DEFAULT_TARGET_FILES: TargetFile[] = [
  {
    filename: 'recon_targets.txt',
    size: 482,
    content: (
      '# TARGET SUBNET RECONNAISSANCE MAP\n' +
      '10.0.0.1      GATEWAY-PRIMARY     STATUS: UP   PORTS: 22,80,443\n' +
      '10.0.0.10     PROD-CORE-01        STATUS: UP   PORTS: 80,443,8000\n' +
      '10.0.0.15     DB-CLUSTER-MASTER   STATUS: UP   PORTS: 3306,5432\n' +
      '10.0.0.88     DEV-WORKSTATION-04  STATUS: UP   PORTS: 22,8080\n' +
      '192.168.1.100 BORDER-ROUTER-EDGE  STATUS: UP   PORTS: 53,443'
    )
  },
  {
    filename: 'customer_records.csv',
    size: 512,
    content: (
      'account_id,org_name,tier,region,active_tokens,last_access\n' +
      'CUST-9021,Apex Global Cyber,Enterprise,US-East,14,2026-11-23T20:11:00Z\n' +
      'CUST-8842,Vanguard Defense,Gov-Cloud,EU-Central,8,2026-11-23T21:40:12Z\n' +
      'CUST-7719,Helios Energy Corp,Enterprise,AP-South,22,2026-11-23T19:05:44Z\n' +
      'CUST-6104,Titan Aerospace,Federal,US-West,5,2026-11-23T22:01:19Z\n' +
      'CUST-5290,Nordic Financial Group,Tier-1,EU-North,19,2026-11-23T18:22:50Z'
    )
  },
  {
    filename: 'api_endpoints.conf',
    size: 345,
    content: (
      '[gateway_routing]\n' +
      'api_version = 2.4.0\n' +
      'internal_prefix = /api/v1\n' +
      'auth_service = https://auth.internal.net:8000/verify\n' +
      'telemetry_stream = wss://telemetry.internal.net:8000/ws\n' +
      'database_cluster = tcp://10.0.0.15:5432/cybersentinel\n' +
      'encryption_mode = AES-256-GCM\n' +
      'session_timeout_sec = 3600'
    )
  },
  {
    filename: 'system_architecture.json',
    size: 418,
    content: JSON.stringify(
      {
        platform: 'CYBER BLACK DEFENSE MATRIX',
        defense_nodes: {
          agent_01: 'Black Agent Perimeter Shield (9 Ports Armed)',
          agent_02: 'Dark Agent Deception Core (Honeypot Decoy)',
          engine: 'AMTIE 5-Layer Anomaly & Threat Detection'
        },
        core_services: ['auth', 'telemetry', 'incident_triage', 'response_automation'],
        isolated_vlans: ['VLAN-100-PROD', 'VLAN-200-DB', 'VLAN-999-HONEYNET']
      },
      null,
      2
    )
  },
  {
    filename: 'audit_log_2026.txt',
    size: 520,
    content: (
      '2026-11-23 21:55:04 [INFO] SOC Kernel boot complete. All 9 perimeter ports armored.\n' +
      '2026-11-23 22:01:18 [SEC_EVENT] Ingress scan detected from subnet 198.51.100.0/24.\n' +
      '2026-11-23 22:10:45 [BLOCK] Gateway firewall dropped 42 SYN packets on port 22.\n' +
      '2026-11-23 22:15:30 [AUTH] Administrator session established: Lead SOC Architect mani02.\n' +
      '2026-11-23 22:20:00 [HEALTH] AMTIE 5-layer anomaly inference running at sub-millisecond latency.'
    )
  }
];

export const AttackScenarios: React.FC = () => {
  const [scenarios, setScenarios] = useState<AttackScenario[]>([]);
  const [mobileIp, setMobileIp] = useState<string>('10.108.192.176');
  const [currentPath, setCurrentPath] = useState<string>('/var/data/targets/exfil');
  const [capturedFiles, setCapturedFiles] = useState<TargetFile[]>(DEFAULT_TARGET_FILES);

  // Terminal History (Linux Terminal Level Initial Banner)
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Linux purplehat-c2 6.8.11-kali1-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux',
    'Kernel 6.8.11 • Terminal: pts/0 • Shell: /bin/bash • Host: 10.108.192.176',
    'Session established for root (uid=0 gid=0). All attack modules loaded.',
    ' ',
    '[*] Ingress target gateway: 10.0.0.1 (All perimeter ports monitored)',
    '[*] Target storage node: /var/data/targets/exfil (5 target files armed)',
    '[*] Quick commands: "ls -la", "cat <file>", "whoami", "uname -a", "att-0" to "att-12", "clear"',
    '[*] Type command above and tap RUN or tap the 1-TAP pills below.'
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  // Target Agents status
  const [agentStatus, setAgentStatus] = useState<any>(null);

  // Countdown & Lock State (Engaged ONLY during Dark Agent attack)
  const [countdown, setCountdown] = useState<number | null>(null);
  const [deviceLocked, setDeviceLocked] = useState(false);

  // PWA & Mobile Download State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen trigger helper
  const triggerFullscreen = () => {
    try {
      const docEl = document.documentElement as any;
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      }
    } catch {
      // ignore
    }
  };

  // 1. PWA beforeinstallprompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsPwaInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch {
        setShowInstallModal(true);
      }
    }
    setShowInstallModal(true);
  };

  // Direct standalone web launcher file download
  const handleDownloadLauncher = () => {
    const currentUrl = window.location.href;
    const launcherHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Purple Hat Terminal</title>
  <style>
    body { margin:0; background:#0c0c0f; color:#c084fc; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; }
    .loader { border:3px solid #2d1b4e; border-top:3px solid #c084fc; border-radius:50%; width:36px; height:36px; animation:spin 1s linear infinite; margin-bottom:16px; }
    @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <div style="font-size:14px;font-weight:bold;letter-spacing:2px;">LAUNCHING PURPLE HAT C2...</div>
  <script>
    setTimeout(function() {
      window.location.replace("${currentUrl}");
    }, 250);
  </script>
</body>
</html>`;
    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PurpleHat-App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. COMPREHENSIVE GESTURE, SWIPE & CONTROL LOCKDOWN: ONLY ENGAGED WHEN deviceLocked IS TRUE!
  // During normal use, this hook does NOTHING and normal scroll works 100%!
  useEffect(() => {
    if (!deviceLocked) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    // Trigger Fullscreen immediately
    triggerFullscreen();

    // Haptic vibration feedback on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([350, 150, 350, 150, 700]);
      } catch {}
    }

    // Maintain Fullscreen: if user tries to swipe down status bar or exit, re-trigger
    const handleFullscreenChange = () => {
      if (deviceLocked && !document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        setTimeout(() => triggerFullscreen(), 50);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // Trap history so swipe back/forward or mobile back button cannot exit
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    // Block page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Complete block function for all user touch, pointer, and click interactions (DO NOT TOUCH - FULL BLOCK)
    // CANNOT BE UNLOCKED LOCALLY ON MOBILE! ONLY UNLOCKED REMOTELY FROM MAIN LAPTOP SITE!
    const blockInteraction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Block touch events (stops pull-to-refresh, pinch, swipe, scrolling, taps)
    window.addEventListener('touchstart', blockInteraction, { passive: false, capture: true });
    window.addEventListener('touchmove', blockInteraction, { passive: false, capture: true });
    window.addEventListener('touchend', blockInteraction, { passive: false, capture: true });
    window.addEventListener('touchcancel', blockInteraction, { passive: false, capture: true });

    // Block mouse & pointer events
    window.addEventListener('mousedown', blockInteraction, { passive: false, capture: true });
    window.addEventListener('mouseup', blockInteraction, { passive: false, capture: true });
    window.addEventListener('mousemove', blockInteraction, { passive: false, capture: true });
    window.addEventListener('click', blockInteraction, { passive: false, capture: true });
    window.addEventListener('dblclick', blockInteraction, { passive: false, capture: true });
    window.addEventListener('contextmenu', blockInteraction, { passive: false, capture: true });
    window.addEventListener('pointerdown', blockInteraction, { passive: false, capture: true });
    window.addEventListener('pointermove', blockInteraction, { passive: false, capture: true });
    window.addEventListener('pointerup', blockInteraction, { passive: false, capture: true });
    window.addEventListener('pointercancel', blockInteraction, { passive: false, capture: true });
    window.addEventListener('wheel', blockInteraction, { passive: false, capture: true });
    window.addEventListener('selectstart', blockInteraction, { passive: false, capture: true });
    window.addEventListener('dragstart', blockInteraction, { passive: false, capture: true });

    // Block keyboard navigation (Escape, F5, Ctrl+R, Alt+Left, etc.)
    const blockKeyboard = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', blockKeyboard, { capture: true });
    window.addEventListener('keyup', blockKeyboard, { capture: true });
    window.addEventListener('keypress', blockKeyboard, { capture: true });

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

      window.removeEventListener('touchstart', blockInteraction, { capture: true });
      window.removeEventListener('touchmove', blockInteraction, { capture: true });
      window.removeEventListener('touchend', blockInteraction, { capture: true });
      window.removeEventListener('touchcancel', blockInteraction, { capture: true });

      window.removeEventListener('mousedown', blockInteraction, { capture: true });
      window.removeEventListener('mouseup', blockInteraction, { capture: true });
      window.removeEventListener('mousemove', blockInteraction, { capture: true });
      window.removeEventListener('click', blockInteraction, { capture: true });
      window.removeEventListener('dblclick', blockInteraction, { capture: true });
      window.removeEventListener('contextmenu', blockInteraction, { capture: true });
      window.removeEventListener('pointerdown', blockInteraction, { capture: true });
      window.removeEventListener('pointermove', blockInteraction, { capture: true });
      window.removeEventListener('pointerup', blockInteraction, { capture: true });
      window.removeEventListener('pointercancel', blockInteraction, { capture: true });
      window.removeEventListener('wheel', blockInteraction, { capture: true });
      window.removeEventListener('selectstart', blockInteraction, { capture: true });
      window.removeEventListener('dragstart', blockInteraction, { capture: true });

      window.removeEventListener('keydown', blockKeyboard, { capture: true });
      window.removeEventListener('keyup', blockKeyboard, { capture: true });
      window.removeEventListener('keypress', blockKeyboard, { capture: true });
    };
  }, [deviceLocked]);

  // 3. Fetch scenarios & target files
  const fetchScenarios = async () => {
    try {
      const data = await api.get<AttackScenario[]>('/attacks/scenarios');
      setScenarios(data);
    } catch (err) {
      console.error('Failed to load attack scenarios:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await api.get<TargetFile[]>('/attacks/files');
      if (Array.isArray(data) && data.length > 0) {
        setCapturedFiles(data);
      }
    } catch {
      // fallback
    }
  };

  const checkAgentStatus = async () => {
    try {
      const res = await api.get<any>('/agents/status');
      setAgentStatus(res);
    } catch {
      // ignore
    }
  };

  // Poll lock status from backend (released ONLY when operator unlocks or stops agent on Main Site)
  const checkBackendLock = async () => {
    try {
      const res = await api.get<any>('/agents/dark/lock-status');
      if (res.is_locked && !deviceLocked && countdown === null) {
        startCountdownAndLock();
      } else if (!res.is_locked && deviceLocked) {
        setDeviceLocked(false);
        setTerminalHistory((prev) => [
          ...prev,
          '[+] REMOTE RELEASE CONFIRMED: Operator authorized unlock or stopped Dark Agent from Main Laptop.',
          '[+] Attacker device browser controls restored.'
        ]);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  };

  // WebSocket for instant 0ms unlock when released or Dark Agent is stopped on Main Site
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/telemetry`;
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DARK_DEVICE_RELEASED' || (data.type === 'DARK_AGENT_TOGGLED' && !data.is_active)) {
            setDeviceLocked(false);
            setTerminalHistory((prev) => [
              ...prev,
              '[+] REMOTE RELEASE CONFIRMED: Operator authorized unlock or stopped Dark Agent from Main Laptop.',
              '[+] Attacker device browser controls restored.'
            ]);
            if (document.fullscreenElement && document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (socket) socket.close();
    };
  }, []);

  useEffect(() => {
    const host = window.location.hostname;
    setMobileIp(host === 'localhost' || host === '127.0.0.1' ? '10.108.192.176' : host);

    fetchScenarios();
    fetchFiles();
    checkAgentStatus();
    checkBackendLock();

    const interval = setInterval(() => {
      checkAgentStatus();
      checkBackendLock();
    }, 1000);

    return () => clearInterval(interval);
  }, [deviceLocked, countdown]);

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollTop = terminalBottomRef.current.scrollHeight;
    }
  }, [terminalHistory, countdown]);

  // Start 5...4...3...2...1 Countdown to Red Browser Lock
  // NOTE: Does NOT zoom during countdown so user can read logs! Only zooms on 0 when lock engages.
  const startCountdownAndLock = () => {
    let count = 5;
    setCountdown(count);

    const countInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        setTerminalHistory((prev) => [
          ...prev,
          `[!] LOCKING ATTACKER DEVICE BROWSER IN ${count}...`
        ]);
      } else {
        clearInterval(countInterval);
        setCountdown(null);
        setTerminalHistory((prev) => [
          ...prev,
          `[!] 0: BROWSER LOCK ENGAGED // THIS DEVICE IS LOCKED BY DART.`
        ]);
        setDeviceLocked(true);
        triggerFullscreen(); // Zooms into fullscreen ONLY when lock engages!
      }
    }, 900);
  };

  // 4. Command Router & Execution Logic (Authentic Linux Terminal Commands)
  const handleExecuteCommand = async (inputStr: string) => {
    const rawCmd = inputStr.trim();
    if (!rawCmd || isExecuting) return;

    setCommandHistory((prev) => [...prev, rawCmd]);
    const lower = rawCmd.toLowerCase();
    const promptDisplay = `┌──(root㉿purplehat)-[${currentPath}]\n└─# ${rawCmd}`;

    // CLEAR / CLS
    if (lower === 'clear' || lower === 'cls') {
      setTerminalHistory(['Linux purplehat-c2 terminal cleared. Ready for commands.']);
      setCommandInput('');
      return;
    }

    // HELP
    if (lower === 'help') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        '=== KALI LINUX TERMINAL UTILITIES & ATTACK MODULES ===',
        '  ls [-la]         : List directory files with Unix permissions & sizes',
        '  cat <file>       : Inspect target file contents',
        '  cd <dir>         : Change current working directory',
        '  pwd              : Print current working directory',
        '  whoami           : Print current effective user ID (root)',
        '  id               : Print user and group ID numbers',
        '  uname [-a]       : Print Linux kernel architecture information',
        '  hostname         : Print system network hostname',
        '  date             : Print system date and timestamp',
        '  ifconfig / ip a  : Display network adapter configurations',
        '  ps [aux]         : List active system processes',
        '  history          : Print command execution history',
        '  att-0            : Exfiltrate all 5 target files across ports',
        '  att-1 to att-12  : Deploy MITRE attack vector scenarios',
        '  clear            : Clear terminal screen'
      ]);
      setCommandInput('');
      return;
    }

    // WHOAMI
    if (lower === 'whoami') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        'root'
      ]);
      setCommandInput('');
      return;
    }

    // ID
    if (lower === 'id') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        'uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)'
      ]);
      setCommandInput('');
      return;
    }

    // UNAME
    if (lower === 'uname' || lower === 'uname -a' || lower === 'uname -r') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        'Linux purplehat-c2 6.8.11-kali1-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2 (2026-11-20) x86_64 GNU/Linux'
      ]);
      setCommandInput('');
      return;
    }

    // HOSTNAME
    if (lower === 'hostname') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        'purplehat-c2'
      ]);
      setCommandInput('');
      return;
    }

    // DATE
    if (lower === 'date') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        new Date().toUTCString()
      ]);
      setCommandInput('');
      return;
    }

    // IFCONFIG / IP A
    if (lower === 'ifconfig' || lower === 'ip a' || lower === 'ip addr') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`,
        `        inet ${mobileIp}  netmask 255.255.255.0  broadcast 10.108.192.255`,
        `        ether 02:42:0a:6c:c0:b0  txqueuelen 1000  (Ethernet)`,
        `lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536`,
        `        inet 127.0.0.1  netmask 255.0.0.0`
      ]);
      setCommandInput('');
      return;
    }

    // PS / PS AUX
    if (lower === 'ps' || lower === 'ps aux' || lower === 'ps -ef') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
        'root           1  0.0  0.1  21532  3420 ?        Ss   07:00   0:01 /sbin/init',
        'root          42  0.0  0.4  84920 16384 ?        S    07:01   0:04 /usr/bin/c2-tunnel --daemon',
        'root          98  0.2  0.8 142800 32768 pts/0    Ss+  07:15   0:12 /bin/bash',
        'root         154  0.5  1.2 210400 49152 pts/0    R+   10:35   0:00 ps aux'
      ]);
      setCommandInput('');
      return;
    }

    // HISTORY
    if (lower === 'history') {
      const historyLines = commandHistory.map((cmd, idx) => `  ${idx + 1}  ${cmd}`);
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        ...historyLines,
        `  ${commandHistory.length + 1}  history`
      ]);
      setCommandInput('');
      return;
    }

    // PWD
    if (lower === 'pwd') {
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        currentPath
      ]);
      setCommandInput('');
      return;
    }

    // CD
    if (lower.startsWith('cd')) {
      const parts = rawCmd.split(/\s+/);
      const targetDir = parts[1] || '~';
      let newPath = currentPath;
      if (targetDir === '~' || targetDir === '') {
        newPath = '/var/data/targets/exfil';
      } else if (targetDir === '..') {
        newPath = '/var/data/targets';
      } else if (targetDir === '/') {
        newPath = '/';
      } else if (targetDir === 'exfil' || targetDir === './exfil') {
        newPath = '/var/data/targets/exfil';
      } else {
        newPath = targetDir.startsWith('/') ? targetDir : `${currentPath}/${targetDir}`;
      }
      setCurrentPath(newPath);
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        `Directory changed to: ${newPath}`
      ]);
      setCommandInput('');
      return;
    }

    // LS
    if (lower === 'ls' || lower.startsWith('ls ') || lower === 'dir') {
      const lines = [
        promptDisplay,
        `total 24`,
        `drwxr-xr-x 2 root root 4096 Nov 24 10:30 .`,
        `drwxr-xr-x 4 root root 4096 Nov 24 07:00 ..`,
        `-rw-r--r-- 1 root root  482 Nov 24 07:45 recon_targets.txt`,
        `-rw-r--r-- 1 root root  512 Nov 24 07:45 customer_records.csv`,
        `-rw-r--r-- 1 root root  345 Nov 24 07:45 api_endpoints.conf`,
        `-rw-r--r-- 1 root root  418 Nov 24 07:45 system_architecture.json`,
        `-rw-r--r-- 1 root root  520 Nov 24 07:45 audit_log_2026.txt`
      ];
      setTerminalHistory((prev) => [...prev, ...lines]);
      setCommandInput('');
      return;
    }

    // CAT
    if (lower.startsWith('cat ') || lower === 'cat') {
      const parts = rawCmd.split(/\s+/);
      const filename = parts[1];
      if (!filename) {
        setTerminalHistory((prev) => [
          ...prev,
          promptDisplay,
          'Usage: cat <filename> (e.g. cat recon_targets.txt)'
        ]);
        setCommandInput('');
        return;
      }

      const found = capturedFiles.find(
        (f) => f.filename.toLowerCase() === filename.toLowerCase()
      );

      if (found) {
        setTerminalHistory((prev) => [
          ...prev,
          promptDisplay,
          `--- BEGIN ${found.filename} (${found.size} bytes) ---`,
          found.content,
          `--- END ${found.filename} ---`
        ]);
      } else {
        setTerminalHistory((prev) => [
          ...prev,
          promptDisplay,
          `cat: ${filename}: No such file or directory. Type "ls" to list files.`
        ]);
      }
      setCommandInput('');
      return;
    }

    // SUDO CHECK
    let commandToRun = rawCmd;
    if (lower.startsWith('sudo ')) {
      commandToRun = rawCmd.substring(5).trim();
      setTerminalHistory((prev) => [
        ...prev,
        promptDisplay,
        `[sudo] clearance verified for root operator.`
      ]);
    } else {
      setTerminalHistory((prev) => [...prev, promptDisplay]);
    }

    // ATTACK COMMANDS: ATT-0 OR ATT-1 .. ATT-12
    const cleanLower = commandToRun.toLowerCase();

    // Check for ATT-0 (Exfiltrate All 5 Files)
    if (cleanLower === 'att-0' || cleanLower === 'att0' || cleanLower === '0') {
      setIsExecuting(true);
      setCommandInput('');
      const nowTime = new Date().toLocaleTimeString();

      setTerminalHistory((prev) => [
        ...prev,
        `[*] [${nowTime}] Deploying Vector: ATT-0 (Comprehensive Exfiltration)`,
        `[*] Target Asset: 10.0.0.15:443 [TCP] -> ${currentPath}`,
        `[*] Testing target gateway shield status...`
      ]);

      try {
        const res = await api.post<any>('/attacks/simulate/att-0');
        const isDarkActive = agentStatus?.dark_agent?.is_active || res.dark_agent !== null;
        const isBlackActive = agentStatus?.black_agent?.is_active !== false && !isDarkActive;

        if (isDarkActive) {
          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              `[+] INGRESS ACCEPTED: Decoy honeypot service responded.`,
              `[!] WARNING: REVERSE SOCKET OVERRIDE DETECTED FROM TARGET GATEWAY!`,
              `[!] TARGET ACTIVE DEFENSE HAS HIJACKED THIS TERMINAL.`
            ]);
            startCountdownAndLock();
            setIsExecuting(false);
          }, 600);
        } else if (isBlackActive && res.status !== 'success' && !res.black_agent?.action?.includes('PENETRATION')) {
          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              `[!] ACCESS BLOCKED: Connection refused by target gateway firewall (TCP RST/DROP).`,
              `[!] Target port :443 is armored. Ingress packet dropped. 0 files retrieved.`
            ]);
            setIsExecuting(false);
          }, 500);
        } else {
          setTimeout(() => {
            setTerminalHistory((prev) => [
              ...prev,
              `[+] EXPLOIT SUCCESSFUL: Target gateway perimeter shield is offline.`,
              `[+] Ingress established on port 443. Downloading target assets (5 total files):`,
              `    -> [1/5] recon_targets.txt (482 B) [SAVED]`,
              `    -> [2/5] customer_records.csv (512 B) [SAVED]`,
              `    -> [3/5] api_endpoints.conf (345 B) [SAVED]`,
              `    -> [4/5] system_architecture.json (418 B) [SAVED]`,
              `    -> [5/5] audit_log_2026.txt (520 B) [SAVED]`,
              `[+] 5 target files downloaded to ${currentPath}. Type "ls" or "cat <file>" to read.`
            ]);
            setIsExecuting(false);
          }, 600);
        }
      } catch {
        const isDarkActive = agentStatus?.dark_agent?.is_active;
        const isBlackActive = agentStatus?.black_agent?.is_active !== false && !isDarkActive;

        if (isDarkActive) {
          startCountdownAndLock();
        } else if (isBlackActive) {
          setTerminalHistory((prev) => [
            ...prev,
            `[!] ACCESS BLOCKED: Connection refused by target gateway firewall (TCP RST/DROP).`,
            `[!] Ingress packet dropped. 0 files retrieved.`
          ]);
        } else {
          setTerminalHistory((prev) => [
            ...prev,
            `[+] EXPLOIT SUCCESSFUL: Downloaded 5 target files to ${currentPath}. Type "ls" to view.`
          ]);
        }
        setIsExecuting(false);
      }
      return;
    }

    // Match scenarios 1 to 12
    let targetScenario: AttackScenario | undefined;
    const numMatch = cleanLower.match(/^(?:att-?)?(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10);
      if (idx === 0) {
        targetScenario = scenarios.find((s) => s.id === 'att-0');
      } else if (idx >= 1 && idx <= scenarios.length) {
        targetScenario = scenarios.find((s) => s.title.includes(`Scenario ${idx}:`)) || scenarios[idx - 1];
      }
    } else {
      targetScenario = scenarios.find(
        (s) => s.id.toLowerCase().includes(cleanLower) || s.title.toLowerCase().includes(cleanLower)
      );
    }

    if (!targetScenario) {
      setTerminalHistory((prev) => [
        ...prev,
        `bash: ${commandToRun}: command not found. Type "help", "ls", "whoami", or "att-0" to "att-12".`
      ]);
      setCommandInput('');
      return;
    }

    // Execute attack scenario
    setIsExecuting(true);
    setCommandInput('');
    const nowTime = new Date().toLocaleTimeString();

    setTerminalHistory((prev) => [
      ...prev,
      `[*] [${nowTime}] Deploying Vector: ${targetScenario?.title} (${targetScenario?.mitre_id})`,
      `[*] Target Asset: ${targetScenario?.destination_ip}:${targetScenario?.port} [${targetScenario?.protocol}]`,
      `[*] Transmitting payload...`
    ]);

    try {
      const res = await api.post<any>(`/attacks/simulate/${targetScenario.id}`);
      const isDarkActive = agentStatus?.dark_agent?.is_active || res.dark_agent !== null;
      const isBlackActive = agentStatus?.black_agent?.is_active !== false && !isDarkActive;

      if (isDarkActive) {
        setTimeout(() => {
          setTerminalHistory((prev) => [
            ...prev,
            `[+] INGRESS ACCEPTED: Decoy honeypot service responded.`,
            `[!] WARNING: REVERSE SOCKET OVERRIDE DETECTED FROM TARGET GATEWAY!`,
            `[!] TARGET ACTIVE DEFENSE HAS HIJACKED THIS TERMINAL.`
          ]);
          startCountdownAndLock();
          setIsExecuting(false);
        }, 600);
      } else if (!isBlackActive) {
        setTimeout(() => {
          setTerminalHistory((prev) => [
            ...prev,
            `[+] PENETRATION SUCCESSFUL: Target gateway perimeter shield is offline.`,
            `[+] Exfiltrated records received from port :${targetScenario?.port}.`,
            `[+] Stored in ${currentPath}. Run "ls" to inspect repository.`
          ]);
          setIsExecuting(false);
        }, 500);
      } else {
        setTimeout(() => {
          setTerminalHistory((prev) => [
            ...prev,
            `[!] ACCESS BLOCKED: Connection refused by target gateway firewall (TCP RST/DROP).`,
            `[!] Target port :${targetScenario?.port} is armored. Ingress packet dropped. 0 records retrieved.`
          ]);
          setIsExecuting(false);
        }, 500);
      }
    } catch {
      setTerminalHistory((prev) => [
        ...prev,
        `[!] ACCESS BLOCKED: Connection refused by target gateway firewall (TCP RST/DROP).`
      ]);
      setIsExecuting(false);
    }
  };

  const isDarkActive = agentStatus?.dark_agent?.is_active ?? false;

  return (
    <div className="min-h-screen bg-[#07070A] text-[#F1F5F9] font-mono selection:bg-[#4C1D95] selection:text-white flex flex-col p-2 sm:p-4 select-none relative max-w-5xl mx-auto">
      {/* ================================================================= */}
      {/* 1. AUTHENTIC LINUX TERMINAL WINDOW CONTAINER                      */}
      {/* ================================================================= */}
      <div className="rounded-xl border border-[#232330] bg-[#0B0B10] shadow-2xl flex flex-col flex-1 overflow-hidden">
        {/* Linux Titlebar */}
        <div className="bg-[#13131A] border-b border-[#232330] px-3 py-2 flex items-center justify-between gap-2 select-none">
          {/* Window Control Dots */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#DC2626] inline-block shadow-sm"></span>
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-[#D97706] inline-block shadow-sm"></span>
              <span className="w-3 h-3 rounded-full bg-[#10B981] border border-[#059669] inline-block shadow-sm"></span>
            </div>
            <div className="h-4 w-px bg-[#262636] mx-1"></div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <Terminal className="w-3.5 h-3.5 text-[#C084FC]" />
              <span className="font-bold text-white tracking-wide">root@purplehat-c2</span>
              <span className="text-zinc-500 hidden sm:inline">:~ (bash)</span>
            </div>
          </div>

          {/* Right Status Badge & Clean PWA Install Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1C122C] border border-[#581C87] text-[10px] text-[#D8B4FE]">
              <span className={`w-1.5 h-1.5 rounded-full ${isDarkActive ? 'bg-emerald-400' : 'bg-purple-400'} animate-pulse`}></span>
              <span>{mobileIp}</span>
              <span>•</span>
              <span className={isDarkActive ? 'text-emerald-300 font-bold' : 'text-purple-300'}>
                {isDarkActive ? 'DECOY OPEN' : 'ARMORED'}
              </span>
            </div>

            <button
              onClick={handleInstallClick}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 shadow active:scale-95 transition-all ${
                isPwaInstalled
                  ? 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                  : deferredPrompt
                  ? 'bg-gradient-to-r from-[#7E22CE] to-[#9333EA] border border-[#C084FC] text-white animate-pulse'
                  : 'bg-[#2E1065] hover:bg-[#3B0764] border border-[#9333EA] text-white'
              }`}
              title="Install as Mobile Linux App"
            >
              <Download className="w-3 h-3 text-[#C084FC]" />
              <span className="hidden sm:inline">
                {isPwaInstalled ? 'PWA INSTALLED' : deferredPrompt ? 'INSTALL PWA' : 'DOWNLOAD APP'}
              </span>
              <span className="sm:hidden">
                {isPwaInstalled ? 'INSTALLED' : 'APP'}
              </span>
            </button>
          </div>
        </div>

        {/* Linux Shell Prompt Input (Top Section) */}
        <div className="p-2 sm:p-2.5 bg-[#0F0F16] border-b border-[#1E1E2A]">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1 mb-1 border-b border-[#1A1A24]">
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="text-[#38BDF8]">┌──(</span>
              <span className="text-[#C084FC] font-bold">root㉿purplehat</span>
              <span className="text-[#38BDF8]">)-[</span>
              <span className="text-[#34D399] font-medium truncate max-w-[200px] sm:max-w-none">{currentPath}</span>
              <span className="text-[#38BDF8]">]</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">linux-amd64</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteCommand(commandInput);
            }}
            className="flex items-center gap-2"
          >
            <span className="text-[#EF4444] font-black select-none text-xs sm:text-sm pl-0.5">
              └─#
            </span>
            <input
              ref={commandInputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              disabled={isExecuting || deviceLocked}
              placeholder="Type ls, cat <file>, whoami, att-0 to att-12..."
              style={{ fontSize: '16px' }} // Exactly 16px to prevent iOS & Android zoom
              className="flex-1 bg-transparent text-sm sm:text-xs text-[#FFFFFF] placeholder-zinc-600 font-mono focus:outline-none min-w-0"
              autoFocus
            />
            <button
              type="submit"
              disabled={isExecuting || deviceLocked || !commandInput.trim()}
              className="px-3 py-1 rounded bg-[#2A1545] hover:bg-[#3D1A6A] border border-[#7E22CE] disabled:opacity-30 text-xs font-bold text-white flex items-center gap-1 transition-colors shrink-0 shadow-sm active:scale-95"
            >
              <span>RUN</span>
              <CornerDownLeft className="w-3.5 h-3.5 text-[#C084FC]" />
            </button>
          </form>
        </div>

        {/* Linux Toolkit Quick Commands Strip */}
        <div className="p-2 sm:p-2.5 bg-[#0C0C12] border-b border-[#1C1C26] text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-zinc-400 border-b border-[#1C1C26] pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#C084FC]">$</span>
              <span>LINUX ADVERSARY TOOLKIT &amp; ATTACK VECTORS</span>
            </div>
            <span className="text-zinc-500 text-[10px]">1-TAP SHELL</span>
          </div>

          {/* Quick Shell Commands */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
            <span className="text-[10px] text-zinc-500 shrink-0">SHELL:</span>
            {['ls -la', 'cat recon_targets.txt', 'cat customer_records.csv', 'whoami', 'uname -a', 'ifconfig', 'ps aux', 'pwd', 'clear'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleExecuteCommand(cmd)}
                disabled={isExecuting || deviceLocked}
                className="px-2 py-0.5 rounded font-mono text-[10px] shrink-0 transition-all border bg-[#14141C] hover:bg-[#251B38] border-[#2A2A3A] hover:border-[#7E22CE] text-zinc-200 hover:text-white font-medium active:scale-95"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Attack Scenarios Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 text-[10px] sm:text-[11px] pt-1 border-t border-[#1C1C26]">
            <button
              onClick={() => handleExecuteCommand('att-0')}
              disabled={isExecuting || deviceLocked}
              className="text-left hover:text-white hover:bg-[#181824] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
            >
              <span className="font-bold text-[#C084FC] group-hover:underline">[ATT-0]</span>
              <span className="truncate text-zinc-300">Exfiltrate All 5 Files</span>
            </button>
            {scenarios
              .filter((s) => s.id !== 'att-0')
              .slice(0, 12)
              .map((s, idx) => {
                const cmdKey = `att-${idx + 1}`;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleExecuteCommand(cmdKey)}
                    disabled={isExecuting || deviceLocked}
                    className="text-left hover:text-white hover:bg-[#181824] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
                  >
                    <span className="font-bold text-[#C084FC] group-hover:underline">
                      [{cmdKey.toUpperCase()}]
                    </span>
                    <span className="truncate text-zinc-300">{s.title.replace(/^Scenario \d+:\s*/, '')}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Linux Terminal Viewport */}
        <div
          ref={terminalBottomRef}
          style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
          className="flex-1 bg-[#060609] p-3 sm:p-4 overflow-y-auto space-y-1 text-xs font-mono min-h-[350px] max-h-[58vh] sm:max-h-[64vh]"
        >
          {terminalHistory.map((line, idx) => (
            <div
              key={idx}
              className={`leading-relaxed whitespace-pre-wrap break-words ${
                line.startsWith('┌──(') || line.startsWith('└─#')
                  ? 'text-[#38BDF8] font-bold pt-1 border-t border-[#171720] first:border-0'
                  : line.includes('ACCESS BLOCKED') || line.includes('dropped') || line.includes('refused')
                  ? 'text-[#EF4444] font-semibold'
                  : line.includes('EXPLOIT SUCCESSFUL') || line.includes('PENETRATION SUCCESSFUL') || line.includes('SAVED')
                  ? 'text-[#4ADE80] font-bold'
                  : line.includes('WARNING') || line.includes('LOCKING') || line.includes('REVERSE')
                  ? 'text-[#F87171] font-bold animate-pulse'
                  : line.startsWith('drwx') || line.startsWith('-rw-') || line.startsWith('total ')
                  ? 'text-[#A7F3D0]'
                  : line.startsWith('[*]')
                  ? 'text-[#C084FC]'
                  : 'text-[#E2E8F0]'
              }`}
            >
              {line}
            </div>
          ))}

          {/* Countdown in Terminal */}
          {countdown !== null && (
            <div className="p-2.5 rounded bg-[#2E1065] border border-[#9333EA] text-center text-sm font-black text-[#FFFFFF] animate-pulse my-2">
              [!] REVERSE LOCKDOWN ENGAGING IN: {countdown}...
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. CLEAN LINUX PWA INSTALL & LAUNCHER MODAL                       */}
      {/* ================================================================= */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E0E14] border border-[#2D1B4E] rounded-xl max-w-sm w-full font-mono text-xs text-zinc-300 shadow-2xl overflow-hidden">
            {/* Modal Titlebar */}
            <div className="bg-[#151520] border-b border-[#232332] px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block"></span>
                </div>
                <span className="font-bold text-white text-xs">install-pwa --package</span>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] text-zinc-400">
                Install Purple Hat Terminal as an autonomous Linux application:
              </p>

              {deferredPrompt && (
                <button
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        setIsPwaInstalled(true);
                        setShowInstallModal(false);
                      }
                      setDeferredPrompt(null);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#7E22CE] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>1-TAP INSTALL PWA APP</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleDownloadLauncher();
                  setShowInstallModal(false);
                }}
                className="w-full py-2 rounded-lg bg-[#1B1428] hover:bg-[#2A1B40] border border-[#7E22CE] text-white font-bold text-[11px] flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>DOWNLOAD LAUNCHER SHORTCUT (.HTML)</span>
              </button>

              <div className="space-y-1.5 text-[11px] bg-[#14141C] p-2.5 rounded-lg border border-[#232332]">
                <div className="font-bold text-white">Manual Installation:</div>
                <div className="text-zinc-400">
                  • <strong className="text-zinc-200">Android (Chrome):</strong> Tap 3 dots (⋮) ➔ Select <strong className="text-[#C084FC]">"Install app"</strong> or <strong className="text-[#C084FC]">"Add to Home screen"</strong>.
                </div>
                <div className="text-zinc-400">
                  • <strong className="text-zinc-200">iOS (Safari):</strong> Tap Share (<Share2 className="w-3 h-3 inline text-[#C084FC]" />) ➔ Select <strong className="text-[#C084FC]">"Add to Home Screen"</strong>.
                </div>
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202E] border border-[#2C2C3C] text-zinc-400 font-semibold text-xs"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. FULL SCREEN BLOCKDOWN (ONLY APPEARS DURING DARK AGENT ATTACK)  */}
      {/* ================================================================= */}
      {deviceLocked && (
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-[999999999] bg-[#000000] text-white flex items-center justify-center overflow-hidden select-none cursor-not-allowed font-mono w-screen h-screen"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            backgroundColor: '#000000'
          }}
        >
          {/* ONLY VIEW: THE EXACT BLOCK SCREEN IMAGE DISPLAYED EDGE-TO-EDGE FULL SCREEN */}
          <img
            src="/block-screen.jpg"
            alt="THIS DEVICE IS LOCKED BY DART"
            className="w-full h-full max-h-[100dvh] max-w-full object-contain sm:object-contain object-center select-none pointer-events-none"
            style={{
              maxWidth: '100vw',
              maxHeight: '100dvh',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              pointerEvents: 'none'
            }}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('block-screen.png')) {
                target.src = '/block-screen.png';
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AttackScenarios;
