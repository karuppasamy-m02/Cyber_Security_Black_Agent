import React, { useState, useEffect, useRef } from 'react';
import {
  CornerDownLeft,
  Skull,
  Download,
  Smartphone,
  Shield,
  Layers,
  Terminal,
  X,
  Share2,
  Check
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

  // Terminal History (High-contrast Black, White, and Purple)
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '[*] PURPLE HAT TERMINAL // C2 ADVERSARY CONSOLE INITIALIZED',
    '[*] Target gateway: 10.0.0.1 (All core ingress ports monitored)',
    '[*] Exfil node: /var/data/targets/exfil (5 Target Files Armed)',
    '[*] Quick Commands: "ls", "cat <file>", "att-0" to "att-12", "clear"',
    '[*] Type command above and tap RUN or tap the 1-TAP pills.'
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

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
        }
        setDeferredPrompt(null);
        return;
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
    body { margin:0; background:#000; color:#c084fc; font-family:monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; }
    .loader { border:3px solid #3b0764; border-top:3px solid #c084fc; border-radius:50%; width:36px; height:36px; animation:spin 1s linear infinite; margin-bottom:16px; }
    @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader"></div>
  <div style="font-size:14px;font-weight:bold;letter-spacing:2px;">LAUNCHING PURPLE HAT C2...</div>
  <script>
    setTimeout(function() {
      window.location.replace("${currentUrl}");
    }, 300);
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

    // Secret emergency override (7 rapid taps anywhere within 2.5 seconds unlocks)
    let secretTapCount = 0;
    let lastTapTime = 0;
    const registerSecretTap = () => {
      const now = Date.now();
      if (now - lastTapTime < 500) {
        secretTapCount += 1;
        if (secretTapCount >= 7) {
          setDeviceLocked(false);
          api.post('/agents/dark/release-lock').catch(() => {});
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        }
      } else {
        secretTapCount = 1;
      }
      lastTapTime = now;
    };

    // Complete block function for all user touch, pointer, and click interactions
    const blockInteraction = (e: Event) => {
      registerSecretTap();
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

  // Poll lock status from backend (released remotely by operator)
  const checkBackendLock = async () => {
    try {
      const res = await api.get<any>('/agents/dark/lock-status');
      if (res.is_locked && !deviceLocked && countdown === null) {
        startCountdownAndLock();
      } else if (!res.is_locked && deviceLocked) {
        setDeviceLocked(false);
        setTerminalHistory((prev) => [
          ...prev,
          '[+] REMOTE RELEASE CONFIRMED: Operator authorized unlock from Main Laptop.',
          '[+] Browser controls restored.'
        ]);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const host = window.location.hostname;
    setMobileIp(host === 'localhost' || host === '127.0.0.1' ? '10.108.192.176 (Mobile)' : host);

    fetchScenarios();
    fetchFiles();
    checkAgentStatus();
    checkBackendLock();

    const interval = setInterval(() => {
      checkAgentStatus();
      checkBackendLock();
    }, 1500);

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

  // 4. Command Router & Execution Logic (NO AUTO-ZOOM ON NORMAL COMMANDS!)
  const handleExecuteCommand = async (inputStr: string) => {
    const rawCmd = inputStr.trim();
    if (!rawCmd || isExecuting) return;

    // Normal command execution NEVER triggers fullscreen or zoom!

    const lower = rawCmd.toLowerCase();
    const promptPrefix = `purple-hat@terminal:${currentPath}# `;

    // CLEAR
    if (lower === 'clear' || lower === 'cls') {
      setTerminalHistory(['[*] Terminal screen cleared. Ready for Purple Hat commands.']);
      setCommandInput('');
      return;
    }

    // HELP
    if (lower === 'help') {
      setTerminalHistory((prev) => [
        ...prev,
        `${promptPrefix}${rawCmd}`,
        '=== PURPLE HAT TERMINAL COMMANDS ===',
        '  ls [-l]          : List target repository exfiltration files',
        '  cat <file>       : Inspect target file contents',
        '  cd <dir>         : Change current directory',
        '  pwd              : Print working directory',
        '  att-0            : Exfiltrate all 5 target files',
        '  att-1 to att-12  : Deploy attack vector scenarios',
        '  clear            : Clear viewport'
      ]);
      setCommandInput('');
      return;
    }

    // PWD
    if (lower === 'pwd') {
      setTerminalHistory((prev) => [
        ...prev,
        `${promptPrefix}${rawCmd}`,
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
        `${promptPrefix}${rawCmd}`,
        `Location updated: ${newPath}`
      ]);
      setCommandInput('');
      return;
    }

    // LS
    if (lower === 'ls' || lower.startsWith('ls ') || lower === 'dir') {
      const lines = [
        `${promptPrefix}${rawCmd}`,
        `total 5 files in ${currentPath}:`,
        `-rw-r--r-- 1 purple-hat c2-agent  482 Nov 24 07:45 recon_targets.txt`,
        `-rw-r--r-- 1 purple-hat c2-agent  512 Nov 24 07:45 customer_records.csv`,
        `-rw-r--r-- 1 purple-hat c2-agent  345 Nov 24 07:45 api_endpoints.conf`,
        `-rw-r--r-- 1 purple-hat c2-agent  418 Nov 24 07:45 system_architecture.json`,
        `-rw-r--r-- 1 purple-hat c2-agent  520 Nov 24 07:45 audit_log_2026.txt`
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
          `${promptPrefix}${rawCmd}`,
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
          `${promptPrefix}${rawCmd}`,
          `--- BEGIN ${found.filename} (${found.size} bytes) ---`,
          found.content,
          `--- END ${found.filename} ---`
        ]);
      } else {
        setTerminalHistory((prev) => [
          ...prev,
          `${promptPrefix}${rawCmd}`,
          `cat: ${filename}: No such file or directory. Run "ls" to view available files.`
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
        `${promptPrefix}${rawCmd}`,
        `[sudo] clearance verified for purple-hat operator.`
      ]);
    } else {
      setTerminalHistory((prev) => [...prev, `${promptPrefix}${rawCmd}`]);
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
        `[!] Command not recognized: "${commandToRun}". Type "help", "ls", "cat <file>", or "att-0" to "att-12".`
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
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-mono selection:bg-[#3B0764] selection:text-[#F3E8FF] flex flex-col p-2.5 sm:p-4 select-none relative max-w-5xl mx-auto">
      {/* ================================================================= */}
      {/* 1. TOP PURPLE HAT TERMINAL HEADING ONLY                           */}
      {/* ================================================================= */}
      <header className="border-b border-[#2A183E] pb-3 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2E1065] border border-[#7E22CE] flex items-center justify-center shadow-lg shadow-purple-950/60 shrink-0">
            <Skull className="w-4 h-4 text-[#C084FC] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-[#FFFFFF] drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              PURPLE HAT TERMINAL
            </h1>
            <div className="text-[10px] text-[#A855F7] flex items-center gap-2 font-mono">
              <span className="text-[#C084FC]">C2-OPERATOR</span>
              <span>•</span>
              <span className="text-[#FFFFFF] font-semibold">{mobileIp}</span>
              <span>•</span>
              <span className={isDarkActive ? 'text-emerald-400 font-bold' : 'text-[#A855F7]'}>
                {isDarkActive ? '● DECOY OPEN' : '● ARMORED'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Download / Install App Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-2.5 py-1.5 rounded-lg bg-[#2E1065] hover:bg-[#3B0764] border border-[#9333EA] text-[#FFFFFF] text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 active:scale-95 transition-all"
            title="Download & Install as Mobile App"
          >
            <Download className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="hidden sm:inline">
              {isPwaInstalled ? 'APP INSTALLED' : 'DOWNLOAD APP'}
            </span>
            <span className="sm:hidden">APP</span>
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. COMMAND ENTER IS TOP (NO MOBILE KEYBOARD OVERLAP, NO AUTO-ZOOM)*/}
      {/* ================================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecuteCommand(commandInput);
        }}
        className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-[#0B0414] border border-[#2A183E] shadow-lg shadow-purple-950/20"
      >
        <span className="text-xs sm:text-sm font-bold text-[#C084FC] pl-1 select-none shrink-0 font-mono">
          purple-hat#
        </span>
        <input
          ref={commandInputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          disabled={isExecuting || deviceLocked}
          placeholder="Type ls, cat <file>, att-0 to att-12..."
          style={{ fontSize: '16px' }} // Exactly 16px to prevent iOS Safari & Android zoom
          className="flex-1 bg-transparent text-sm sm:text-xs text-[#FFFFFF] placeholder-[#7E22CE] font-mono focus:outline-none min-w-0"
          autoFocus
        />

        <button
          type="submit"
          disabled={isExecuting || deviceLocked || !commandInput.trim()}
          className="px-3.5 py-1.5 rounded bg-[#2E1065] hover:bg-[#3B0764] disabled:opacity-40 text-xs font-bold text-[#FFFFFF] flex items-center gap-1 transition-colors shrink-0 shadow-sm"
        >
          <span>RUN</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* ================================================================= */}
      {/* 3. ATTACK CHEATSHEET & 1-TAP QUICK COMMAND PILLS (NO LOCK BUTTON) */}
      {/* ================================================================= */}
      <div className="p-2.5 rounded-lg bg-[#08030F] border border-[#2A183E] text-xs space-y-2 mb-2">
        <div className="text-[10px] sm:text-[11px] font-bold text-[#FFFFFF] flex items-center justify-between border-b border-[#1E0F30] pb-1">
          <span className="text-[#C084FC]">OFFENSIVE VECTORS &amp; SHELL UTILITIES</span>
          <span className="text-[#A855F7] text-[10px]">1-TAP TO RUN</span>
        </div>

        {/* 1-Tap Quick Action Pills (Lock button removed!) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-[10px] font-bold text-[#7E22CE] shrink-0">QUICK:</span>
          {['ls', 'cat recon_targets.txt', 'cat customer_records.csv', 'pwd', 'att-0', 'clear'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExecuteCommand(cmd)}
              disabled={isExecuting || deviceLocked}
              className="px-2.5 py-1 rounded font-mono text-[10px] shrink-0 transition-colors border bg-[#180A28] hover:bg-[#2E1065] border-[#3B195C] text-[#FFFFFF] font-semibold active:scale-95"
            >
              {cmd.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Attack Vector Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 text-[10px] sm:text-[11px] text-[#A855F7] pt-1 border-t border-[#1E0F30]">
          <button
            onClick={() => handleExecuteCommand('att-0')}
            disabled={isExecuting || deviceLocked}
            className="text-left hover:text-[#FFFFFF] hover:bg-[#180A28] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
          >
            <span className="font-bold text-[#C084FC] group-hover:underline">[ATT-0]</span>
            <span className="truncate text-[#E9D5FF]">Exfiltrate All 5 Files</span>
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
                  className="text-left hover:text-[#FFFFFF] hover:bg-[#180A28] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
                >
                  <span className="font-bold text-[#C084FC] group-hover:underline">
                    [{cmdKey.toUpperCase()}]
                  </span>
                  <span className="truncate text-[#E9D5FF]">{s.title.replace(/^Scenario \d+:\s*/, '')}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. TERMINAL LOG VIEWPORT (NATURAL SMOOTH TOUCH SCROLLING)        */}
      {/* ================================================================= */}
      <div
        ref={terminalBottomRef}
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
        className="flex-1 bg-[#05010A] border border-[#2A183E] rounded-lg p-3 overflow-y-auto space-y-1 text-xs font-mono min-h-[350px] max-h-[58vh] sm:max-h-[64vh]"
      >
        {terminalHistory.map((line, idx) => (
          <div
            key={idx}
            className={`leading-relaxed whitespace-pre-wrap break-words ${
              line.startsWith('purple-hat@terminal')
                ? 'text-[#FFFFFF] font-bold pt-1 border-t border-[#1E0F30] first:border-0'
                : line.includes('ACCESS BLOCKED') || line.includes('dropped')
                ? 'text-[#888888]'
                : line.includes('EXPLOIT SUCCESSFUL') || line.includes('SAVED') || line.includes('BEGIN')
                ? 'text-[#FFFFFF] font-bold'
                : line.includes('WARNING') || line.includes('LOCKING')
                ? 'text-[#FCA5A5] font-bold'
                : 'text-[#E9D5FF]'
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

      {/* ================================================================= */}
      {/* 5. PWA / MOBILE DOWNLOAD INSTRUCTION MODAL                        */}
      {/* ================================================================= */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F051D] border border-[#7E22CE] rounded-xl p-4 max-w-sm w-full space-y-3 font-mono text-xs text-[#E9D5FF] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A183E] pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#FFFFFF]">
                <Smartphone className="w-4 h-4 text-[#C084FC]" />
                <span>INSTALL PURPLE HAT APP</span>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-[#A855F7] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[#C4B5FD]">
              Install Purple Hat as a mobile web app or download the instant launcher:
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
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#7E22CE] to-[#9333EA] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4 text-white" />
                <span>1-TAP INSTALL NATIVE APP</span>
              </button>
            )}

            <button
              onClick={() => {
                handleDownloadLauncher();
                setShowInstallModal(false);
              }}
              className="w-full py-2 rounded-lg bg-[#2E1065] hover:bg-[#3B0764] border border-[#A855F7] text-white font-bold text-[11px] flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>DOWNLOAD LAUNCHER SHORTCUT (.HTML)</span>
            </button>

            <div className="space-y-2 text-[11px] bg-[#170A2E] p-2.5 rounded-lg border border-[#3B195C]">
              <div className="font-bold text-[#FFFFFF]">Option 2: Android (Chrome Menu):</div>
              <div>Tap the 3 dots (⋮) top-right ➔ Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</div>

              <div className="font-bold text-[#FFFFFF] pt-1 border-t border-[#2A183E]">Option 3: iOS (Safari Share):</div>
              <div>Tap Share (<Share2 className="w-3 h-3 inline text-[#C084FC]" />) at bottom ➔ Select <strong className="text-white">"Add to Home Screen"</strong>.</div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-1.5 rounded-lg bg-[#140624] hover:bg-[#1E0935] border border-[#4C1D95] text-[#C4B5FD] font-semibold text-xs"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. FULL SCREEN BLOCKDOWN (ONLY APPEARS DURING DARK AGENT ATTACK)  */}
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
