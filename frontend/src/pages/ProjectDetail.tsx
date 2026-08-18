import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Cpu, 
  Save, Layers, FileText, Download,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { notification } from 'antd';

interface StructuredRequirements {
  business: {
    businessProblem: string;
    businessObjective: string;
    businessCriticality: 'Low' | 'Medium' | 'High' | 'Mission Critical';
    existingApplication?: string;
    existingTechnology?: string;
    currentPainPoints?: string;
  };
  users: {
    userCount?: number;
    userTypes?: string;
    geographicDistribution?: string;
    authenticationRequirements?: string;
  };
  workload: {
    requestsPerSecond?: number;
    requestsPerMinute?: number;
    requestsPerDay?: number;
    transactionsPerMonth?: number;
    peakTraffic?: string;
    averagePayloadSize?: string;
    fileSize?: string;
    dataVolume?: string;
  };
  availability: {
    requiredSLA?: string;
    rto?: string;
    rpo?: string;
    disasterRecoveryRequirements?: string;
    multiRegionRequirement?: boolean;
  };
  security: {
    authentication?: string;
    authorization?: string;
    sensitiveData?: string;
    compliance?: string;
    encryption?: string;
    networkIsolation?: boolean;
    privateConnectivity?: boolean;
  };
  integration: {
    existingAPIs?: string;
    erp?: string;
    crm?: string;
    sap?: string;
    sharepoint?: string;
    dataverse?: string;
    externalSystems?: string;
    thirdPartyAPIs?: string;
  };
  data: {
    relationalData?: boolean;
    noSqlData?: boolean;
    documents?: boolean;
    search?: boolean;
    analytics?: boolean;
    retentionPeriod?: string;
  };
  budget: {
    monthlyBudget?: number;
    maximumBudget?: number;
    costSensitivity?: 'Low' | 'Medium' | 'High';
  };
  development: {
    existingTeamSkills?: string;
    preferredLanguage?: string;
    existingCodebase?: string;
    deploymentModel?: string;
  };
}

interface CloudServiceComponent {
  serviceName: string;
  sku: string;
  region: string;
  category: 'Compute' | 'Database' | 'Storage' | 'Networking' | 'Integration' | 'Security' | 'Monitoring';
  usageMetric: string;
  estimatedUsageQuantity: number;
  unitPrice: number;
  monthlyCost: number;
  confidence: number;
  reasonSelected: string;
  alternativesRejected: string[];
}

interface ArchitectureOption {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  disadvantages: string[];
  complexity: 'Low' | 'Medium' | 'High';
  migrationEffort: 'Low' | 'Medium' | 'High';
  services: CloudServiceComponent[];
  diagram: {
    nodes: Array<{ id: string; type: string; label: string }>;
    edges: Array<{ source: string; target: string }>;
  };
  comparisonMatrix: {
    security: number;
    reliability: number;
    scalability: number;
    cost: number;
    complexity: number;
    maintainability: number;
    explanations: Record<string, string>;
  };
  wellArchitectedReview?: WAFReview;
  criticReview?: CriticReview;
}

interface WAFGap {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedComponent: string;
  whyItApplies: string;
  evidence: string;
  recommendation: string;
  confidence: 'High' | 'Medium' | 'Low';
}

interface WAFPillarReview {
  strengths: string[];
  gaps: WAFGap[];
}

interface WAFReview {
  scores: {
    security: number;
    reliability: number;
    costOptimization: number;
    operationalExcellence: number;
    performanceEfficiency: number;
  };
  pillars: {
    security: WAFPillarReview;
    reliability: WAFPillarReview;
    costOptimization: WAFPillarReview;
    operationalExcellence: WAFPillarReview;
    performanceEfficiency: WAFPillarReview;
  };
  isStale?: boolean;
}

interface CriticFinding {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  recommendation: string;
  affectedComponent: string;
  evidence: string;
  whyItApplies: string;
  missingInformation: string;
  confidence: 'High' | 'Medium' | 'Low';
  findingCategory: 'Critical Security' | 'Architecture Risk' | 'Governance Gap' | 'Optimization Opportunity' | 'Requires Validation';
}

interface CriticReview {
  findings: CriticFinding[];
  managedIdentityOpportunities: Array<{
    sourceService: string;
    targetService: string;
    canUseManagedIdentity: boolean;
    reason: string;
  }>;
  isStale?: boolean;
}

interface ADR {
  id: string;
  title: string;
  status: 'Proposed' | 'Accepted' | 'Rejected';
  context: string;
  decision: string;
  alternatives: string[];
  reasons: string[];
  impacts: {
    security: string;
    cost: string;
    reliability: string;
  };
  consequences: string;
  affectedOptionId?: string;
  whyItApplies?: string;
  confidence?: number;
  decisionDriver?: string;
  alternative?: string;
  reasonRejected?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  industry: string;
  cloudPreference: string;
  expectedUsers?: number;
  region: string;
  rawTextRequirements?: string;
  requirements: Array<{
    id: string;
    text: string;
    classification: string;
    confidence: number;
    source: string;
  }>;
  missingRequirements: Array<{
    field: string;
    importance: 'High' | 'Medium' | 'Low';
    description: string;
  }>;
  confidenceScore: {
    completeness: number;
    architecture: number;
    cost: number;
    security: number;
  };
  structuredRequirements: StructuredRequirements;
  architectureOptions: ArchitectureOption[];
  selectedOptionId?: string;
  wellArchitectedReview?: WAFReview;
  criticReview?: CriticReview;
  decisions: ADR[];
  costScenarios?: any;
  costScenariosStale?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pricing scenarios structure
interface ScenarioCostDetails {
  lowCost: number;
  expectedCost: number;
  highCost: number;
  components: Array<{
    serviceName: string;
    sku: string;
    category: string;
    unitPrice: number;
    unit: string;
    lowQty: number;
    expectedQty: number;
    highQty: number;
    lowCost: number;
    expectedCost: number;
    highCost: number;
    reasonSelected: string;
    costCategory?: 'Azure Infrastructure' | 'Microsoft Licensing' | 'External Licensing';
    sourceType?: 'Azure API' | 'Microsoft Published License' | 'External licensing / Assumed' | 'Requires customer contract' | 'Estimate / N/A';
  }>;
  warnings: string[];
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Async status indicators
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [generatingOptions, setGeneratingOptions] = useState<boolean>(false);
  const [calculatingCosts, setCalculatingCosts] = useState<boolean>(false);
  const [runningCritic, setRunningCritic] = useState<boolean>(false);
  const [runningWAF, setRunningWAF] = useState<boolean>(false);
  const [generatingADRs, setGeneratingADRs] = useState<boolean>(false);
  const [savingForm, setSavingForm] = useState<boolean>(false);
  const [updatingADRId, setUpdatingADRId] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);

  // Tab views
  const [activeTab, setActiveTab] = useState<'analysis' | 'specs' | 'options' | 'costs' | 'critic' | 'waf' | 'adr'>('analysis');

  // Specs form nav state
  const [activeSpecSection, setActiveSpecSection] = useState<string>('business');

  // Active option view selected
  const [selectedOptionView, setSelectedOptionView] = useState<string>('option-b');

  // Interactive Teach Me state
  const [expandedTeachMe, setExpandedTeachMe] = useState<Record<string, boolean>>({});

  // Cost Scenario calculations cache
  const [costsCache, setCostsCache] = useState<Record<string, ScenarioCostDetails> | null>(null);

  // Natural language gap correction state
  const [refinementInput, setRefinementInput] = useState('');
  const [activeMissingField, setActiveMissingField] = useState<string | null>(null);
  const [fieldAnswers, setFieldAnswers] = useState<Record<string, string>>({});

  // Editable raw text scope states
  const [isEditingRawText, setIsEditingRawText] = useState(false);
  const [editableRawText, setEditableRawText] = useState('');

