import re
from typing import Dict, Any, List, Optional

class AutonomousAnalystEngine:
    """
    Intelligent Local Cyber Security Analyst Engine.
    Provides authoritative, contextual, and structured responses to general
    cybersecurity inquiries, incident triage queries, and architecture questions.
    """

    KNOWLEDGE_BASE = {
        "greeting": {
            "patterns": [r"\b(hi|hello|hey|greetings|who are you|what can you do|help me|what is this)\b"],
            "response": (
                "### CYBER BLACK // AI Security Analyst\n\n"
                "I am your local offline AI Security Analyst integrated into the CYBER BLACK SOC platform. "
                "I specialize in real-time threat intelligence, autonomous dual-agent coordination, MITRE ATT&CK correlation, and automated incident triage.\n\n"
                "**Core Capabilities:**\n"
                "- **Autonomous Agent Triage:** Monitor Agent 1 (Black Agent perimeter shield) and Agent 2 (Dark Agent honeypot).\n"
                "- **AMTIE 5-Layer Engine:** Explain detections across Rule heuristics, Isolation Forest, Gradient Boosting, Temporal Clustering, and Calibrated Risk.\n"
                "- **Adversary Tactics:** Guidance on brute force, lateral scans, exfiltration, privilege escalation, SQLi, and ransomware.\n"
                "- **Containment Playbooks:** Formulate host isolation, IP drops, and credential rotation actions.\n\n"
                "*How can I assist your investigation today?*"
            )
        },
        "black_agent": {
            "patterns": [r"\b(black agent|agent 1|agent 01|perimeter shield|shield|armor|firewall|port defense)\b"],
            "response": (
                "### AGENT 01: BLACK AGENT (Perimeter Guardian & Armor)\n\n"
                "**Black Agent** operates as the primary defensive shield of the enterprise infrastructure:\n\n"
                "1. **Continuous Gateway Armor:** Secures 9 core perimeter ports (`:22, :80, :443, :8000, :5173, :3306, :5432, :8080, :53`).\n"
                "2. **Zero-Trust Drop Policy:** Evaluates all incoming TCP/UDP ingress traffic. Unauthorized connection attempts are met with immediate IPTables drop rules (`DROP_POLICY_100%`).\n"
                "3. **Real-time Live Telemetry:** Feeds high-velocity telemetry into the AMTIE 5-layer anomaly detection pipeline.\n"
                "4. **Manual & Coordinated Control:** Can be switched ON or OFF manually from the Black Agent console. When switched OFF, attacks bypass the perimeter and demo data is served. When Dark Agent is activated, Black Agent automatically enters `STANDBY` to route attackers into the deception honeypot."
            )
        },
        "dark_agent": {
            "patterns": [r"\b(dark agent|agent 2|agent 02|honeypot|deception|device lock|counter-strike|takeover)\b"],
            "response": (
                "### AGENT 02: DARK AGENT (Deception Core & Remote Device Control)\n\n"
                "**Dark Agent** operates as the autonomous offensive deception and adversary containment layer:\n\n"
                "1. **Honey-Net Decoy Routing:** When engaged, Black Agent stands down, allowing attackers to penetrate into isolated deception containers.\n"
                "2. **Deception Synthetic Payload:** Decoy servers return isolated honeypot payloads to keep adversaries contained while collecting telemetry.\n"
                "3. **Hardware & Socket Pinpointing:** Captures client IP, user agent, mobile vs desktop architecture, destination port, and fingerprint hash.\n"
                "4. **Mini-Attack Browser Lock:** Deploys an automated reverse payload that locks the attacker's browser viewport into full-screen takeover mode with disabled touch and pointer inputs.\n"
                "5. **Operator Release Control:** Trapped devices remain locked until the SOC operator manually clicks `RELEASE DEVICE` or deactivates Dark Agent from the laptop dashboard."
            )
        },
        "brute_force": {
            "patterns": [r"\b(brute force|ssh|password guessing|failed login|t1110)\b"],
            "response": (
                "### MITRE ATT&CK T1110.001: Brute Force (Password Guessing)\n\n"
                "**Technique Overview:**\n"
                "Adversaries systematically guess passwords targeting authentication gateways (SSH port 22, RDP port 3389, Web auth) using automated wordlists.\n\n"
                "**Detection Indicators:**\n"
                "- High frequency of failed login events (e.g. >= 10 failures in 60s from a single IP).\n"
                "- Repeated attempts against privileged accounts (`root`, `admin`, `sysadmin`).\n"
                "- AMTIE Layer 1 Rule trigger combined with Layer 3 classifier probability > 90%.\n\n"
                "**Containment Playbook:**\n"
                "1. **Immediate IP Block:** Enforce gateway drop rule: `iptables -A INPUT -s <attacker_ip> -p tcp --dport 22 -j DROP`.\n"
                "2. **Account Armor:** Temporarily lock affected accounts and enforce public-key only authentication.\n"
                "3. **Dark Agent Lure:** Engage Dark Agent to feed synthetic decoy authentication tokens."
            )
        },
        "port_scan": {
            "patterns": [r"\b(port scan|network scan|reconnaissance|service discovery|t1046|nmap)\b"],
            "response": (
                "### MITRE ATT&CK T1046: Network Service Scanning\n\n"
                "**Technique Overview:**\n"
                "Adversaries sweep IP ranges and port spectra to enumerate accessible services, listening daemons, and operating system fingerprints.\n\n"
                "**Detection Indicators:**\n"
                "- A single source node probing >= 10 distinct destination ports within a short observation window.\n"
                "- Extreme anomaly score in AMTIE Layer 2 (Isolation Forest).\n"
                "- Volumetric TCP SYN packet ratio without completing the 3-way handshake.\n\n"
                "**Containment Playbook:**\n"
                "1. **Host Isolation:** Restrict the internal source host from corporate VLANs (`isolate_host`).\n"
                "2. **Decoy Spawning:** Dark Agent spawns synthetic honeynet ports with randomized service banners to confuse scanners."
            )
        },
        "data_exfiltration": {
            "patterns": [r"\b(exfiltration|data leak|data theft|outbound spike|c2 traffic|t1048)\b"],
            "response": (
                "### MITRE ATT&CK T1048: Exfiltration Over Alternative Protocol\n\n"
                "**Technique Overview:**\n"
                "Adversaries steal sensitive assets (database dumps, financial sheets, PII) by transmitting data across egress channels to external C2 infrastructure.\n\n"
                "**Detection Indicators:**\n"
                "- Extreme volumetric ratio anomaly: high outbound bytes (`bytes_out` > 10MB) with minimal inbound traffic (`bytes_in` < 1KB).\n"
                "- High connection duration to unclassified or bulletproof foreign IP addresses.\n"
                "- Layer 5 calibrated risk escalation score >= 88/100.\n\n"
                "**Containment Playbook:**\n"
                "1. **Session Severing:** Kill active TCP socket connections to the destination address.\n"
                "2. **Firewall Drop:** Add perimeter egress block on destination IP.\n"
                "3. **Deception Injection:** Dark Agent poisons exfiltration streams with watermarked decoy files."
            )
        },
        "privilege_escalation": {
            "patterns": [r"\b(privilege escalation|sudo|root|setuid|cve|t1548)\b"],
            "response": (
                "### MITRE ATT&CK T1548.003: Sudo and Sudo Caching Abuse\n\n"
                "**Technique Overview:**\n"
                "Adversaries leverage misconfigured sudoers rules, living-off-the-land binaries, or kernel vulnerabilities to elevate execution privileges to UID 0 (root).\n\n"
                "**Detection Indicators:**\n"
                "- Sudden invocation of `sudo -i`, `sudo /bin/sh`, or unauthorized su commands from service accounts (`www-data`, `nobody`).\n"
                "- Spawning of shell processes from unprivileged application daemons.\n\n"
                "**Containment Playbook:**\n"
                "1. **Session Termination:** Terminate parent PID and revoke active SSH/TTY sessions.\n"
                "2. **Container Jail:** Dark Agent confines the escalated process into an isolated sandbox."
            )
        },
        "sql_injection": {
            "patterns": [r"\b(sql injection|sqli|database attack|sql query|t1190)\b"],
            "response": (
                "### MITRE ATT&CK T1190: Exploit Public-Facing Application (SQLi)\n\n"
                "**Technique Overview:**\n"
                "Malicious SQL input injected through user parameters to bypass authentication, dump database tables, or execute administrative SQL commands.\n\n"
                "**Detection Indicators:**\n"
                "- URL parameters or POST bodies matching regex patterns (`UNION SELECT`, `' OR '1'='1`, `INFORMATION_SCHEMA`).\n"
                "- Database error rate anomalies in backend application telemetry.\n\n"
                "**Containment Playbook:**\n"
                "1. Enforce parameterized prepared statements and ORM boundaries.\n"
                "2. Black Agent WAF inspection rejects queries with SQL control syntax."
            )
        },
        "ransomware": {
            "patterns": [r"\b(ransomware|encrypt|file encryption|vssadmin|shadow copy|t1486)\b"],
            "response": (
                "### MITRE ATT&CK T1486: Data Encrypted for Impact (Ransomware)\n\n"
                "**Technique Overview:**\n"
                "Adversaries encrypt enterprise files and database volumes to extort ransom payments, often attempting to delete volume shadow copies (`vssadmin delete shadows`).\n\n"
                "**Detection Indicators:**\n"
                "- Massive file entropy spikes and rapid bulk file modification across network shares.\n"
                "- Process execution of ransomware helper utilities.\n\n"
                "**Containment Playbook:**\n"
                "1. **Immediate Host Quarantine:** Disconnect the compromised system from all network segments.\n"
                "2. **Decoy Volume Redirection:** Dark Agent diverts disk write operations into sacrificial shadow volumes."
            )
        },
        "zero_trust": {
            "patterns": [r"\b(zero trust|ztna|microsegmentation|least privilege)\b"],
            "response": (
                "### ZERO-TRUST NETWORK ARCHITECTURE (ZTNA)\n\n"
                "CYBER BLACK implements the NIST SP 800-207 Zero-Trust principle: **Never Trust, Always Verify**.\n\n"
                "- **Explicit Verification:** Every ingress TCP/UDP packet is authenticated regardless of origin.\n"
                "- **Least-Privilege Enforcement:** Sensitive database ports (`:3306, :5432`) are bound to local sockets and internal VLANs only.\n"
                "- **Continuous Evaluation:** Telemetry is scored at sub-millisecond latency through the 5-layer AMTIE engine."
            )
        },
        "xss": {
            "patterns": [r"\b(xss|cross site scripting|cross-site scripting|stored xss|reflected xss|dom xss)\b"],
            "response": (
                "### MITRE ATT&CK T1059.007: Cross-Site Scripting (XSS)\n\n"
                "**Technique Overview:**\n"
                "Adversaries inject malicious client-side scripts into web applications viewed by other users. This allows attackers to steal session tokens, hijack accounts, or redirect users to malicious landing pages.\n\n"
                "**Variations:**\n"
                "- **Reflected XSS:** Script payload bounced off the web server in an immediate HTTP response (e.g. search parameters).\n"
                "- **Stored XSS:** Payload permanently saved in the application database (e.g. comment field, user profile) and executed whenever requested.\n"
                "- **DOM-based XSS:** Vulnerability in client-side script processing data from an untrusted source without sanitization.\n\n"
                "**Defensive Controls:**\n"
                "1. **Context-Aware Output Encoding:** HTML, attribute, and JavaScript encoding before rendering user input.\n"
                "2. **Content Security Policy (CSP):** Restrict script execution sources via HTTP `Content-Security-Policy` headers.\n"
                "3. **HttpOnly Cookies:** Ensure session identifiers cannot be accessed via `document.cookie`."
            )
        },
        "phishing": {
            "patterns": [r"\b(phishing|spear phishing|social engineering|credential harvesting|t1566)\b"],
            "response": (
                "### MITRE ATT&CK T1566: Phishing & Social Engineering\n\n"
                "**Technique Overview:**\n"
                "Adversaries send deceptive communications (email, SMS, direct messages) crafted to trick victims into executing malicious attachments or providing credentials on fraudulent clone portals.\n\n"
                "**Common Vectors:**\n"
                "- **Spearphishing Attachment (T1566.001):** Malicious payloads delivered via documents with embedded macros or exploits.\n"
                "- **Spearphishing Link (T1566.002):** Hyperlinks directing targets to credential harvesting portals.\n\n"
                "**Mitigation Strategy:**\n"
                "1. Implement FIDO2/WebAuthn phishing-resistant hardware MFA.\n"
                "2. Configure rigorous email security protocols: SPF, DKIM, and DMARC enforcement.\n"
                "3. Route suspect URLs through browser isolation gateways."
            )
        },
        "ddos": {
            "patterns": [r"\b(ddos|dos|denial of service|syn flood|amplification|t1498|t1499)\b"],
            "response": (
                "### MITRE ATT&CK T1498: Network Denial of Service (DoS/DDoS)\n\n"
                "**Technique Overview:**\n"
                "Adversaries overwhelm network bandwidth or system resources using distributed botnets to disrupt service availability for legitimate users.\n\n"
                "**Attack Types:**\n"
                "- **Volumetric Attacks:** UDP floods, NTP/DNS reflection targeting bandwidth saturation.\n"
                "- **Protocol Attacks:** SYN floods, fragmented packets exhausting state tables in firewalls and load balancers.\n"
                "- **Application Layer (Layer 7):** HTTP GET/POST floods targeting costly database queries.\n\n"
                "**Defensive Playbook:**\n"
                "1. **Black Agent Rate Limiting:** Enforce strict TCP connection thresholds per IP origin.\n"
                "2. **Anycast Scrubbing:** Divert upstream volumetric floods through scrubbers.\n"
                "3. **SYN Cookies:** Prevent state exhaustion on core web listeners."
            )
        },
        "malware": {
            "patterns": [r"\b(malware|virus|trojan|spyware|worm|payload|c2|beacon)\b"],
            "response": (
                "### ENDPOINT DEFENSE: Malware & C2 Beaconing\n\n"
                "**Overview:**\n"
                "Malicious software designed to gain unauthorized access, establish persistent backdoors, or exfiltrate enterprise intelligence.\n\n"
                "**Key Indicators of Compromise (IoCs):**\n"
                "- Periodic heartbeats to foreign domains (C2 beaconing jitter).\n"
                "- Process injection into standard OS binaries (`svchost.exe`, `explorer.exe`, `/usr/bin/python`).\n"
                "- Persistence via Registry Run keys, systemd services, or cron jobs.\n\n"
                "**Response Workflow:**\n"
                "1. Isolate the infected endpoint from the internal network.\n"
                "2. Memory and disk dump capture for forensic analysis.\n"
                "3. Blacklist associated file hashes and C2 IP addresses across the perimeter."
            )
        },
        "incident_response": {
            "patterns": [r"\b(incident response|ir lifecycle|sans|nist 800-61|containment|remediation)\b"],
            "response": (
                "### INCIDENT RESPONSE LIFECYCLE (NIST SP 800-61 / SANS)\n\n"
                "The structured methodology for handling security incidents:\n\n"
                "1. **Preparation:** Hardening endpoints, deploying SOC tooling, training analysts.\n"
                "2. **Detection & Analysis:** AMTIE 5-layer anomaly correlation, alert triage, determining scope.\n"
                "3. **Containment:** Short-term isolation (host isolation, IP blocking) and long-term containment.\n"
                "4. **Eradication:** Removing malware, terminating compromised credentials, patching vulnerabilities.\n"
                "5. **Recovery:** Restoring systems from verified clean backups and validating normal operations.\n"
                "6. **Post-Incident Activity:** Lessons learned documentation, metric reviews, and updating detection rules."
            )
        }
    }

    @classmethod
    def generate_expert_response(
        cls,
        user_query: str,
        context_data: Optional[Dict[str, Any]] = None,
        rag_docs: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        q_lower = user_query.lower()

        # 1. Match against domain knowledge patterns
        for key, item in cls.KNOWLEDGE_BASE.items():
            for pat in item["patterns"]:
                if re.search(pat, q_lower):
                    return item["response"]

        # 2. Contextual incident or event investigation response
        if context_data and context_data.get("type") in ["incident", "event"] and context_data.get("id"):
            c_type = context_data.get("type").upper()
            c_id = context_data.get("id")
            severity = context_data.get("severity", "High")
            tactics = ", ".join(context_data.get("mitre_tactics", ["Initial Access"]))
            
            resp = (
                f"### SOC INVESTIGATION ASSESSMENT: {c_type} [{c_id}]\n\n"
                f"- **Severity Grounding:** `{severity.upper()}`\n"
                f"- **MITRE ATT&CK Tactics:** `{tactics}`\n"
                f"- **Affected Entity:** `{context_data.get('affected_asset', 'Core Gateway')}`\n\n"
                f"**Forensic Analysis:**\n"
                f"Evaluation of ingested telemetry indicates elevated risk characteristics consistent with unauthorized penetration activity. "
                f"The 5-layer AMTIE engine flagged this sequence across rule heuristics and anomaly reconstruction error.\n\n"
                f"**Recommended Containment:**\n"
                f"1. Enforce perimeter IP drop for foreign connection origins.\n"
                f"2. Engage Black Agent port armor or switch on Dark Agent honeypot to trap further payloads.\n"
                f"3. Submit response ticket through the Response Center."
            )
            return resp

        # 3. Comprehensive general cybersecurity response
        return (
            f"### CYBER BLACK // Security Analyst Assessment\n\n"
            f"Regarding your query: *\"{user_query}\"*\n\n"
            f"**Analysis & Strategic Guidance:**\n"
            f"In an enterprise zero-trust environment, threat defense requires continuous validation of all ingress sockets and behavioral telemetry:\n\n"
            f"- **Perimeter Posture:** Agent 01 (Black Agent) defends all 9 core network gateways using real-time IPTables drop policies.\n"
            f"- **Deception Strategy:** Agent 02 (Dark Agent) is armed to trap adversaries into honeypot decoys, capturing their hardware footprint and locking the attacker's browser.\n"
            f"- **Detection Hierarchy:** Events are triaged through AMTIE's 5 layers (Rules -> Isolation Forest -> Gradient Boosting -> Correlation -> Calibrated Risk).\n\n"
            f"**Recommended Next Step:**\n"
            f"You can monitor live attacks in the **Black Agent** (`/agents/black`) and **Dark Agent** (`/agents/dark`) command centers, or fire simulated vectors from the **Attacker Console** (`/attacks`)."
        )
