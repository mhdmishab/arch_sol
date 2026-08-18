import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import { isUsingMongoDB, readLocalProjects, writeLocalProjects } from '../../config/db.js';

export interface Requirement {
  id: string;
  text: string;
  classification: 'Functional' | 'Non-functional' | 'Security' | 'Performance' | 'Availability' | 'Scalability' | 'Integration' | 'Data' | 'Compliance' | 'Operational' | 'Cost' | 'Unknown';
  confidence: number;
  source: 'extracted' | 'user_input';
  details?: Record<string, any>;
}

export interface MissingRequirement {
  field: string;
  importance: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface ConfidenceScore {
  completeness: number;
  architecture: number;
  cost: number;
  security: number;
}

export interface StructuredRequirements {
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
    rto?: number;
    rpo?: number;
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

export interface AnalyzeRequirementsResult {
  requirements: Array<{
    text: string;
    classification: string;
    confidence: number;
    details?: Record<string, any>;
  }>;
  missingRequirements: MissingRequirement[];
  confidenceScore: ConfidenceScore;
  structuredRequirements?: StructuredRequirements;
}

export interface CloudServiceComponent {
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

export interface ArchitectureOption {
  id: string; // 'option-a' | 'option-b' | 'option-c'
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
  decisions?: ADR[];
  createdAt?: Date;
}

export interface WAFGap {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedComponent: string;
  whyItApplies: string;
  evidence: string;
  recommendation: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface WAFPillarReview {
  strengths: string[];
  gaps: WAFGap[];
}

export interface WAFReview {
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

export interface CriticFinding {
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

export interface CriticReview {
  findings: CriticFinding[];
  managedIdentityOpportunities: Array<{
    sourceService: string;
    targetService: string;
    canUseManagedIdentity: boolean;
    reason: string;
  }>;
  isStale?: boolean;
}

export interface ADR {
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

export interface ArchitectureProject {
  id: string;
  name: string;
  description?: string;
  industry: string;
  cloudPreference: 'Microsoft' | 'Azure' | 'AWS' | 'GCP' | 'Hybrid' | 'No preference';
  expectedUsers?: number;
  region: string;
  rawTextRequirements?: string;
  requirements: Requirement[];
  missingRequirements: MissingRequirement[];
  confidenceScore: ConfidenceScore;
  structuredRequirements: StructuredRequirements;
  architectureOptions: ArchitectureOption[];
  selectedOptionId?: string;
  wellArchitectedReview?: WAFReview;
  criticReview?: CriticReview;
  decisions: ADR[];
  costScenarios?: any;
  costScenariosStale?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema Definition
export interface IArchitectureProjectDoc extends Omit<ArchitectureProject, 'id'>, Document {}

const RequirementSchema = new Schema<Requirement>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  classification: {
    type: String,
    enum: ['Functional', 'Non-functional', 'Security', 'Performance', 'Availability', 'Scalability', 'Integration', 'Data', 'Compliance', 'Operational', 'Cost', 'Unknown'],
    required: true
  },
  confidence: { type: Number, required: true },
  source: { type: String, enum: ['extracted', 'user_input'], required: true },
  details: { type: Schema.Types.Map, of: Schema.Types.Mixed }
});

const MissingRequirementSchema = new Schema<MissingRequirement>({
  field: { type: String, required: true },
  importance: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  description: { type: String, required: true }
});

export function createDefaultStructuredRequirements(data?: Partial<ArchitectureProject>): StructuredRequirements {
  return {
    business: {
      businessProblem: '',
      businessObjective: '',
      businessCriticality: 'Medium',
      existingApplication: '',
      existingTechnology: '',
      currentPainPoints: ''
    },
    users: {
      userCount: data?.expectedUsers || undefined,
      userTypes: '',
      geographicDistribution: '',
      authenticationRequirements: ''
    },
    workload: {
      requestsPerSecond: undefined,
      requestsPerMinute: undefined,
      requestsPerDay: undefined,
      transactionsPerMonth: undefined,
      peakTraffic: '',
      averagePayloadSize: '',
      fileSize: '',
      dataVolume: ''
    },
    availability: {
      requiredSLA: '',
      rto: undefined,
      rpo: undefined,
      disasterRecoveryRequirements: '',
      multiRegionRequirement: false
    },
    security: {
      authentication: '',
      authorization: '',
      sensitiveData: '',
      compliance: '',
      encryption: '',
      networkIsolation: false,
      privateConnectivity: false
    },
    integration: {
      existingAPIs: '',
      erp: '',
      crm: '',
      sap: '',
      sharepoint: '',
      dataverse: '',
      externalSystems: '',
      thirdPartyAPIs: ''
    },
    data: {
      relationalData: false,
      noSqlData: false,
      documents: false,
      search: false,
      analytics: false,
      retentionPeriod: ''
    },
    budget: {
      monthlyBudget: undefined,
      maximumBudget: undefined,
      costSensitivity: 'Medium'
    },
    development: {
      existingTeamSkills: '',
      preferredLanguage: '',
      existingCodebase: '',
      deploymentModel: ''
    }
  };
}

const StructuredRequirementsSchema = new Schema<StructuredRequirements>({
  business: {
    businessProblem: { type: String, default: '' },
    businessObjective: { type: String, default: '' },
    businessCriticality: { type: String, enum: ['Low', 'Medium', 'High', 'Mission Critical'], default: 'Medium' },
    existingApplication: { type: String, default: '' },
    existingTechnology: { type: String, default: '' },
    currentPainPoints: { type: String, default: '' }
  },
  users: {
    userCount: { type: Number },
    userTypes: { type: String, default: '' },
    geographicDistribution: { type: String, default: '' },
    authenticationRequirements: { type: String, default: '' }
  },
  workload: {
    requestsPerSecond: { type: Number },
    requestsPerMinute: { type: Number },
    requestsPerDay: { type: Number },
    transactionsPerMonth: { type: Number },
    peakTraffic: { type: String, default: '' },
    averagePayloadSize: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    dataVolume: { type: String, default: '' }
  },
  availability: {
    requiredSLA: { type: String, default: '' },
    rto: { type: Number },
    rpo: { type: Number },
    disasterRecoveryRequirements: { type: String, default: '' },
    multiRegionRequirement: { type: Boolean, default: false }
  },
  security: {
    authentication: { type: String, default: '' },
    authorization: { type: String, default: '' },
    sensitiveData: { type: String, default: '' },
    compliance: { type: String, default: '' },
    encryption: { type: String, default: '' },
    networkIsolation: { type: Boolean, default: false },
    privateConnectivity: { type: Boolean, default: false }
  },
  integration: {
    existingAPIs: { type: String, default: '' },
    erp: { type: String, default: '' },
    crm: { type: String, default: '' },
    sap: { type: String, default: '' },
    sharepoint: { type: String, default: '' },
    dataverse: { type: String, default: '' },
    externalSystems: { type: String, default: '' },
    thirdPartyAPIs: { type: String, default: '' }
  },
  data: {
    relationalData: { type: Boolean, default: false },
    noSqlData: { type: Boolean, default: false },
    documents: { type: Boolean, default: false },
    search: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    retentionPeriod: { type: String, default: '' }
  },
  budget: {
    monthlyBudget: { type: Number },
    maximumBudget: { type: Number },
    costSensitivity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  },
  development: {
    existingTeamSkills: { type: String, default: '' },
    preferredLanguage: { type: String, default: '' },
    existingCodebase: { type: String, default: '' },
    deploymentModel: { type: String, default: '' }
  }
}, { _id: false });

const ConfidenceScoreSchema = new Schema<ConfidenceScore>({
  completeness: { type: Number, required: true, default: 0 },
  architecture: { type: Number, required: true, default: 0 },
  cost: { type: Number, required: true, default: 0 },
  security: { type: Number, required: true, default: 0 }
});

const CloudServiceComponentSchema = new Schema<CloudServiceComponent>({
  serviceName: { type: String, required: true },
  sku: { type: String, required: true },
  region: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Compute', 'Database', 'Storage', 'Networking', 'Integration', 'Security', 'Monitoring'],
    required: true 
  },
  usageMetric: { type: String, required: true },
  estimatedUsageQuantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  monthlyCost: { type: Number, required: true },
  confidence: { type: Number, required: true },
  reasonSelected: { type: String, required: true },
  alternativesRejected: { type: [String], default: [] }
}, { _id: false });



const WAFGapSchema = new Schema<WAFGap>({
  title: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
  affectedComponent: { type: String, required: true },
  whyItApplies: { type: String, required: true },
  evidence: { type: String, required: true },
  recommendation: { type: String, required: true },
  confidence: { type: String, enum: ['High', 'Medium', 'Low'], required: true }
}, { _id: false });

const WAFPillarReviewSchema = new Schema<WAFPillarReview>({
  strengths: { type: [String], default: [] },
  gaps: { type: [WAFGapSchema], default: [] }
}, { _id: false });

const WAFReviewSchema = new Schema<WAFReview>({
  scores: {
    security: { type: Number, required: true },
    reliability: { type: Number, required: true },
    costOptimization: { type: Number, required: true },
    operationalExcellence: { type: Number, required: true },
    performanceEfficiency: { type: Number, required: true }
  },
  pillars: {
    security: { type: WAFPillarReviewSchema, required: true },
    reliability: { type: WAFPillarReviewSchema, required: true },
    costOptimization: { type: WAFPillarReviewSchema, required: true },
    operationalExcellence: { type: WAFPillarReviewSchema, required: true },
    performanceEfficiency: { type: WAFPillarReviewSchema, required: true }
  },
  isStale: { type: Boolean, default: false }
}, { _id: false });

const CriticReviewSchema = new Schema<CriticReview>({
  findings: {
    type: [{
      severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      recommendation: { type: String, required: true },
      affectedComponent: { type: String, required: true },
      evidence: { type: String, required: true },
      whyItApplies: { type: String, required: true },
      missingInformation: { type: String, default: '' },
      confidence: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
      findingCategory: { type: String, enum: ['Critical Security', 'Architecture Risk', 'Governance Gap', 'Optimization Opportunity', 'Requires Validation'], required: true }
    }],
    default: []
  },
  managedIdentityOpportunities: {
    type: [{
      sourceService: String,
      targetService: String,
      canUseManagedIdentity: Boolean,
      reason: String
    }],
    default: []
  },
  isStale: { type: Boolean, default: false }
}, { _id: false });

const ADRSchema = new Schema<ADR>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['Proposed', 'Accepted', 'Rejected'], default: 'Proposed' },
  context: { type: String, required: true },
  decision: { type: String, required: true },
  alternatives: { type: [String], default: [] },
  reasons: { type: [String], default: [] },
  impacts: {
    security: String,
    cost: String,
    reliability: String
  },
  consequences: { type: String, required: true },
  affectedOptionId: { type: String },
  whyItApplies: { type: String },
  confidence: { type: Number },
  decisionDriver: { type: String },
  alternative: { type: String },
  reasonRejected: { type: String }
});

const ArchitectureOptionSchema = new Schema<ArchitectureOption>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  benefits: { type: [String], default: [] },
  disadvantages: { type: [String], default: [] },
  complexity: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  migrationEffort: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  services: { type: [CloudServiceComponentSchema], default: [] },
  diagram: {
    nodes: [{
      id: { type: String, required: true },
      type: { type: String, required: true },
      label: { type: String, required: true }
    }],
    edges: [{
      source: { type: String, required: true },
      target: { type: String, required: true }
    }]
  },
  comparisonMatrix: {
    security: { type: Number, required: true },
    reliability: { type: Number, required: true },
    scalability: { type: Number, required: true },
    cost: { type: Number, required: true },
    complexity: { type: Number, required: true },
    maintainability: { type: Number, required: true },
    explanations: { type: Map, of: String, default: {} }
  },
  wellArchitectedReview: { type: WAFReviewSchema },
  criticReview: { type: CriticReviewSchema },
  decisions: { type: [ADRSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ProjectSchema = new Schema<IArchitectureProjectDoc>({
  name: { type: String, required: true },
  description: { type: String },
  industry: { type: String, required: true },
  cloudPreference: {
    type: String,
    enum: ['Microsoft', 'Azure', 'AWS', 'GCP', 'Hybrid', 'No preference'],
    required: true
  },
  expectedUsers: { type: Number },
  region: { type: String, required: true },
  rawTextRequirements: { type: String },
  requirements: { type: [RequirementSchema], default: [] },
  missingRequirements: { type: [MissingRequirementSchema], default: [] },
  confidenceScore: { type: ConfidenceScoreSchema, default: () => ({ completeness: 0, architecture: 0, cost: 0, security: 0 }) },
  structuredRequirements: { type: StructuredRequirementsSchema, default: () => createDefaultStructuredRequirements() },
  architectureOptions: { type: [ArchitectureOptionSchema], default: [] },
  selectedOptionId: { type: String },
  wellArchitectedReview: { type: WAFReviewSchema },
  criticReview: { type: CriticReviewSchema },
  decisions: { type: [ADRSchema], default: [] },
  costScenarios: { type: Schema.Types.Mixed },
  costScenariosStale: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      const r = ret as any;
      delete r._id;
      delete r.__v;
      return r;
    }
  }
});

const ProjectModel = mongoose.model<IArchitectureProjectDoc>('Project', ProjectSchema);

// Project Repository wrapper supporting MongoDB and JSON fallback
export class ProjectRepository {
  static async create(data: Partial<ArchitectureProject>): Promise<ArchitectureProject> {
    if (isUsingMongoDB) {
      const project = new ProjectModel(data);
      const saved = await project.save();
      return saved.toJSON() as any;
    } else {
      const projects = readLocalProjects();
      const newProject: ArchitectureProject = {
        id: crypto.randomUUID(),
        name: data.name || 'Untitled Project',
        description: data.description || '',
        industry: data.industry || 'Unknown',
        cloudPreference: data.cloudPreference || 'No preference',
        expectedUsers: data.expectedUsers,
        region: data.region || 'Unknown',
        rawTextRequirements: data.rawTextRequirements || '',
        requirements: data.requirements || [],
        missingRequirements: data.missingRequirements || [],
        confidenceScore: data.confidenceScore || { completeness: 0, architecture: 0, cost: 0, security: 0 },
        structuredRequirements: data.structuredRequirements || createDefaultStructuredRequirements(data),
        architectureOptions: data.architectureOptions || [],
        selectedOptionId: data.selectedOptionId,
        wellArchitectedReview: data.wellArchitectedReview,
        criticReview: data.criticReview,
        decisions: data.decisions || [],
        costScenarios: data.costScenarios || null,
        costScenariosStale: data.costScenariosStale || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      projects.push(newProject);
      writeLocalProjects(projects);
      return newProject;
    }
  }

  static async findAll(): Promise<ArchitectureProject[]> {
    if (isUsingMongoDB) {
      const list = await ProjectModel.find().sort({ updatedAt: -1 });
      return list.map(p => p.toJSON() as any);
    } else {
      return readLocalProjects().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }

  static async findById(id: string): Promise<ArchitectureProject | null> {
    if (isUsingMongoDB) {
      try {
        const p = await ProjectModel.findById(id);
        return p ? (p.toJSON() as any) : null;
      } catch {
        return null;
      }
    } else {
      const projects = readLocalProjects();
      const found = projects.find(p => p.id === id);
      return found || null;
    }
  }

  static async update(id: string, data: Partial<ArchitectureProject>): Promise<ArchitectureProject | null> {
    if (isUsingMongoDB) {
      try {
        const updated = await ProjectModel.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true }
        );
        return updated ? (updated.toJSON() as any) : null;
      } catch (err) {
        console.error('❌ Mongoose update error:', err);
        return null;
      }
    } else {
      const projects = readLocalProjects();
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) return null;

      const updatedProject: ArchitectureProject = {
        ...projects[index],
        ...data,
        updatedAt: new Date()
      };
      projects[index] = updatedProject;
      writeLocalProjects(projects);
      return updatedProject;
    }
  }

  static async delete(id: string): Promise<boolean> {
    if (isUsingMongoDB) {
      try {
        const res = await ProjectModel.findByIdAndDelete(id);
        return !!res;
      } catch {
        return false;
      }
    } else {
      const projects = readLocalProjects();
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) return false;

      projects.splice(index, 1);
      writeLocalProjects(projects);
      return true;
    }
  }
}
