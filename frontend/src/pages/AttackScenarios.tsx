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
  const [mobileIp, setMobileIp] = useState<string>('192.168.1.8');
  const [currentPath, setCurrentPath] = useState<string>('/var/data/targets/exfil');
  const [capturedFiles, setCapturedFiles] = useState<TargetFile[]>(DEFAULT_TARGET_FILES);

  // Terminal History
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '[*] PURPLE HAT TERMINAL // C2 ADVERSARY CONSOLE INITIALIZED',
    '[*] Target gateway: 10.0.0.1 (Ports 22, 80, 443, 8000, 3306 monitored)',
    '[*] Exfil node: /var/data/targets/exfil (5 Target Files Armed)',
    '[*] Quick Commands: "ls", "cat <file>", "att-0" to "att-12", "clear"',
    '[*] Type "help" for full command guide or tap 1-TAP quick actions below.'
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Target Agents status
  const [agentStatus, setAgentStatus] = useState<any>(null);

  // Countdown & Lock State
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  // 2. ABSOLUTE GESTURE & SWIPE LOCKDOWN (Forward, Backward, Top, Bottom, Edge-Swipes)
  useEffect(() => {
    if (!deviceLocked) return;

    // Trap history so swipe back/forward or back button stays on lock page
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    // Completely cancel all touchmove events (stops pull-to-refresh & scroll)
    const preventTouch = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Cancel all touchstart with multi-touch (stops pinch/zoom gestures)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent wheel scrolling
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent navigation keys
    const preventKeys = (e: KeyboardEvent) => {
      if (
        ['F5', 'Escape', 'Backspace'].includes(e.key) ||
        (e.ctrlKey && ['r', 'R'].includes(e.key)) ||
        (e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key))
      ) {
        e.preventDefault();
      }
    };

    // Prevent context menu
    const preventContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('touchmove', preventTouch, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('wheel', preventWheel, { passive: false });
    window.addEventListener('keydown', preventKeys);
    window.addEventListener('contextmenu', preventContext);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('touchmove', preventTouch);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('wheel', preventWheel);
      window.removeEventListener('keydown', preventKeys);
      window.removeEventListener('contextmenu', preventContext);
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

  // Poll lock status from backend
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
    setMobileIp(host === 'localhost' || host === '127.0.0.1' ? '192.168.1.8 (Mobile)' : host);

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
  const startCountdownAndLock = () => {
    triggerFullscreen();
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
          `[!] 0: BROWSER LOCK ENGAGED // DEVICE FULLY CONTROLLED BY DEVIL DEFENSE.`
        ]);
        setDeviceLocked(true);
        triggerFullscreen();
      }
    }, 900);
  };

  // 4. Command Router & Execution Logic
  const handleExecuteCommand = async (inputStr: string) => {
    const rawCmd = inputStr.trim();
    if (!rawCmd || isExecuting) return;

    triggerFullscreen();

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
        '  lock             : Manually trigger browser lock demonstration',
        '  clear            : Clear viewport'
      ]);
      setCommandInput('');
      return;
    }

    // LOCK DEMO
    if (lower === 'lock' || lower === 'block') {
      setTerminalHistory((prev) => [
        ...prev,
        `${promptPrefix}${rawCmd}`,
        '[*] Manual lock initiated: Triggering Devil Browser Lock...'
      ]);
      startCountdownAndLock();
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
    <div className="min-h-screen bg-[#000000] text-[#E0E0E0] font-mono selection:bg-[#3B0764] selection:text-[#F3E8FF] flex flex-col justify-between p-2.5 sm:p-4 select-none relative max-w-5xl mx-auto">
      {/* ================================================================= */}
      {/* 1. TOP PURPLE HAT TERMINAL HEADING ONLY                           */}
      {/* ================================================================= */}
      <header className="border-b border-[#2A183E] pb-3 mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2E1065] border border-[#7E22CE] flex items-center justify-center shadow-lg shadow-purple-950/60 shrink-0">
            <Skull className="w-4 h-4 text-[#C084FC] animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-widest uppercase text-[#F3E8FF] drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              PURPLE HAT TERMINAL
            </h1>
            <div className="text-[10px] text-[#A855F7] flex items-center gap-2 font-mono">
              <span className="text-[#C084FC]">C2-OPERATOR</span>
              <span>•</span>
              <span className="text-[#E9D5FF]">{mobileIp}</span>
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
            className="px-2.5 py-1.5 rounded-lg bg-[#2E1065] hover:bg-[#3B0764] border border-[#9333EA] text-[#F3E8FF] text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 active:scale-95 transition-all"
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
      {/* 2. ATTACK CHEATSHEET & 1-TAP QUICK COMMAND PILLS                  */}
      {/* ================================================================= */}
      <div className="p-2.5 rounded-lg bg-[#08030F] border border-[#2A183E] text-xs space-y-2 mb-2">
        <div className="text-[10px] sm:text-[11px] font-bold text-[#F3E8FF] flex items-center justify-between border-b border-[#1E0F30] pb-1">
          <span className="text-[#C084FC]">OFFENSIVE VECTORS MATRIX &amp; SHELL UTILITIES</span>
          <span className="text-[#A855F7] text-[10px]">TAP TO DEPLOY</span>
        </div>

        {/* 1-Tap Quick Action Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-[10px] font-bold text-[#7E22CE] shrink-0">QUICK:</span>
          {['ls', 'cat recon_targets.txt', 'cat customer_records.csv', 'pwd', 'att-0', 'clear', 'lock'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleExecuteCommand(cmd)}
              disabled={isExecuting || deviceLocked}
              className={`px-2 py-0.5 rounded font-mono text-[10px] shrink-0 transition-colors border ${
                cmd === 'lock'
                  ? 'bg-red-950/80 hover:bg-red-900 border-red-700 text-red-200'
                  : 'bg-[#180A28] hover:bg-[#2E1065] border-[#3B195C] text-[#E9D5FF]'
              }`}
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
            className="text-left hover:text-[#F3E8FF] hover:bg-[#180A28] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
          >
            <span className="font-bold text-[#C084FC] group-hover:underline">[ATT-0]</span>
            <span className="truncate">Exfiltrate All 5 Files</span>
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
                  className="text-left hover:text-[#F3E8FF] hover:bg-[#180A28] p-1 rounded transition-colors flex items-center gap-1.5 truncate group"
                >
                  <span className="font-bold text-[#C084FC] group-hover:underline">
                    [{cmdKey.toUpperCase()}]
                  </span>
                  <span className="truncate">{s.title.replace(/^Scenario \d+:\s*/, '')}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. TERMINAL LOG VIEWPORT                                          */}
      {/* ================================================================= */}
      <div
        ref={terminalBottomRef}
        className="flex-1 bg-[#05010A] border border-[#2A183E] rounded-lg p-3 overflow-y-auto space-y-1 text-xs font-mono min-h-[300px] max-h-[52vh] sm:max-h-[58vh]"
      >
        {terminalHistory.map((line, idx) => (
          <div
            key={idx}
            className={`leading-relaxed whitespace-pre-wrap break-words ${
              line.startsWith('purple-hat@terminal')
                ? 'text-[#F3E8FF] font-bold pt-1 border-t border-[#1E0F30] first:border-0'
                : line.includes('ACCESS BLOCKED') || line.includes('dropped')
                ? 'text-[#888888]'
                : line.includes('EXPLOIT SUCCESSFUL') || line.includes('SAVED') || line.includes('BEGIN')
                ? 'text-[#E9D5FF] font-bold'
                : line.includes('WARNING') || line.includes('LOCKING')
                ? 'text-[#FCA5A5] font-bold'
                : 'text-[#C4B5FD]'
            }`}
          >
            {line}
          </div>
        ))}

        {/* Countdown in Terminal */}
        {countdown !== null && (
          <div className="p-2.5 rounded bg-[#2E1065] border border-[#9333EA] text-center text-sm font-black text-[#F3E8FF] animate-pulse my-2">
            [!] REVERSE LOCKDOWN ENGAGING IN: {countdown}...
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* 4. INTERACTIVE COMMAND INPUT BOX                                  */}
      {/* ================================================================= */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleExecuteCommand(commandInput);
        }}
        className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-[#0B0414] border border-[#2A183E]"
      >
        <span className="text-[11px] sm:text-xs font-bold text-[#C084FC] pl-1 select-none shrink-0">
          purple-hat#
        </span>
        <input
          ref={commandInputRef}
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          disabled={isExecuting || deviceLocked}
          placeholder="ls, cat <file>, att-0 to att-12, lock..."
          className="flex-1 bg-transparent text-xs text-[#F3E8FF] placeholder-[#6B21A8] font-mono focus:outline-none min-w-0"
          autoFocus
        />

        <button
          type="submit"
          disabled={isExecuting || deviceLocked || !commandInput.trim()}
          className="px-3 py-1.5 rounded bg-[#2E1065] hover:bg-[#3B0764] disabled:opacity-40 text-xs font-bold text-[#F3E8FF] flex items-center gap-1 transition-colors shrink-0"
        >
          <span>RUN</span>
          <CornerDownLeft className="w-3 h-3" />
        </button>
      </form>

      {/* ================================================================= */}
      {/* 5. PWA / MOBILE DOWNLOAD INSTRUCTION MODAL                        */}
      {/* ================================================================= */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F051D] border border-[#7E22CE] rounded-xl p-4 max-w-sm w-full space-y-3 font-mono text-xs text-[#E9D5FF] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A183E] pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#F3E8FF]">
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
              Run Purple Hat Terminal full-screen on your phone like a native app:
            </p>

            <div className="space-y-2 text-[11px] bg-[#170A2E] p-2.5 rounded-lg border border-[#3B195C]">
              <div className="font-bold text-[#F3E8FF]">Android (Chrome):</div>
              <div>Tap the menu (⋮) at top right ➔ Select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</div>

              <div className="font-bold text-[#F3E8FF] pt-1 border-t border-[#2A183E]">iOS (Safari):</div>
              <div>Tap the Share button (<Share2 className="w-3 h-3 inline text-[#C084FC]" />) at bottom ➔ Select <strong className="text-white">"Add to Home Screen"</strong>.</div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2 rounded-lg bg-[#2E1065] hover:bg-[#3B0764] border border-[#9333EA] text-white font-bold text-xs"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. DEVIL BROWSER BLOCKDOWN (ALL GESTURES / SWIPES IMPENETRABLE)   */}
      {/* ================================================================= */}
      {deviceLocked && (
        <div
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-[999999999] bg-[#050000] text-white flex flex-col justify-between items-center overflow-hidden select-none cursor-not-allowed font-mono w-screen h-screen"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            background: 'radial-gradient(circle at center, #350000 0%, #150000 55%, #050000 100%)'
          }}
        >
          {/* Animated Red Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 z-10"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.15) 0px, rgba(255, 0, 0, 0.15) 1px, transparent 1px, transparent 4px)',
              backgroundSize: '100% 4px',
              animation: 'redScanlines 8s linear infinite'
            }}
          />

          {/* Deep Blood-Red Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.92)_100%)] pointer-events-none z-10" />

          {/* 1. TOP HEADING: Centered inside a black banner with pulsing red neon borders */}
          <div
            className="w-full py-4 px-6 bg-black/95 border-b-2 z-30 flex items-center justify-center"
            style={{
              animation: 'borderPulse 2.5s ease-in-out infinite alternate'
            }}
          >
            <h1
              className="text-lg sm:text-2xl md:text-3xl font-black tracking-widest text-white uppercase text-center"
              style={{
                animation: 'neonFlicker 3s infinite'
              }}
            >
              YOUR BROWSER BLOCKED BY DEVIL
            </h1>
          </div>

          {/* 2. MAIN HEADING: DO NOT TOUCH with continuous smooth zigzag movement, subtle glitch & red neon glow */}
          <div className="flex-1 flex items-center justify-center relative w-full overflow-hidden z-20">
            <h2
              className="font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-widest text-white uppercase text-center select-none pointer-events-none"
              style={{
                animation: 'devilZigzag 4.5s ease-in-out infinite alternate, devilGlitch 3s infinite',
                willChange: 'transform'
              }}
            >
              DO NOT TOUCH
            </h2>
          </div>

          <style>{`
            @keyframes borderPulse {
              0%, 100% {
                border-color: #ff0000;
                box-shadow: 0 4px 20px rgba(255, 0, 0, 0.6), inset 0 -2px 10px rgba(255, 0, 0, 0.4);
              }
              50% {
                border-color: #ff3333;
                box-shadow: 0 6px 35px rgba(255, 0, 0, 0.9), inset 0 -3px 15px rgba(255, 0, 0, 0.6);
              }
            }

            @keyframes neonFlicker {
              0%, 100% {
                opacity: 1;
                text-shadow: 0 0 10px #ff3333, 0 0 20px #ff0000, 0 0 35px #b30000;
              }
              41% {
                opacity: 0.95;
                text-shadow: 0 0 6px #ff3333, 0 0 14px #ff0000;
              }
              42% {
                opacity: 1;
                text-shadow: 0 0 12px #ff3333, 0 0 26px #ff0000, 0 0 40px #b30000;
              }
              77% {
                opacity: 0.94;
              }
              78% {
                opacity: 1;
                text-shadow: 0 0 10px #ff3333, 0 0 20px #ff0000, 0 0 35px #b30000;
              }
            }

            @keyframes devilZigzag {
              0% {
                transform: translate3d(-18vw, -14vh, 0) rotate(-4deg);
              }
              25% {
                transform: translate3d(16vw, -4vh, 0) rotate(3deg);
              }
              50% {
                transform: translate3d(-15vw, 6vh, 0) rotate(-3deg);
              }
              75% {
                transform: translate3d(18vw, 15vh, 0) rotate(4deg);
              }
              100% {
                transform: translate3d(-12vw, 22vh, 0) rotate(-2deg);
              }
            }

            @keyframes devilGlitch {
              0%, 94%, 100% {
                text-shadow: 0 0 10px #ffffff, 0 0 25px #ff1a1a, 0 0 50px #ff0000, 0 0 90px #990000;
              }
              95% {
                text-shadow: -3px 0 #00ffff, 3px 0 #ff0055, 0 0 30px #ff0000;
                transform: translate3d(-18vw, -14vh, 0) skewX(-2deg);
              }
              96% {
                text-shadow: 3px 0 #00ffff, -3px 0 #ff0055, 0 0 40px #ff0000;
                transform: translate3d(-18vw, -14vh, 0) skewX(2deg);
              }
              97% {
                text-shadow: 0 0 10px #ffffff, 0 0 25px #ff1a1a, 0 0 50px #ff0000, 0 0 90px #990000;
              }
            }

            @keyframes redScanlines {
              0% {
                background-position: 0 0;
              }
              100% {
                background-position: 0 80px;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default AttackScenarios;