  // Local state copy for Structured Requirements editing
  const [formRequirements, setFormRequirements] = useState<StructuredRequirements | null>(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (!response.ok) {
        throw new Error('Project not found.');
      }
      const data = await response.json();
      setProject(data);
      setFormRequirements(data.structuredRequirements);
      setCostsCache(data.costScenarios || null);
      
      // If options are already loaded, select the first available one as current view
      if (data.architectureOptions && data.architectureOptions.length > 0) {
        const defaultOpt = data.selectedOptionId || data.architectureOptions[0].id;
        setSelectedOptionView(defaultOpt);
      }
      
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch project details.');
    } finally {
      setLoading(false);
    }
  };

  // Actions trigger: Options Generation
  const handleGenerateOptions = async () => {
    if (!id) return;
    setGeneratingOptions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/architecture/generate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Options generation failed.');
      const updated = await response.json();
      setProject(updated);
      if (updated.architectureOptions?.length > 0) {
        setSelectedOptionView(updated.selectedOptionId || updated.architectureOptions[0].id);
      }
      notification.success({
        message: 'Architecture Options Generated',
        description: 'Three distinct solution options successfully built with layered topology flows.',
        placement: 'topRight'
      });
    } catch (err: any) {
      notification.error({
        message: 'Generation Failed',
        description: err.message || 'Could not model design options.',
        placement: 'topRight'
      });
    } finally {
      setGeneratingOptions(false);
    }
  };

  const handleSelectOptionView = async (optionId: string) => {
    setSelectedOptionView(optionId);
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOptionId: optionId })
      });
      if (response.ok) {
        const updated = await response.json();
        setProject(updated);
      }
    } catch (err) {
      console.error('Failed to sync selected option to database:', err);
    }
  };

  // Actions trigger: Cost Calculation
  const handleCalculateCosts = async () => {
    if (!id) return;
    setCalculatingCosts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/cost/calculate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Scenario pricing calculation failed.');
      const data = await response.json();
      setCostsCache(data);
      
      // Reload project to fetch updated service components pricing
      const projRes = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (projRes.ok) {
        const updatedProj = await projRes.json();
        setProject(updatedProj);
      }
      
      notification.success({
        message: 'Scenario Costs Calculated',
        description: 'Real-time retail price scenarios successfully loaded from the Azure Retail Prices API.',
        placement: 'topRight'
      });
    } catch (err: any) {
      notification.error({
        message: 'Pricing Calculation Failed',
        description: err.message || 'Failed to scale pricing models.',
        placement: 'topRight'
      });
    } finally {
      setCalculatingCosts(false);
    }
  };

  // Actions trigger: Security Critic
  const handleRunCritic = async () => {
    if (!id) return;
    setRunningCritic(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/critic/analyze`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Critic audit failed.');
      const updated = await response.json();
      setProject(updated);
      notification.success({
        message: 'Critic Audit Completed',
        description: 'Solution vulnerabilities assessed and Managed Identity opportunities checked.',
        placement: 'topRight'
      });
    } catch (err: any) {
      notification.error({
        message: 'Security Audit Failed',
        description: err.message || 'Hostile critic review execution failed.',
        placement: 'topRight'
      });
    } finally {
      setRunningCritic(false);
    }
  };

  // Actions trigger: Well-Architected Framework Review
  const handleRunWAF = async () => {
    if (!id) return;
    setRunningWAF(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/well-architected/review`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('WAF review failed.');
      const updated = await response.json();
      setProject(updated);
      notification.success({
        message: 'Well-Architected Review Complete',
        description: 'Azure WAF evaluation completed and scored against the five architecture pillars.',
        placement: 'topRight'
      });
    } catch (err: any) {
      notification.error({
        message: 'WAF Evaluation Failed',
        description: err.message || 'Well-Architected review execution failed.',
        placement: 'topRight'
      });
    } finally {
      setRunningWAF(false);
    }
  };

  // Actions trigger: ADR proposals
  const handleGenerateADRs = async () => {
    if (!id) return;
    setGeneratingADRs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/adr/generate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('ADR generation failed.');
      const updated = await response.json();
      setProject(updated);
      notification.success({
        message: 'Decision Logs Drafted',
        description: 'Architecture Decision Records (ADRs) compiled and proposed in your workspace.',
        placement: 'topRight'
      });
    } catch (err: any) {
      notification.error({
        message: 'ADR Proposal Failed',
        description: err.message || 'Failed to draft ADR logs.',
        placement: 'topRight'
      });
    } finally {
      setGeneratingADRs(false);
    }
  };

  // Accept or Reject an ADR
  const handleUpdateADR = async (adrId: string, newStatus: 'Accepted' | 'Rejected') => {
    if (!id) return;
    setUpdatingADRId(adrId);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/adr/${adrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update ADR status.');
      const updated = await response.json();
      setProject(updated);
    } catch (err: any) {
      notification.error({
        message: 'ADR Decision Update Failed',
        description: err.message || 'Failed to persist status change.',
        placement: 'topRight'
      });
    } finally {
      setUpdatingADRId(null);
    }
  };

  // Re-run standard requirements analysis
  const handleRunAnalysis = async (customRawText?: string) => {
    if (!id || !project) return;
    setAnalyzing(true);
    try {
      const payload: Record<string, any> = {};
      if (customRawText !== undefined) {
        payload.rawTextRequirements = customRawText;
      }

      const response = await fetch(`${API_BASE_URL}/projects/${id}/requirements/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to analyze requirements.');
      }

      const updated = await response.json();
      setProject(updated);
      setFormRequirements(updated.structuredRequirements);
      setRefinementInput('');
      setFieldAnswers({});
      setActiveMissingField(null);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis execution failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submits manual modifications of the structured specifications form
  const handleSaveSpecsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !id || !formRequirements) return;
    setSavingForm(true);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}/requirements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ structuredRequirements: formRequirements }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save requirements specifications.');
      }

      const updated = await response.json();
      setProject(updated);
      setFormRequirements(updated.structuredRequirements);
      setError(null);
      notification.success({
        message: 'Specifications Saved',
        description: 'Structured design requirements updated and completeness values re-scored.',
        placement: 'topRight'
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Saving specifications failed.');
    } finally {
      setSavingForm(false);
    }
  };

  // Submits gap correction inputs from the right sidebar panel
  const handleRefineGaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !id) return;

    let appendText = '';
    if (Object.keys(fieldAnswers).length > 0) {
      appendText = '\n\nRefined System Details:\n' + 
        Object.entries(fieldAnswers)
          .filter(([_, val]) => val.trim() !== '')
          .map(([key, val]) => `- ${key}: ${val}`)
          .join('\n');
    } else if (refinementInput.trim() !== '') {
      appendText = `\n\nRefined Details: ${refinementInput}`;
    }

    if (appendText.trim() === '') return;

    const updatedText = (project.rawTextRequirements || '') + appendText;
    await handleRunAnalysis(updatedText);
  };

  // Export whole solution design workspace as Markdown
  const handleExportMarkdown = () => {
    if (!project) return;
    let md = `# ArchitectAI Solution Architecture Design Report\n\n`;
    md += `**Project Name**: ${project.name}\n`;
    md += `**Industry**: ${project.industry}\n`;
    md += `**Cloud Preference**: ${project.cloudPreference}\n`;
    md += `**Region**: ${project.region}\n`;
    md += `**Generated At**: ${new Date().toLocaleString()}\n\n`;
    
    md += `## 1. Business Problem & Objective\n`;
    md += `* **Business Problem**: ${project.structuredRequirements?.business?.businessProblem || 'None'}\n`;
    md += `* **Business Objective**: ${project.structuredRequirements?.business?.businessObjective || 'None'}\n`;
    md += `* **Criticality**: ${project.structuredRequirements?.business?.businessCriticality || 'High'}\n\n`;
    
    if (project.architectureOptions && project.architectureOptions.length > 0) {
      md += `## 2. Recommended Architectural Options\n\n`;
      project.architectureOptions.forEach((opt) => {
        md += `### ${opt.name}\n`;
        md += `${opt.description}\n\n`;
        md += `**Complexity**: ${opt.complexity} | **Migration Effort**: ${opt.migrationEffort}\n\n`;
        
        md += `#### Services Component Blueprint:\n`;
        md += `| Service | SKU | Category | Selected Reason | Estimated Price |\n`;
        md += `| --- | --- | --- | --- | --- |\n`;
        opt.services.forEach((s) => {
          md += `| ${s.serviceName} | ${s.sku} | ${s.category} | ${s.reasonSelected} | $${s.monthlyCost}/mo |\n`;
        });
        md += `\n`;
      });
    }

    if (project.criticReview) {
      md += `## 3. Security Critic Audits & Risks\n\n`;
      project.criticReview.findings.forEach((f) => {
        md += `* **[${f.severity}] ${f.title}**: ${f.description}\n`;
        md += `  * *Recommendation*: ${f.recommendation}\n`;
      });
      md += `\n`;
    }

    if (project.decisions && project.decisions.length > 0) {
      md += `## 4. Architecture Decision Records (ADRs)\n\n`;
      project.decisions.forEach((d) => {
        md += `### [${d.id}] ${d.title} (Status: ${d.status})\n`;
        md += `* **Context**: ${d.context}\n`;
        md += `* **Decision**: ${d.decision}\n`;
        md += `* **Consequences**: ${d.consequences}\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-architecture-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreProgressBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getSuccessProbability = () => {
    if (!project) return 0;
    
    // Base probability starts at 50%
    let prob = 50;
    
    // 1. Add up to 20% based on form completeness
    const completeness = project.confidenceScore?.completeness || 0;
    prob += (completeness / 100) * 20;
    
    // Find active option
    const activeOptionId = project.selectedOptionId || 'option-a';
    const activeOption = project.architectureOptions?.find(opt => opt.id === activeOptionId);
    
    // 2. Add up to 15% based on WAF average score
    const activeWaf = activeOption?.wellArchitectedReview?.scores || project.wellArchitectedReview?.scores;
    if (activeWaf) {
      const wafScoresList = [
        activeWaf.security || 0,
        activeWaf.reliability || 0,
        activeWaf.costOptimization || 0,
        activeWaf.operationalExcellence || 0,
        activeWaf.performanceEfficiency || 0
      ];
      const avgWAF = wafScoresList.reduce((a, b) => a + b, 0) / 5;
      prob += (avgWAF / 5) * 15;
    }
    
    // 3. Add up to 15% based on accepted ADR decisions
    const decisions = project.decisions || [];
    const optionDecisions = decisions.filter(d => (d.affectedOptionId || 'option-a') === activeOptionId);
    if (optionDecisions.length > 0) {
      const accepted = optionDecisions.filter(d => d.status === 'Accepted').length;
      prob += (accepted / optionDecisions.length) * 15;
    }
    
    // 4. Subtract penalties for Security Critic findings
    const findings = activeOption?.criticReview?.findings || project.criticReview?.findings || [];
    findings.forEach((f: any) => {
      if (f.severity === 'Critical') prob -= 15;
      else if (f.severity === 'High') prob -= 8;
      else if (f.severity === 'Medium') prob -= 3;
      else if (f.severity === 'Low') prob -= 1;
    });
    
    // Bound between 10% and 100%
    return Math.max(10, Math.min(100, Math.round(prob)));
  };

  const getSeverityBadgeColor = (sev: 'Critical' | 'High' | 'Medium' | 'Low') => {
    if (sev === 'Critical') return 'bg-rose-500/20 border-rose-500/30 text-rose-400';
    if (sev === 'High') return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
    if (sev === 'Medium') return 'bg-amber-500/20 border-amber-500/30 text-amber-400';
    return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
  };

  const getSourceTypeBadge = (source: string) => {
    switch (source) {
      case 'Azure API':
        return 'bg-sky-500/15 border-sky-500/20 text-sky-400';
      case 'Microsoft Published License':
        return 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400';
      case 'External licensing / Assumed':
        return 'bg-amber-500/15 border-amber-500/20 text-amber-400';
      case 'Requires customer contract':
        return 'bg-rose-500/15 border-rose-500/20 text-rose-400';
      default:
        return 'bg-gray-500/15 border-gray-500/20 text-gray-400';
    }
  };

  // Safe nested value updater for form
  const updateFormField = (section: keyof StructuredRequirements, field: string, value: any) => {
    if (!formRequirements) return;
    setFormRequirements({
      ...formRequirements,
      [section]: {
        ...formRequirements[section],
        [field]: value
      }
    });
  };

  // Interactive SVG Diagram Renderer Node Positioning
  const renderInteractiveDiagram = (diagram: ArchitectureOption['diagram']) => {
    const nodes = diagram.nodes || [];
    const edges = diagram.edges || [];

    // Simple layered positioning logic
    // Categorize nodes by layers: Ingress -> Integration -> Compute -> Data/Outbound
    const getLayerIndex = (nodeType: string) => {
      const type = nodeType.toLowerCase();
      if (type.includes('powerapps') || type.includes('react') || type.includes('spa') || type === 'entra') return 0;
      if (type.includes('apim') || type.includes('powerautomate')) return 1;
      if (type.includes('azurefunctions') || type.includes('appservice') || type.includes('servicebus')) return 2;
      return 3; // database, sharepoint, erp
    };

    // Group nodes by layers
    const layers: Record<number, typeof nodes> = { 0: [], 1: [], 2: [], 3: [] };
    nodes.forEach(n => {
      const idx = getLayerIndex(n.type);
      layers[idx].push(n);
    });

    const width = 650;
    const height = 370;
    const nodeWidth = 140;
    const nodeHeight = 50;
    const layerSpacingY = 80;

    const nodeCoords: Record<string, { x: number; y: number }> = {};

    // Map positions
    Object.entries(layers).forEach(([layerIdx, layerNodes]) => {
      const lIdx = Number(layerIdx);
      const totalInLayer = layerNodes.length;
      const stepX = width / (totalInLayer + 1);
      
      layerNodes.forEach((node, nodeIdx) => {
        nodeCoords[node.id] = {
          x: Math.round(stepX * (nodeIdx + 1) - nodeWidth / 2),
          y: Math.round(50 + lIdx * layerSpacingY)
        };
      });
    });

    return (
      <div className="w-full overflow-x-auto p-4 bg-black/30 border border-white/5 rounded-xl">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[600px] h-[370px]">
          {/* Define Arrow Marker */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="#6d28d9" />
            </marker>
          </defs>

          {/* Draw Connection Edges */}
          {edges.map((edge, idx) => {
            const start = nodeCoords[edge.source];
            const end = nodeCoords[edge.target];
            if (!start || !end) return null;

            // Compute connection ports (Bottom of start to top of end)
            const sx = start.x + nodeWidth / 2;
            const sy = start.y + nodeHeight;
            const ex = end.x + nodeWidth / 2;
            const ey = end.y;

            // Draw curved line
            const dy = ey - sy;
            const pathData = `M ${sx} ${sy} C ${sx} ${sy + dy/2}, ${ex} ${ey - dy/2}, ${ex} ${ey}`;

            return (
              <path
                key={idx}
                d={pathData}
                fill="none"
                stroke="#4c1d95"
                strokeWidth={2}
                markerEnd="url(#arrow)"
                className="opacity-75 hover:opacity-100 hover:stroke-violet-500 transition-colors duration-200"
              />
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const coords = nodeCoords[node.id];
            if (!coords) return null;

            // Style node based on type
            let bgStyle = 'fill-[#1e1b4b] stroke-violet-500';
            if (node.type === 'powerapps' || node.type === 'powerautomate') bgStyle = 'fill-[#450a0a] stroke-rose-500';
            if (node.type === 'database' || node.type === 'sharepoint') bgStyle = 'fill-[#064e3b] stroke-emerald-500';

            return (
              <g key={node.id} transform={`translate(${coords.x}, ${coords.y})`} className="cursor-pointer group">
                <rect
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={8}
                  className={`${bgStyle} stroke-2 opacity-95 group-hover:opacity-100 transition-all`}
                />
                <text
                  x={nodeWidth / 2}
                  y={nodeHeight / 2 + 4}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  fontWeight="bold"
                  className="font-sans"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-violet-500"></div>
        <p className="text-gray-400 text-sm">Loading project context...</p>
      </div>
    );
  }

  if (error || !project || !formRequirements) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <p className="font-bold">Error loading workspace</p>
          <p className="text-xs mt-1">{error || 'Project data could not be retrieved.'}</p>
        </div>
      </div>
    );
  }

  const currentOptionData = project?.architectureOptions?.find(o => o.id === selectedOptionView);

  return (
    <div className="space-y-8">
      {/* Navigation & Toolbar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export Solution Report (MD)
          </button>
          
          <button
            onClick={() => handleRunAnalysis()}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            Re-Analyze requirements
          </button>
        </div>
      </div>

      {/* Project Banner */}
      <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">{project.name}</h2>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">{project.description || 'No summary context provided.'}</p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-md border border-white/5">
              Sector: {project.industry}
            </span>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-md border border-white/5">
              Platform: {project.cloudPreference}
            </span>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2.5 py-1 rounded-md border border-white/5">
              Region: {project.region}
            </span>
            {project.selectedOptionId && (
              <span className="text-[10px] bg-violet-600/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-md font-semibold">
                Option Selected: {
                  project.architectureOptions?.find(opt => opt.id === project.selectedOptionId)?.name || project.selectedOptionId
                }
              </span>
            )}
          </div>
        </div>

        {/* Project Confidence Widget */}
        <div className="flex flex-col justify-center min-w-[200px] p-4 rounded-lg bg-black/10 border border-white/5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Confidence</span>
          <span className={`text-3xl font-extrabold ${getScoreColor(getSuccessProbability())}`}>
            {getSuccessProbability()}%
          </span>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full ${getScoreProgressBg(getSuccessProbability())}`}
              style={{ width: `${getSuccessProbability()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="border-b border-white/5 flex flex-wrap gap-x-6 gap-y-2">
        {[
          { id: 'analysis', label: 'Analysis Workspace' },
          { id: 'specs', label: 'Structured Specs' },
          { id: 'options', label: 'Architecture Options' },
          { id: 'costs', label: 'Dynamic Cost Engine' },
          { id: 'critic', label: 'Critic & Security Review' },
          { id: 'waf', label: 'Well-Architected' },
          { id: 'adr', label: 'ADR Workspace' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB content 1: Analysis & Gaps */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Extracted Requirements ({project.requirements.length})
                </h3>
              </div>

              {project.requirements.length === 0 ? (
                <div className="text-center py-12">
                  <Cpu className="h-8 w-8 mx-auto text-gray-600 mb-2 animate-bounce" />
                  <p className="text-sm text-gray-400">No requirements extracted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.requirements.map((req) => (
                    <div 
                      key={req.id} 
                      className="p-4 rounded-lg bg-black/10 border border-white/5 hover:border-white/10 transition-colors flex items-start gap-4"
                    >
                      <span className="text-xs bg-violet-600/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded font-mono shrink-0">
                        {req.classification}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 leading-relaxed font-medium">{req.text}</p>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {req.confidence}% conf
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Raw Text Scope</h3>
                {!isEditingRawText ? (
                  <button
                    onClick={() => {
                      setEditableRawText(project.rawTextRequirements || '');
                      setIsEditingRawText(true);
                    }}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-300 rounded-md transition-all"
                  >
                    Edit Scope
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingRawText(false)}
                      className="px-2.5 py-1 bg-black/30 hover:bg-black/50 border border-white/5 text-[10px] font-bold text-gray-400 rounded-md transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        setIsEditingRawText(false);
                        await handleRunAnalysis(editableRawText);
                      }}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white rounded-md transition-all shadow-sm shadow-violet-500/20"
                    >
                      Save & Re-Analyze
                    </button>
                  </div>
                )}
              </div>

              <textarea
                readOnly={!isEditingRawText}
                rows={6}
                value={isEditingRawText ? editableRawText : (project.rawTextRequirements || '')}
                onChange={(e) => setEditableRawText(e.target.value)}
                className={`w-full p-4 rounded-lg text-xs font-mono leading-relaxed transition-all focus:outline-none ${
                  isEditingRawText 
                    ? 'bg-black/40 border-violet-500/40 text-gray-200 border shadow-inner' 
                    : 'bg-black/20 border-white/5 text-gray-400 resize-none'
                }`}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-300">Detected Design Gaps ({project.missingRequirements.length})</h3>
              </div>

              {project.missingRequirements.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  All vital design specifications gathered!
                </div>
              ) : (
                <div className="space-y-3">
                  {project.missingRequirements.map((mr) => (
                    <div 
                      key={mr.field}
                      onClick={() => setActiveMissingField(mr.field)}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        activeMissingField === mr.field 
                          ? 'bg-violet-600/10 border-violet-500/30' 
                          : 'bg-black/10 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-200">{mr.field}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{mr.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {project.missingRequirements.length > 0 && (
              <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Refine Design Specifications</h3>
                
                <form onSubmit={handleRefineGaps} className="space-y-4">
                  {activeMissingField ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-violet-400">Spec: {activeMissingField}</span>
                        <button type="button" onClick={() => setActiveMissingField(null)} className="text-[10px] text-gray-500">Reset</button>
                      </div>
                      <input
                        type="text"
                        value={fieldAnswers[activeMissingField] || ''}
                        onChange={(e) => setFieldAnswers({ ...fieldAnswers, [activeMissingField]: e.target.value })}
                        placeholder={`Enter details for ${activeMissingField}...`}
                        className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={refinementInput}
                        onChange={(e) => setRefinementInput(e.target.value)}
                        placeholder="Type details to fill missing gaps..."
                        className="w-full p-3 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={analyzing}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    Refine & Re-Analyze
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB content 2: Structured Requirements Form */}
      {activeTab === 'specs' && (
        <form onSubmit={handleSaveSpecsForm} className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            {[
              { id: 'business', name: 'Business Information' },
              { id: 'users', name: 'User Information' },
              { id: 'workload', name: 'Workload & Sizing' },
              { id: 'availability', name: 'Availability & DR' },
              { id: 'security', name: 'Security & Network' },
              { id: 'integration', name: 'System Integration' },
              { id: 'data', name: 'Data & Databases' },
              { id: 'budget', name: 'Budget & Cost' },
              { id: 'development', name: 'Development Team' }
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSpecSection(sec.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSpecSection === sec.id
                    ? 'bg-violet-600/10 border border-violet-500/20 text-violet-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {sec.name}
              </button>
            ))}

            {project && (
              <div className="p-3 mb-4 rounded-lg bg-black/20 border border-white/5 space-y-1.5 mt-4">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Form Completeness</span>
                  <span className={getScoreColor(project.confidenceScore.completeness)}>
                    {project.confidenceScore.completeness}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${getScoreProgressBg(project.confidenceScore.completeness)}`}
                    style={{ width: `${project.confidenceScore.completeness}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={savingForm}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save & Re-Score
              </button>
            </div>
          </div>

          <div className="md:col-span-3 rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 min-h-[450px]">
            {activeSpecSection === 'business' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Business Information</h3>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Business Problem</label>
                  <textarea
                    rows={3}
                    value={formRequirements.business.businessProblem}
                    onChange={(e) => updateFormField('business', 'businessProblem', e.target.value)}
                    className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Business Objective</label>
                  <textarea
                    rows={2}
                    value={formRequirements.business.businessObjective}
                    onChange={(e) => updateFormField('business', 'businessObjective', e.target.value)}
                    className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Business Criticality</label>
                    <select
                      value={formRequirements.business.businessCriticality}
                      onChange={(e) => updateFormField('business', 'businessCriticality', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Mission Critical">Mission Critical</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Existing Legacy Application</label>
                    <input
                      type="text"
                      value={formRequirements.business.existingApplication || ''}
                      onChange={(e) => updateFormField('business', 'existingApplication', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Existing Legacy Technology</label>
                    <input
                      type="text"
                      value={formRequirements.business.existingTechnology || ''}
                      onChange={(e) => updateFormField('business', 'existingTechnology', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Current Pain Points</label>
                  <textarea
                    rows={2}
                    value={formRequirements.business.currentPainPoints || ''}
                    onChange={(e) => updateFormField('business', 'currentPainPoints', e.target.value)}
                    className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {activeSpecSection === 'users' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Number of Active Users</label>
                    <input
                      type="number"
                      value={formRequirements.users.userCount || ''}
                      onChange={(e) => updateFormField('users', 'userCount', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">User Types</label>
                    <input
                      type="text"
                      value={formRequirements.users.userTypes || ''}
                      onChange={(e) => updateFormField('users', 'userTypes', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Geographic Distribution</label>
                    <input
                      type="text"
                      value={formRequirements.users.geographicDistribution || ''}
                      onChange={(e) => updateFormField('users', 'geographicDistribution', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Auth Requirements</label>
                    <input
                      type="text"
                      value={formRequirements.users.authenticationRequirements || ''}
                      onChange={(e) => updateFormField('users', 'authenticationRequirements', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSpecSection === 'workload' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Workload & Sizing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Transactions per Month</label>
                    <input
                      type="number"
                      value={formRequirements.workload.transactionsPerMonth || ''}
                      onChange={(e) => updateFormField('workload', 'transactionsPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Peak Traffic Volume</label>
                    <input
                      type="text"
                      value={formRequirements.workload.peakTraffic || ''}
                      onChange={(e) => updateFormField('workload', 'peakTraffic', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Requests per Second</label>
                    <input
                      type="number"
                      value={formRequirements.workload.requestsPerSecond || ''}
                      onChange={(e) => updateFormField('workload', 'requestsPerSecond', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Requests per Minute</label>
                    <input
                      type="number"
                      value={formRequirements.workload.requestsPerMinute || ''}
                      onChange={(e) => updateFormField('workload', 'requestsPerMinute', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Requests per Day</label>
                    <input
                      type="number"
                      value={formRequirements.workload.requestsPerDay || ''}
                      onChange={(e) => updateFormField('workload', 'requestsPerDay', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Average Payload Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 50 KB"
                      value={formRequirements.workload.averagePayloadSize || ''}
                      onChange={(e) => updateFormField('workload', 'averagePayloadSize', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">File Sizing / Uploads</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 MB average"
                      value={formRequirements.workload.fileSize || ''}
                      onChange={(e) => updateFormField('workload', 'fileSize', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Overall Data Volume</label>
                    <input
                      type="text"
                      placeholder="e.g. 500 GB"
                      value={formRequirements.workload.dataVolume || ''}
                      onChange={(e) => updateFormField('workload', 'dataVolume', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSpecSection === 'availability' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Availability & Disaster Recovery</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Required SLA</label>
                    <input
                      type="text"
                      placeholder="e.g. 99.9% or 99.99%"
                      value={formRequirements.availability.requiredSLA || ''}
                      onChange={(e) => updateFormField('availability', 'requiredSLA', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">RTO (Minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g. 240 (for 4 hours)"
                      value={formRequirements.availability.rto || ''}
                      onChange={(e) => updateFormField('availability', 'rto', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">RPO (Minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g. 60 (for 1 hour)"
                      value={formRequirements.availability.rpo || ''}
                      onChange={(e) => updateFormField('availability', 'rpo', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Disaster Recovery Requirements</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Active-passive failover with database backup logs replicated hourly."
                    value={formRequirements.availability.disasterRecoveryRequirements || ''}
                    onChange={(e) => updateFormField('availability', 'disasterRecoveryRequirements', e.target.value)}
                    className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="multiRegionRequirement"
                    checked={formRequirements.availability.multiRegionRequirement || false}
                    onChange={(e) => updateFormField('availability', 'multiRegionRequirement', e.target.checked)}
                    className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                  />
                  <label htmlFor="multiRegionRequirement" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Requires Multi-Region High-Availability Deployment
                  </label>
                </div>
              </div>
            )}

            {activeSpecSection === 'security' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Security & Networking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Authentication</label>
                    <input
                      type="text"
                      value={formRequirements.security.authentication || ''}
                      onChange={(e) => updateFormField('security', 'authentication', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Authorization</label>
                    <input
                      type="text"
                      value={formRequirements.security.authorization || ''}
                      onChange={(e) => updateFormField('security', 'authorization', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sensitive Data Handling</label>
                    <input
                      type="text"
                      placeholder="e.g. Encrypted PII in database"
                      value={formRequirements.security.sensitiveData || ''}
                      onChange={(e) => updateFormField('security', 'sensitiveData', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Compliance Standards</label>
                    <input
                      type="text"
                      placeholder="e.g. GDPR, HIPAA, SOC2"
                      value={formRequirements.security.compliance || ''}
                      onChange={(e) => updateFormField('security', 'compliance', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Encryption Types</label>
                    <input
                      type="text"
                      placeholder="e.g. AES-256 for data-at-rest, TLS 1.3 in-transit"
                      value={formRequirements.security.encryption || ''}
                      onChange={(e) => updateFormField('security', 'encryption', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="networkIsolation"
                      checked={formRequirements.security.networkIsolation || false}
                      onChange={(e) => updateFormField('security', 'networkIsolation', e.target.checked)}
                      className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                    />
                    <label htmlFor="networkIsolation" className="text-xs text-gray-300 font-semibold cursor-pointer">
                      Requires VNet Network Isolation / Firewall Rules
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="privateConnectivity"
                      checked={formRequirements.security.privateConnectivity || false}
                      onChange={(e) => updateFormField('security', 'privateConnectivity', e.target.checked)}
                      className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                    />
                    <label htmlFor="privateConnectivity" className="text-xs text-gray-300 font-semibold cursor-pointer">
                      Requires Private Connectivity / Private Endpoints (Private Link)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSpecSection === 'integration' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">System Integration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Existing APIs</label>
                    <input
                      type="text"
                      value={formRequirements.integration.existingAPIs || ''}
                      onChange={(e) => updateFormField('integration', 'existingAPIs', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">ERP System</label>
                    <input
                      type="text"
                      value={formRequirements.integration.erp || ''}
                      onChange={(e) => updateFormField('integration', 'erp', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">CRM System</label>
                    <input
                      type="text"
                      value={formRequirements.integration.crm || ''}
                      onChange={(e) => updateFormField('integration', 'crm', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">SAP Details</label>
                    <input
                      type="text"
                      value={formRequirements.integration.sap || ''}
                      onChange={(e) => updateFormField('integration', 'sap', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">SharePoint Connectors</label>
                    <input
                      type="text"
                      value={formRequirements.integration.sharepoint || ''}
                      onChange={(e) => updateFormField('integration', 'sharepoint', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Dataverse Tables</label>
                    <input
                      type="text"
                      value={formRequirements.integration.dataverse || ''}
                      onChange={(e) => updateFormField('integration', 'dataverse', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">External Systems</label>
                    <input
                      type="text"
                      value={formRequirements.integration.externalSystems || ''}
                      onChange={(e) => updateFormField('integration', 'externalSystems', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Third-Party APIs</label>
                    <input
                      type="text"
                      value={formRequirements.integration.thirdPartyAPIs || ''}
                      onChange={(e) => updateFormField('integration', 'thirdPartyAPIs', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSpecSection === 'data' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Data & Databases</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="relationalData"
                        checked={formRequirements.data.relationalData || false}
                        onChange={(e) => updateFormField('data', 'relationalData', e.target.checked)}
                        className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                      />
                      <label htmlFor="relationalData" className="text-xs text-gray-300 font-semibold cursor-pointer">
                        Structured Relational Data
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="noSqlData"
                        checked={formRequirements.data.noSqlData || false}
                        onChange={(e) => updateFormField('data', 'noSqlData', e.target.checked)}
                        className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                      />
                      <label htmlFor="noSqlData" className="text-xs text-gray-300 font-semibold cursor-pointer">
                        NoSQL Data Store (Document DB)
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="documents"
                        checked={formRequirements.data.documents || false}
                        onChange={(e) => updateFormField('data', 'documents', e.target.checked)}
                        className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                      />
                      <label htmlFor="documents" className="text-xs text-gray-300 font-semibold cursor-pointer">
                        Blob Document / File Storage
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="searchIndex"
                        checked={formRequirements.data.search || false}
                        onChange={(e) => updateFormField('data', 'search', e.target.checked)}
                        className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                      />
                      <label htmlFor="searchIndex" className="text-xs text-gray-300 font-semibold cursor-pointer">
                        Requires Search Indexing
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="analytics"
                        checked={formRequirements.data.analytics || false}
                        onChange={(e) => updateFormField('data', 'analytics', e.target.checked)}
                        className="h-4 w-4 bg-black border-white/10 rounded accent-violet-500 focus:outline-none"
                      />
                      <label htmlFor="analytics" className="text-xs text-gray-300 font-semibold cursor-pointer">
                        Requires Analytics / BI Reporting
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Retention Period</label>
                  <input
                    type="text"
                    placeholder="e.g. 7 years for compliance"
                    value={formRequirements.data.retentionPeriod || ''}
                    onChange={(e) => updateFormField('data', 'retentionPeriod', e.target.value)}
                    className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {activeSpecSection === 'budget' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Budget & Costs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Target Monthly Budget ($ USD)</label>
                    <input
                      type="number"
                      value={formRequirements.budget.monthlyBudget || ''}
                      onChange={(e) => updateFormField('budget', 'monthlyBudget', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Maximum Budget ($ USD)</label>
                    <input
                      type="number"
                      value={formRequirements.budget.maximumBudget || ''}
                      onChange={(e) => updateFormField('budget', 'maximumBudget', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cost Sensitivity</label>
                    <select
                      value={formRequirements.budget.costSensitivity || ''}
                      onChange={(e) => updateFormField('budget', 'costSensitivity', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Sensitivity --</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSpecSection === 'development' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300 border-b border-white/5 pb-2 mb-4">Development Context</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Existing Team Skills */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Existing Team Skills</label>
                    <select
                      value={formRequirements.development.existingTeamSkills || ''}
                      onChange={(e) => updateFormField('development', 'existingTeamSkills', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Skills Profile --</option>
                      <option value="Low-Code (Power Platform, Logic Apps, SharePoint)">Low-Code (Power Platform, Logic Apps, SharePoint)</option>
                      <option value="Full-Stack Web (JavaScript/TypeScript, React, Node.js)">Full-Stack Web (JavaScript/TypeScript, React, Node.js)</option>
                      <option value="Microsoft Enterprise (.NET, C#, Azure SQL)">Microsoft Enterprise (.NET, C#, Azure SQL)</option>
                      <option value="Cloud-Native Developer (Docker, Kubernetes, Go/Python)">Cloud-Native Developer (Docker, Kubernetes, Go/Python)</option>
                      <option value="Hybrid / Mixed Skillsets">Hybrid / Mixed Skillsets</option>
                    </select>
                  </div>

                  {/* Preferred Programming Language */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Preferred Language</label>
                    <select
                      value={formRequirements.development.preferredLanguage || ''}
                      onChange={(e) => updateFormField('development', 'preferredLanguage', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Language Preference --</option>
                      <option value="TypeScript / JavaScript">TypeScript / JavaScript</option>
                      <option value="C# (.NET)">C# (.NET)</option>
                      <option value="Python">Python</option>
                      <option value="Power Fx / Low-code Expressions">Power Fx / Low-code Expressions</option>
                      <option value="Go / Java">Go / Java</option>
                    </select>
                  </div>

                  {/* Existing Codebase State */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Existing Codebase</label>
                    <select
                      value={formRequirements.development.existingCodebase || ''}
                      onChange={(e) => updateFormField('development', 'existingCodebase', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Codebase State --</option>
                      <option value="None / Greenfield Project">None / Greenfield Project</option>
                      <option value="Legacy SharePoint / Power Apps Portal">Legacy SharePoint / Power Apps Portal</option>
                      <option value="Monolithic Web Application (.NET Framework / Java)">Monolithic Web Application (.NET Framework / Java)</option>
                      <option value="Decoupled Microservices API">Decoupled Microservices API</option>
                      <option value="N/A - Brand New Solution">N/A - Brand New Solution</option>
                    </select>
                  </div>

                  {/* Target Deployment Model */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Deployment Model</label>
                    <select
                      value={formRequirements.development.deploymentModel || ''}
                      onChange={(e) => updateFormField('development', 'deploymentModel', e.target.value)}
                      className="w-full px-3 py-2 bg-[#080c14] border border-white/5 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- Select Deployment Model --</option>
                      <option value="Manual Deployments (Ad-hoc Azure Portal configs)">Manual Deployments (Ad-hoc Azure Portal configs)</option>
                      <option value="Automated CI/CD (GitHub Actions, Azure DevOps)">Automated CI/CD (GitHub Actions, Azure DevOps)</option>
                      <option value="Infrastructure as Code (Terraform, Bicep)">Infrastructure as Code (Terraform, Bicep)</option>
                      <option value="Mixed / Hybrid Deployment Pipelines">Mixed / Hybrid Deployment Pipelines</option>
                    </select>
                  </div>

                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* TAB content 3: Architecture Options */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          {(!project?.architectureOptions || project?.architectureOptions.length === 0) ? (
            <div className="p-8 rounded-xl bg-[#0d1321]/50 border border-white/5 text-center space-y-4">
              <Layers className="h-10 w-10 mx-auto text-gray-600 animate-pulse" />
              <h3 className="text-sm font-bold text-gray-300">Generate Recommended Architectures</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No solution models have been constructed yet. Click below to analyze your requirements and build 3 distinct options (SaaS, Hybrid, PaaS) with network flow diagrams.
              </p>
              <button
                onClick={handleGenerateOptions}
                disabled={generatingOptions}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-bold rounded-lg transition-colors"
              >
                {generatingOptions ? 'Generating Design Models...' : 'Generate Architectural Options'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Selector list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">Design Alternatives</span>
                {project?.architectureOptions?.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOptionView(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      selectedOptionView === opt.id
                        ? 'bg-violet-600/10 border-violet-500/30 text-violet-400 shadow-lg'
                        : 'bg-[#0d1321]/30 border-white/5 hover:border-white/10 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xs font-bold block mb-1">{opt.name}</span>
                    <span className="text-[10px] text-gray-500 block">Complexity: {opt.complexity} | Migration: {opt.migrationEffort}</span>
                  </button>
                ))}

                <div className="pt-6 px-1">
                  <button
                    onClick={handleGenerateOptions}
                    disabled={generatingOptions}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${generatingOptions ? 'animate-spin' : ''}`} />
                    Re-Generate Options
                  </button>
                </div>
              </div>

              {/* Right Details Workspace */}
              {currentOptionData && (
                <div className="lg:col-span-3 space-y-6">
                  {/* Option Title & Description */}
                  <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-gray-200">{currentOptionData.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{currentOptionData.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Advantages</span>
                        <ul className="list-disc pl-4 text-xs text-gray-300 space-y-1.5">
                          {currentOptionData.benefits.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-2">Disadvantages</span>
                        <ul className="list-disc pl-4 text-xs text-gray-300 space-y-1.5">
                          {currentOptionData.disadvantages.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Flow Diagram Graph SVG */}
                  <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solution Flow Diagram</span>
                      <span className="text-[10px] text-gray-600">Generated Node Network Graph</span>
                    </div>
                    {renderInteractiveDiagram(currentOptionData.diagram)}
                  </div>

                  {/* Teach Me Collapsible Mode */}
                  <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-violet-400" />
                      <h4 className="text-sm font-bold text-gray-200">"Teach Me" - Educational Service Analysis</h4>
                    </div>

                    <div className="space-y-3">
                      {currentOptionData.services.map((s, idx) => (
                        <div key={idx} className="border border-white/5 rounded-lg bg-black/20 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedTeachMe({
                              ...expandedTeachMe,
                              [`${s.serviceName}-${idx}`]: !expandedTeachMe[`${s.serviceName}-${idx}`]
                            })}
                            className="w-full text-left p-3.5 flex justify-between items-center text-xs font-semibold text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            <span>Why select {s.serviceName} ({s.sku})?</span>
                            {expandedTeachMe[`${s.serviceName}-${idx}`] ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                          </button>

                          {expandedTeachMe[`${s.serviceName}-${idx}`] && (
                            <div className="p-4 border-t border-white/5 text-xs space-y-3 bg-[#080c14]">
                              <p className="text-gray-300 leading-relaxed"><strong className="text-violet-400">Decision Context:</strong> {s.reasonSelected}</p>
                              {s.alternativesRejected && s.alternativesRejected.length > 0 && (
                                <p className="text-gray-400 leading-relaxed">
                                  <strong className="text-rose-400">Alternatives Rejected:</strong> {s.alternativesRejected.join(', ')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Matrix score radar details */}
                  <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Metrics Matrix Evaluation</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
                      {[
                        { label: 'Security', val: currentOptionData.comparisonMatrix.security, exp: currentOptionData.comparisonMatrix.explanations.security },
                        { label: 'Reliability', val: currentOptionData.comparisonMatrix.reliability, exp: currentOptionData.comparisonMatrix.explanations.reliability },
                        { label: 'Scalability', val: currentOptionData.comparisonMatrix.scalability, exp: currentOptionData.comparisonMatrix.explanations.scalability },
                        { label: 'Cost', val: currentOptionData.comparisonMatrix.cost, exp: currentOptionData.comparisonMatrix.explanations.cost },
                        { label: 'Complexity', val: currentOptionData.comparisonMatrix.complexity, exp: currentOptionData.comparisonMatrix.explanations.complexity },
                        { label: 'Maintainability', val: currentOptionData.comparisonMatrix.maintainability, exp: currentOptionData.comparisonMatrix.explanations.maintainability }
                      ].map((score) => (
                        <div key={score.label} className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-1">
                          <span className="text-[10px] text-gray-500 font-bold block uppercase">{score.label}</span>
                          <span className="text-xl font-extrabold text-violet-400 block">{score.val}/5</span>
                          <span className="text-[8px] text-gray-400 block leading-tight">{score.exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB content 4: Cost Engine */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          {project?.costScenariosStale === true && costsCache && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>
                <strong>Requirements Updated:</strong> Stated user count, workload, or storage parameters have changed since scenario costs were estimated. Please click <strong>Recalculate Scenarios & Pricing</strong> to refresh the bill of materials.
              </span>
            </div>
          )}

          <div className="flex justify-between items-center bg-[#0d1321]/50 p-4 border border-white/5 rounded-xl flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Deterministic Cost Estimator</h3>
              <p className="text-[10px] text-gray-400">Azure pricing fetches from real meters of Microsoft Retail Prices API.</p>
            </div>
            
            {(() => {
              const hasCosts = !!costsCache;
              const isCostsStale = project?.costScenariosStale === true;

              let buttonText = 'Calculate Scenarios & Pricing';
              let isDisabled = false;

              if (calculatingCosts) {
                buttonText = 'Pricing Scenarios...';
                isDisabled = true;
              } else if (hasCosts) {
                if (isCostsStale) {
                  buttonText = 'Recalculate Scenarios & Pricing';
                  isDisabled = false;
                } else {
                  buttonText = 'Pricing Completed';
                  isDisabled = true;
                }
              }

              return (
                <button
                  onClick={handleCalculateCosts}
                  disabled={isDisabled}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${calculatingCosts ? 'animate-spin' : ''}`} />
                  {buttonText}
                </button>
              );
            })()}
          </div>

          {costsCache ? (
            <div className="space-y-6">
              {/* Cost Scenarios Comparison Matrix Table */}
              <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-4">Monthly Workload Scenario Matrix</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider font-bold">
                        <th className="py-2.5">Architecture Option</th>
                        <th>Low Cost (100 Users)</th>
                        <th>Expected Cost ({project.structuredRequirements?.users?.userCount || 1000} Users)</th>
                        <th>High Cost Spikes (5x Users)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {project?.architectureOptions?.map((opt) => {
                        const result = costsCache?.[opt.id];
                        if (!result) return null;
                        
                        return (
                          <tr key={opt.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 font-semibold text-violet-400">{opt.name}</td>
                            <td>${result.lowCost}/month</td>
                            <td className="font-bold text-gray-100">${result.expectedCost}/month</td>
                            <td>${result.highCost}/month</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning Panels Block */}
              {project?.architectureOptions?.map((opt) => {
                const result = costsCache?.[opt.id];
                if (!result || result.warnings.length === 0) return null;
                
                return (
                  <div key={opt.id} className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-amber-400 uppercase block">Budget Alerts: {opt.name}</span>
                    {result.warnings.map((w, idx) => (
                      <p key={idx} className="text-xs text-amber-300 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {w}
                      </p>
                    ))}
                  </div>
                );
              })}

              {/* Component breakdown details under Selected View */}
              {costsCache?.[selectedOptionView] && (
                <div className="p-6 rounded-xl bg-[#0d1321]/50 border border-white/5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Service Bill of Materials
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {project?.architectureOptions?.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOptionView(opt.id)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                            selectedOptionView === opt.id
                              ? 'bg-violet-600/25 border-violet-500 text-violet-400 font-extrabold shadow-sm shadow-violet-500/10'
                              : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {['Azure Infrastructure', 'Microsoft Licensing', 'External Licensing'].map((catName) => {
                      const categoryComponents = (costsCache?.[selectedOptionView]?.components || []).filter(
                        (c) => (c.costCategory || 'Azure Infrastructure') === catName
                      );
                      if (categoryComponents.length === 0) return null;
                      return (
                        <div key={catName} className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-violet-500 pl-2 mb-2">
                            {catName === 'Microsoft Licensing' ? 'Microsoft SaaS/PaaS Licensing' : catName === 'External Licensing' ? 'External Integrations Licensing' : 'Azure Infrastructure Estimates'}
                          </h5>
                          <div className="space-y-2.5">
                            {categoryComponents.map((c, idx) => (
                              <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-lg flex flex-col md:flex-row justify-between gap-3 text-xs">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="text-gray-200">{c.serviceName}</strong>
                                    <span className="text-[10px] text-gray-500">({c.sku} in {project?.region})</span>
                                    {c.sourceType && (
                                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${getSourceTypeBadge(c.sourceType)}`}>
                                        {c.sourceType}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1 max-w-xl">{c.reasonSelected}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  {c.unit === 'Cannot fetch' ? (
                                    <span className="text-rose-400 font-bold block">
                                      {catName === 'External Licensing' ? 'Requires Custom Licensing' : 'Cannot fetch pricing'}
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-[10px] text-gray-400 block">Rate: ${c.unitPrice} per {c.unit}</span>
                                      <strong className="text-violet-400 block mt-1">Expected: ${c.expectedCost}/month</strong>
                                      <span className="text-9px text-gray-500 block">Low: ${c.lowCost} | High: ${c.highCost}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Totals Row */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/10 p-3 rounded-lg">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Selected Architecture Total Estimate:
                    </span>
                    <div className="flex gap-4 text-xs">
                      {costsCache[selectedOptionView]?.components?.some(
                        (comp) => comp.costCategory === 'External Licensing' || comp.unit === 'Cannot fetch'
                      ) ? (
                        <div className="text-right py-1 flex flex-col items-end">
                          <span className="text-amber-400 font-extrabold text-xs">Estimated Monthly Total: [Requires customer data]</span>
                          <span className="text-gray-400 text-[9px] mt-0.5 font-semibold">Confidence: Medium (External systems / Custom Microsoft licensing not finalized)</span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] text-gray-500 block">Low Scenario</span>
                            <strong className="text-gray-300">${costsCache[selectedOptionView].lowCost}/mo</strong>
                          </div>
                          <div className="border-l border-white/10 pl-4">
                            <span className="text-[10px] text-violet-400 block font-bold">Expected Scenario</span>
                            <strong className="text-violet-400 text-sm font-extrabold">${costsCache[selectedOptionView].expectedCost}/mo</strong>
                          </div>
                          <div className="border-l border-white/10 pl-4">
                            <span className="text-[10px] text-gray-500 block">High Scenario</span>
                            <strong className="text-gray-300">${costsCache[selectedOptionView].highCost}/mo</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs bg-black/10 border border-white/5 rounded-xl">
              No cost analysis run. Click "Calculate Scenarios & Pricing" to fetch Azure Prices and estimate workload scenarios.
            </div>
          )}
        </div>
      )}

      {/* TAB content 5: Security Critic */}
      {activeTab === 'critic' && (
        <div className="space-y-6">
          {(() => {
            const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
            const activeCritic = activeOption?.criticReview;
            const isCriticStale = activeCritic?.isStale === true;

            if (isCriticStale) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>Requirements Updated:</strong> The architecture specifications have been modified since this security review was executed. Please click <strong>Regenerate Critic Review</strong> to update the findings.
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex justify-between items-center bg-[#0d1321]/50 p-4 border border-white/5 rounded-xl flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Enterprise Hostile Critic Review</h3>
              <p className="text-[10px] text-gray-400">Identifies network exposure vulnerabilities and Managed Identity paths.</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Option Selected:</span>
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold">
                  {project?.architectureOptions?.find(opt => opt.id === (project.selectedOptionId || 'option-a'))?.name || 'Option A'}
                </span>
              </div>
            </div>
            
            {(() => {
              const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
              const activeCritic = activeOption?.criticReview;
              const hasCritic = !!activeCritic;
              const isCriticStale = activeCritic?.isStale === true;

              let buttonText = 'Run Critic Review';
              let isDisabled = false;

              if (runningCritic) {
                buttonText = 'Evaluating vulnerabilities...';
                isDisabled = true;
              } else if (hasCritic) {
                if (isCriticStale) {
                  buttonText = 'Regenerate Critic Review';
                  isDisabled = false;
                } else {
                  buttonText = 'Review Completed';
                  isDisabled = true;
                }
              }

              return (
                <button
                  onClick={handleRunCritic}
                  disabled={isDisabled}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {buttonText}
                </button>
              );
            })()}
          </div>

          {(() => {
            const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
            const activeCritic = activeOption?.criticReview;

            return activeCritic ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Findings list */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-6">
                    {[
                      { id: 'Critical Security', title: 'Critical Security Issues', text: 'text-rose-400' },
                      { id: 'Architecture Risk', title: 'Architecture Risks', text: 'text-orange-400' },
                      { id: 'Governance Gap', title: 'Governance Gaps', text: 'text-amber-400' },
                      { id: 'Optimization Opportunity', title: 'Optimization Opportunities', text: 'text-emerald-400' },
                      { id: 'Requires Validation', title: 'Requires Validation', text: 'text-blue-400' }
                    ].map((category) => {
                      const filtered = (activeCritic?.findings || []).filter(
                        (f: any) => (f.findingCategory || 'Critical Security') === category.id
                      );
                      if (filtered.length === 0) return null;

                      return (
                        <div key={category.id} className="space-y-4">
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${category.text} border-b border-white/5 pb-2`}>
                            {category.title} ({filtered.length})
                          </h4>
                          <div className="space-y-4">
                            {filtered.map((f: any, idx: number) => (
                              <div key={idx} className="p-5 bg-black/20 border border-white/5 rounded-xl space-y-3">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                  <div className="space-y-1">
                                    <h5 className="text-xs font-bold text-gray-200">{f.title}</h5>
                                    <span className="text-[10px] text-gray-500">
                                      Component: <strong className="text-gray-400 font-semibold">{f.affectedComponent}</strong>
                                      {f.confidence && (
                                        <span className="ml-2 pl-2 border-l border-white/10">
                                          Confidence: <strong className="text-gray-400 font-semibold">{f.confidence}</strong>
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getSeverityBadgeColor(f.severity)}`}>
                                    {f.severity}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{f.description}</p>
                                
                                {f.evidence && (
                                  <p className="text-[10px] text-gray-400 leading-relaxed bg-black/10 p-2.5 rounded border border-white/5">
                                    <strong className="text-gray-300 block mb-0.5">Evidence:</strong>
                                    {f.evidence}
                                  </p>
                                )}

                                {f.whyItApplies && (
                                  <p className="text-[10px] text-gray-400 leading-relaxed">
                                    <strong className="text-gray-300 block mb-0.5">Why it applies:</strong>
                                    {f.whyItApplies}
                                  </p>
                                )}

                                {f.missingInformation && (
                                  <p className="text-[10px] text-gray-500 leading-relaxed">
                                    <strong className="text-gray-400 block mb-0.5">Requires Validation / Missing Info:</strong>
                                    {f.missingInformation}
                                  </p>
                                )}

                                <div className="mt-2 p-3 bg-violet-600/5 border border-violet-500/10 rounded-lg text-[10px] text-gray-300 leading-normal">
                                  <strong className="text-violet-400 mr-1">💡 Mitigation:</strong> {f.recommendation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Managed Identity Checklists */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Managed Identity Opportunities</h4>

                  <div className="p-5 bg-[#0d1321]/50 border border-white/5 rounded-xl space-y-4">
                    {activeCritic?.managedIdentityOpportunities?.map((op: any, idx: number) => (
                      <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <strong className="text-gray-300">{op.sourceService} ➡️ {op.targetService}</strong>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/10">Compatible</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{op.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs bg-black/10 border border-white/5 rounded-xl">
                No security critic review executed yet. Click "Run Critic Review" to start.
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB content 6: Well-Architected Framework */}
      {activeTab === 'waf' && (
        <div className="space-y-6">
          {(() => {
            const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
            const activeWAF = activeOption?.wellArchitectedReview;
            const isWAFStale = activeWAF?.isStale === true;

            if (isWAFStale) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>Requirements Updated:</strong> The architecture specifications have been modified since this Well-Architected Framework review was executed. Please click <strong>Regenerate WAF Review</strong> to update the scorecard.
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex justify-between items-center bg-[#0d1321]/50 p-4 border border-white/5 rounded-xl flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Well-Architected Pillar Scorecard</h3>
              <p className="text-[10px] text-gray-400">Assesses security, reliability, cost optimization, operational excellence, and performance.</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Option Selected:</span>
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold">
                  {project?.architectureOptions?.find(opt => opt.id === (project.selectedOptionId || 'option-a'))?.name || 'Option A'}
                </span>
              </div>
            </div>
            
            {(() => {
              const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
              const activeWAF = activeOption?.wellArchitectedReview;
              const hasWAF = !!activeWAF;
              const isWAFStale = activeWAF?.isStale === true;

              let buttonText = 'Run WAF Review';
              let isDisabled = false;

              if (runningWAF) {
                buttonText = 'Evaluating Pillars...';
                isDisabled = true;
              } else if (hasWAF) {
                if (isWAFStale) {
                  buttonText = 'Regenerate WAF Review';
                  isDisabled = false;
                } else {
                  buttonText = 'WAF Completed';
                  isDisabled = true;
                }
              }

              return (
                <button
                  onClick={handleRunWAF}
                  disabled={isDisabled}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {buttonText}
                </button>
              );
            })()}
          </div>

          {(() => {
            const activeOption = project?.architectureOptions?.find(opt => opt.id === selectedOptionView);
            const activeWAF = activeOption?.wellArchitectedReview;

            return activeWAF ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score breakdown charts */}
                <div className="p-6 bg-[#0d1321]/50 border border-white/5 rounded-xl space-y-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pillar Scorecard (0 to 5)</h4>
                  
                  {[
                    { label: 'Security', score: activeWAF?.scores?.security || 0 },
                    { label: 'Reliability', score: activeWAF?.scores?.reliability || 0 },
                    { label: 'Cost Optimization', score: activeWAF?.scores?.costOptimization || 0 },
                    { label: 'Operational Excellence', score: activeWAF?.scores?.operationalExcellence || 0 },
                    { label: 'Performance Efficiency', score: activeWAF?.scores?.performanceEfficiency || 0 }
                  ].map((p) => (
                    <div key={p.label} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-300">{p.label}</span>
                        <span className="text-violet-400">{p.score}/5</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-violet-600 to-indigo-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${(p.score / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pillar detailed lists */}
                <div className="lg:col-span-2 space-y-6">
                  {Object.entries(activeWAF?.pillars || {}).map(([pillarKey, val]) => {
                    const details = val as any;
                    const pillarLabel = pillarKey
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());

                    return (
                      <div key={pillarKey} className="p-6 bg-black/20 border border-white/5 rounded-xl space-y-6">
                        <span className="text-xs font-extrabold text-violet-400 uppercase tracking-widest block border-b border-white/5 pb-2">
                          {pillarLabel} Pillar
                        </span>
                        
                        {/* Strengths list */}
                        <div className="space-y-2">
                          <strong className="text-emerald-400 block text-[10px] uppercase tracking-wider">Strengths</strong>
                          {details.strengths && details.strengths.length > 0 ? (
                            <div className="space-y-1">
                              {details.strengths.map((s: string, idx: number) => (
                                <p key={idx} className="text-[10px] text-gray-300 flex items-start gap-1">
                                  <span>✅</span> <span className="leading-normal">{s}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 italic">No explicit strengths listed.</p>
                          )}
                        </div>

                        {/* Gaps list */}
                        <div className="space-y-3 pt-2">
                          <strong className="text-violet-300 block text-[10px] uppercase tracking-wider">Identified Gaps ({details.gaps?.length || 0})</strong>
                          {details.gaps && details.gaps.length > 0 ? (
                            <div className="space-y-3">
                              {details.gaps.map((gap: any, idx: number) => (
                                <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-lg space-y-2 text-[11px]">
                                  <div className="flex justify-between items-start flex-wrap gap-2">
                                    <strong className="text-gray-200 block text-xs">{gap.title}</strong>
                                    <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${getSeverityBadgeColor(gap.severity)}`}>
                                      {gap.severity}
                                    </span>
                                  </div>
                                  
                                  <div className="text-[10px] text-gray-400 space-y-1.5 leading-relaxed bg-black/10 p-2 rounded border border-white/5">
                                    <div>
                                      <span className="text-gray-500 font-bold uppercase text-[8px] mr-1">Component:</span>
                                      <span className="text-gray-300">{gap.affectedComponent}</span>
                                      {gap.confidence && (
                                        <span className="ml-2 pl-2 border-l border-white/10 text-gray-400">
                                          Confidence: {gap.confidence}%
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-gray-500 font-bold uppercase text-[8px] mr-1">Evidence:</span>
                                      <span className="text-gray-300">{gap.evidence}</span>
                                    </div>
                                    {gap.whyItApplies && (
                                      <div>
                                        <span className="text-gray-500 font-bold uppercase text-[8px] mr-1">Why It Applies:</span>
                                        <span className="text-gray-400">{gap.whyItApplies}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-2 bg-violet-950/10 border border-violet-500/10 rounded text-[11px] text-violet-300">
                                    💡 <strong className="text-violet-400">Recommendation:</strong> {gap.recommendation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-emerald-400/80 italic">Optimized. No gaps found under this pillar.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs bg-black/10 border border-white/5 rounded-xl">
                No Well-Architected Framework review completed. Click "Run WAF Review" to evaluate pillars.
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB content 7: ADR Workspace */}
      {activeTab === 'adr' && (
        <div className="space-y-6">
          {(() => {
            const activeOptionId = project?.selectedOptionId || 'option-a';
            const optionDecisions = (project?.decisions || []).filter(
              d => (d.affectedOptionId || 'option-a') === activeOptionId
            );
            const activeOption = project?.architectureOptions?.find(opt => opt.id === activeOptionId);
            const activeCritic = activeOption?.criticReview;
            const isStale = activeCritic?.isStale === true;

            if (isStale && optionDecisions.length > 0) {
              return (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>Requirements Updated:</strong> The architecture specifications have been modified since these decisions were generated. You can click <strong>Regenerate Decision Log</strong> to update the ADRs (Warning: this will overwrite your manually accepted/rejected selections!).
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex justify-between items-center bg-[#0d1321]/50 p-4 border border-white/5 rounded-xl flex-wrap gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Architecture Decision Record Workspace</h3>
              <p className="text-[10px] text-gray-400">Logs and reviews proposed key technology selections in standard ADR format.</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Option Selected:</span>
                <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold">
                  {project?.architectureOptions?.find(opt => opt.id === (project.selectedOptionId || 'option-a'))?.name || 'Option A'}
                </span>
              </div>
            </div>

            {(() => {
              const activeOptionId = project?.selectedOptionId || 'option-a';
              const optionDecisions = (project?.decisions || []).filter(
                d => (d.affectedOptionId || 'option-a') === activeOptionId
              );
              
              const activeOption = project?.architectureOptions?.find(opt => opt.id === activeOptionId);
              const activeCritic = activeOption?.criticReview;
              const isStale = activeCritic?.isStale === true;

              let buttonText = 'Generate Decision Log';
              let isDisabled = false;

              if (generatingADRs) {
                buttonText = 'Drafting ADR records...';
                isDisabled = true;
              } else if (optionDecisions.length > 0) {
                if (isStale) {
                  buttonText = 'Regenerate Decision Log';
                  isDisabled = false;
                } else {
                  buttonText = 'Decision Log Drafted';
                  isDisabled = true;
                }
              }

              return (
                <button
                  onClick={handleGenerateADRs}
                  disabled={isDisabled}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-500 text-white'
                  }`}
                >
                  {buttonText}
                </button>
              );
            })()}
          </div>

          {/* Filtering decisions to only show for the currently selected option */}
          {(() => {
            const activeOptionId = project?.selectedOptionId || 'option-a';
            const optionDecisions = (project?.decisions || []).filter(
              d => (d.affectedOptionId || 'option-a') === activeOptionId
            );

            const acceptedDecisions = optionDecisions.filter(d => d.status === 'Accepted');
            const rejectedDecisions = optionDecisions.filter(d => d.status === 'Rejected');

            return (
              <div className="space-y-8">
                {optionDecisions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {optionDecisions.map((d) => (
                      <div key={d.id} className="p-5 bg-black/20 border border-white/5 rounded-xl flex flex-col justify-between gap-4">
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{d.id}</span>
                              {d.confidence && (
                                <span className="text-[9px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                  Confidence: {d.confidence}%
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              d.status === 'Accepted' 
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : d.status === 'Rejected'
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                            }`}>
                              {d.status}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-gray-200">{d.title}</h4>
                          
                          {d.decisionDriver && (
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                              <strong className="text-gray-300 block mb-0.5">Decision Driver:</strong> {d.decisionDriver}
                            </p>
                          )}

                          <p className="text-[10px] text-gray-400 leading-relaxed">
                            <strong className="text-gray-300 block mb-0.5">Context:</strong> {d.context}
                          </p>

                          <p className="text-[10px] text-gray-400 leading-relaxed">
                            <strong className="text-gray-300 block mb-0.5">Decision:</strong> {d.decision}
                          </p>

                          {d.alternative && (
                            <div className="text-[10px] leading-relaxed text-gray-400 bg-black/10 p-2 rounded border border-white/5 space-y-1">
                              <div>
                                <span className="text-gray-500 font-bold uppercase text-[8px] mr-1">Runner-up Alternative:</span>
                                <span className="text-gray-300">{d.alternative}</span>
                              </div>
                              {d.reasonRejected && (
                                <div>
                                  <span className="text-gray-500 font-bold uppercase text-[8px] mr-1">Reason Rejected:</span>
                                  <span className="text-rose-400/80">{d.reasonRejected}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-[10px] text-gray-500 leading-relaxed">
                            <strong className="text-gray-300 block mb-0.5">Consequences:</strong> {d.consequences}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                          <button
                            onClick={() => handleUpdateADR(d.id, 'Accepted')}
                            disabled={updatingADRId === d.id}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                              d.status === 'Accepted'
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateADR(d.id, 'Rejected')}
                            disabled={updatingADRId === d.id}
                            className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                              d.status === 'Rejected'
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : 'bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs bg-black/10 border border-white/5 rounded-xl">
                    No Architecture Decision Records draft logs found for this option. Click "Generate Decision Log" to draft.
                  </div>
                )}

                {/* Final Architecture Decision Log summary section */}
                {optionDecisions.length > 0 && (
                  <div className="p-6 bg-[#090d16] border border-white/5 rounded-xl space-y-6">
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-white/5 pb-2">
                      Final Architecture Log — {project?.architectureOptions?.find(opt => opt.id === activeOptionId)?.name || 'Option A'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Accepted Decisions column */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Accepted Decisions ({acceptedDecisions.length})
                        </h4>
                        {acceptedDecisions.length > 0 ? (
                          <div className="space-y-3">
                            {acceptedDecisions.map((d) => (
                              <div key={d.id} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-1">
                                <strong className="text-xs text-gray-200 block">{d.title}</strong>
                                <p className="text-[10px] text-gray-400">
                                  <strong className="text-gray-400">Decision: </strong>{d.decision}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-500 italic">No decisions accepted yet. Please review and accept Proposed decisions above.</p>
                        )}
                      </div>

                      {/* Rejected Alternatives column */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Rejected Alternatives ({rejectedDecisions.length})
                        </h4>
                        {rejectedDecisions.length > 0 ? (
                          <div className="space-y-3">
                            {rejectedDecisions.map((d) => (
                              <div key={d.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-1">
                                <strong className="text-xs text-gray-200 block">{d.title}</strong>
                                <p className="text-[10px] text-gray-400">
                                  <strong className="text-gray-400">Alternative Rejected: </strong>{d.alternative}
                                </p>
                                <p className="text-[10px] text-rose-400/80 leading-normal">
                                  <strong className="text-gray-400">Reason: </strong>{d.reasonRejected}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-500 italic">No alternatives rejected yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
