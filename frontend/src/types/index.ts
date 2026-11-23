export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: 'Administrator' | 'Security Analyst' | 'Viewer';
  is_active: boolean;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  event_hash: string;
  source_type: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  protocol?: string;
  event_category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
  raw_log: string;
  normalized_payload: Record<string, any>;
  is_simulated: boolean;
  created_at: string;
  risk_score?: number;
  layer3_class?: string;
}

export interface DetectionResult {
  id: string;
  event_id: string;
  layer1_rule_hits: string[];
  layer2_anomaly_score?: number;
  layer3_class?: string;
  layer3_confidence?: number;
  layer4_correlation_id?: string;
  final_risk_score: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  explanation_json: Record<string, any>;
  created_at: string;
}

export interface Incident {
  id: string;
  incident_code: string;
  title: string;
  description?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'False Positive';
  assigned_to_id?: string;
  assigned_to_name?: string;
  affected_asset?: string;
  mitre_tactics: string[];
  created_at: string;
  updated_at: string;
  event_count: number;
}

export interface ThreatIndicator {
  id: string;
  indicator_type: 'ip' | 'domain' | 'sha256' | 'md5';
  indicator_value: string;
  threat_score: number;
  malware_family?: string;
  mitre_technique?: string;
  description?: string;
  confidence: string;
  source_name?: string;
  created_at: string;
}

export interface MLModel {
  id: string;
  name: string;
  model_type: string;
  version: string;
  file_path: string;
  status: string;
  is_active: boolean;
  hyperparameters_json: Record<string, any>;
  feature_names: string[];
  created_at: string;
}

export interface MLEvaluation {
  id: string;
  model_id: string;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  pr_auc?: number;
  false_positive_rate?: number;
  latency_ms?: number;
  evaluation_dataset?: string;
  created_at: string;
}

export interface ResponseAction {
  id: string;
  incident_id?: string;
  action_type: string;
  target_entity: string;
  parameters_json: Record<string, any>;
  status: 'pending_approval' | 'approved' | 'executed' | 'rejected' | 'rolled_back';
  recommended_by: string;
  rollback_instructions?: string;
  created_at: string;
  approvals: Array<{
    id: string;
    approver_id: string;
    status: string;
    reason?: string;
    timestamp: string;
  }>;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_username: string;
  action_category: string;
  action_details: string;
  ip_address?: string;
  timestamp: string;
}
