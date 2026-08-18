import { GoogleGenAI } from '@google/genai';
import { AIProvider } from './ai.provider.js';
import { AnalyzeRequirementsResult } from '../projects/project.model.js';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.6-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'mock' && apiKey !== 'YOUR_API_KEY_HERE') {
      this.ai = new GoogleGenAI({ apiKey });
      console.log('🤖 Gemini AI Provider initialized with active API key.');
    } else {
      console.warn('⚠️ GEMINI_API_KEY is not set or is mock. Running Gemini in Mock Fallback mode.');
    }
  }

  async analyzeRequirements(
    rawText: string,
    context?: {
      industry?: string;
      cloudPreference?: string;
      expectedUsers?: number;
      region?: string;
    }
  ): Promise<AnalyzeRequirementsResult> {
    if (!this.ai) {
      return this.runMockAnalysis(rawText, context);
    }

    const systemPrompt = `You are a Principal Cloud Solution Architect specializing in requirement elicitation and analysis.
Your job is to analyze the user's natural language requirements and extract structured functional/non-functional requirements, identify missing details needed for architecture design, and compute initial confidence scores.

Strictly classify requirements into:
- Functional (core features, workflows, operations)
- Non-functional (usability, maintainability, operations)
- Security (authentication, authorization, encryption, networking)
- Performance (throughput, requests, responsiveness)
- Availability (SLA, RTO, RPO, multi-region)
- Scalability (user count, traffic growth, concurrent requests)
- Integration (APIs, third-party ERP/CRM, SAP)
- Data (storage, search, databases, retention)
- Compliance (GDPR, HIPAA, regulatory audits)
- Operational (monitoring, alert management)
- Cost (budget boundaries, license limits)

For each classification, assign a confidence level (0-100) based on how detailed and clear it is.
Look for missing dimensions like Peak Traffic, Data Volume, average payload size, recovery SLAs, compliance, and list them under missingRequirements.
Compute overall confidence metrics (0-100) for completeness, architecture design readiness, cost estimation, and security definitions.`;

    const userMessage = `Raw Requirements Text:
"${rawText}"

Project Context:
- Industry: ${context?.industry || 'Unknown'}
- Cloud Preference: ${context?.cloudPreference || 'No preference'}
- Expected Users: ${context?.expectedUsers || 'Unspecified'}
- Region: ${context?.region || 'Unspecified'}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              requirements: {
                type: 'ARRAY',
                description: 'The list of extracted requirements.',
                items: {
                  type: 'OBJECT',
                  properties: {
                    text: { type: 'STRING', description: 'Clear statement of the requirement.' },
                    classification: {
                      type: 'STRING',
                      enum: ['Functional', 'Non-functional', 'Security', 'Performance', 'Availability', 'Scalability', 'Integration', 'Data', 'Compliance', 'Operational', 'Cost', 'Unknown']
                    },
                    confidence: { type: 'INTEGER', description: 'Confidence in this specific requirement description (0-100).' }
                  },
                  required: ['text', 'classification', 'confidence']
                }
              },
              missingRequirements: {
                type: 'ARRAY',
                description: 'Crucial requirements information missing for reliable design.',
                items: {
                  type: 'OBJECT',
                  properties: {
                    field: { type: 'STRING', description: 'Name of the missing field or metric (e.g., peak TPS, RTO).' },
                    importance: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
                    description: { type: 'STRING', description: 'Explanation of why this is needed.' }
                  },
                  required: ['field', 'importance', 'description']
                }
              },
              confidenceScore: {
                type: 'OBJECT',
                properties: {
                  completeness: { type: 'INTEGER' },
                  architecture: { type: 'INTEGER' },
                  cost: { type: 'INTEGER' },
                  security: { type: 'INTEGER' }
                },
                required: ['completeness', 'architecture', 'cost', 'security']
              },
              structuredRequirements: {
                type: 'OBJECT',
                properties: {
                  business: {
                    type: 'OBJECT',
                    properties: {
                      businessProblem: { type: 'STRING' },
                      businessObjective: { type: 'STRING' },
                      businessCriticality: { type: 'STRING', enum: ['Low', 'Medium', 'High', 'Mission Critical'] },
                      existingApplication: { type: 'STRING' },
                      existingTechnology: { type: 'STRING' },
                      currentPainPoints: { type: 'STRING' }
                    },
                    required: ['businessProblem', 'businessObjective', 'businessCriticality']
                  },
                  users: {
                    type: 'OBJECT',
                    properties: {
                      userCount: { type: 'INTEGER' },
                      userTypes: { type: 'STRING' },
                      geographicDistribution: { type: 'STRING' },
                      authenticationRequirements: { type: 'STRING' }
                    }
                  },
                  workload: {
                    type: 'OBJECT',
                    properties: {
                      requestsPerSecond: { type: 'INTEGER' },
                      requestsPerMinute: { type: 'INTEGER' },
                      requestsPerDay: { type: 'INTEGER' },
                      transactionsPerMonth: { type: 'INTEGER' },
                      peakTraffic: { type: 'STRING' },
                      averagePayloadSize: { type: 'STRING' },
                      fileSize: { type: 'STRING' },
                      dataVolume: { type: 'STRING' }
                    }
                  },
                  availability: {
                    type: 'OBJECT',
                    properties: {
                      requiredSLA: { type: 'STRING' },
                      rto: { type: 'INTEGER' },
                      rpo: { type: 'INTEGER' },
                      disasterRecoveryRequirements: { type: 'STRING' },
                      multiRegionRequirement: { type: 'BOOLEAN' }
                    }
                  },
                  security: {
                    type: 'OBJECT',
                    properties: {
                      authentication: { type: 'STRING' },
                      authorization: { type: 'STRING' },
                      sensitiveData: { type: 'STRING' },
                      compliance: { type: 'STRING' },
                      encryption: { type: 'STRING' },
                      networkIsolation: { type: 'BOOLEAN' },
                      privateConnectivity: { type: 'BOOLEAN' }
                    }
                  },
                  integration: {
                    type: 'OBJECT',
                    properties: {
                      existingAPIs: { type: 'STRING' },
                      erp: { type: 'STRING' },
                      crm: { type: 'STRING' },
                      sap: { type: 'STRING' },
                      sharepoint: { type: 'STRING' },
                      dataverse: { type: 'STRING' },
                      externalSystems: { type: 'STRING' },
                      thirdPartyAPIs: { type: 'STRING' }
                    }
                  },
                  data: {
                    type: 'OBJECT',
                    properties: {
                      relationalData: { type: 'BOOLEAN' },
                      noSqlData: { type: 'BOOLEAN' },
                      documents: { type: 'BOOLEAN' },
                      search: { type: 'BOOLEAN' },
                      analytics: { type: 'BOOLEAN' },
                      retentionPeriod: { type: 'STRING' }
                    }
                  },
                  budget: {
                    type: 'OBJECT',
                    properties: {
                      monthlyBudget: { type: 'INTEGER' },
                      maximumBudget: { type: 'INTEGER' },
                      costSensitivity: { type: 'STRING', enum: ['Low', 'Medium', 'High'] }
                    }
                  },
                  development: {
                    type: 'OBJECT',
                    properties: {
                      existingTeamSkills: { type: 'STRING' },
                      preferredLanguage: { type: 'STRING' },
                      existingCodebase: { type: 'STRING' },
                      deploymentModel: { type: 'STRING' }
                    }
                  }
                },
                required: ['business', 'users', 'workload', 'availability', 'security', 'integration', 'data', 'budget', 'development']
              }
            },
            required: ['requirements', 'missingRequirements', 'confidenceScore', 'structuredRequirements']
          }
        }
      });

      if (!response.text) {
        throw new Error('Empty response text from Gemini API');
      }

      return JSON.parse(response.text) as AnalyzeRequirementsResult;
    } catch (error) {
      console.error('Gemini API call failed, falling back to mock analysis:', error);
      return this.runMockAnalysis(rawText, context);
    }
  }

  private runMockAnalysis(
    rawText: string,
    context?: {
      industry?: string;
      cloudPreference?: string;
      expectedUsers?: number;
      region?: string;
    }
  ): AnalyzeRequirementsResult {
    console.log('⚡ Running mock requirements analysis...');
    const requirements: any[] = [];
    const missingRequirements: any[] = [];

    // Analyze raw text for keywords
    const lower = rawText.toLowerCase();

    // 1. Users count
    const userMatch = lower.match(/(\d+[\d,]*)\s*(?:employees|users|people)/);
    if (userMatch) {
      requirements.push({
        text: `Supports ${userMatch[1]} active users/employees.`,
        classification: 'Scalability',
        confidence: 90
      });
    } else if (context?.expectedUsers) {
      requirements.push({
        text: `Target size of ${context.expectedUsers} users.`,
        classification: 'Scalability',
        confidence: 85
      });
    } else {
      missingRequirements.push({
        field: 'Expected User Base',
        importance: 'High',
        description: 'Need peak and total user counts to size the environment.'
      });
    }

    // 2. Integration
    if (lower.includes('sap') || lower.includes('erp') || lower.includes('crm') || lower.includes('api')) {
      requirements.push({
        text: `Integrates with external systems (such as ${lower.includes('sap') ? 'SAP' : 'ERP/CRM'}).`,
        classification: 'Integration',
        confidence: 80
      });
    } else {
      missingRequirements.push({
        field: 'Integration Details',
        importance: 'Medium',
        description: 'Provide details about legacy APIs or ERPs requiring integration.'
      });
    }

    // 3. Transactions / Month / Day
    const txnMatch = lower.match(/(\d+[\d,]*\s*(?:million|thousand|k)?)\s*transaction/i);
    if (txnMatch) {
      requirements.push({
        text: `Processes around ${txnMatch[1]} transactions.`,
        classification: 'Performance',
        confidence: 85
      });
    } else {
      missingRequirements.push({
        field: 'Workload Metrics (Peak TPS / Payload Size)',
        importance: 'High',
        description: 'Requires transaction throughput and payload sizing for database selection.'
      });
    }

    // 4. Availability / SLA
    const slaMatch = lower.match(/(\d{2}(?:\.\d+)?%)\s*(?:availability|sla)/i);
    if (slaMatch) {
      requirements.push({
        text: `Requires ${slaMatch[1]} system availability SLA.`,
        classification: 'Availability',
        confidence: 95
      });
    } else {
      missingRequirements.push({
        field: 'RTO / RPO',
        importance: 'Medium',
        description: 'Recovery Time Objective (RTO) and Recovery Point Objective (RPO) are missing.'
      });
    }

    // 5. Budget
    const budgetMatch = lower.match(/\$?(\d+[\d,]*)\s*\/\s*(?:month|year|monthly)/i);
    if (budgetMatch) {
      requirements.push({
        text: `Target budget of $${budgetMatch[1]}/month.`,
        classification: 'Cost',
        confidence: 90
      });
    } else {
      missingRequirements.push({
        field: 'Budget / Cost constraints',
        importance: 'Low',
        description: 'Target monthly budget helps rule out premium service tiers.'
      });
    }

    // 6. Security default
    if (lower.includes('secure') || lower.includes('auth') || lower.includes('entra') || lower.includes('private')) {
      requirements.push({
        text: `Ensure secure authentication and network isolation.`,
        classification: 'Security',
        confidence: 70
      });
    } else {
      missingRequirements.push({
        field: 'Security / Compliance standards',
        importance: 'High',
        description: 'Specify if encryption at rest/in transit, private endpoints, or Entra ID are required.'
      });
    }

    // General fallback requirement if list is short
    if (requirements.length === 0) {
      requirements.push({
        text: `Review and structure raw requirements text: "${rawText.substring(0, 50)}..."`,
        classification: 'Functional',
        confidence: 50
      });
    }

    // Completeness Calculations
    const totalMissing = missingRequirements.length;
    const completeness = Math.max(20, Math.min(95, 100 - totalMissing * 12));
    const architecture = Math.max(30, Math.min(90, completeness - 5));
    const cost = budgetMatch ? 85 : 50;
    const security = lower.includes('auth') ? 80 : 55;

    // Build structured requirements mock data
    const structuredRequirements = {
      business: {
        businessProblem: `Rebuild/re-architect requirements from: "${rawText.trim().substring(0, 100)}..."`,
        businessObjective: 'Migrate to modern scalable cloud architecture pattern.',
        businessCriticality: lower.includes('critical') ? 'Mission Critical' : 'High' as any,
        existingApplication: lower.includes('sharepoint') ? 'SharePoint Portal' : '',
        existingTechnology: lower.includes('sharepoint') ? 'SharePoint + Power Automate' : '',
        currentPainPoints: 'Scalability limits, lack of enterprise integrations.'
      },
      users: {
        userCount: userMatch ? Number(userMatch[1].replace(/,/g, '')) : (context?.expectedUsers || undefined),
        userTypes: 'Internal business users',
        geographicDistribution: context?.region || 'Localized',
        authenticationRequirements: lower.includes('entra') ? 'Microsoft Entra ID' : 'Organizational login'
      },
      workload: {
        requestsPerSecond: undefined,
        requestsPerMinute: undefined,
        requestsPerDay: undefined,
        transactionsPerMonth: txnMatch ? (txnMatch[1].includes('million') ? 1000000 : 500000) : undefined,
        peakTraffic: lower.includes('peak') ? 'Peak workload events' : '',
        averagePayloadSize: '',
        fileSize: '',
        dataVolume: ''
      },
      availability: {
        requiredSLA: slaMatch ? slaMatch[1] : '',
        rto: lower.includes('rto') ? 240 : undefined,
        rpo: lower.includes('rpo') ? 60 : undefined,
        disasterRecoveryRequirements: '',
        multiRegionRequirement: lower.includes('multi-region') || lower.includes('disaster recovery')
      },
      security: {
        authentication: lower.includes('entra') ? 'Microsoft Entra ID' : '',
        authorization: 'Role-Based Access Control (RBAC)',
        sensitiveData: lower.includes('sensitive') ? 'PII / Encrypted' : '',
        compliance: lower.includes('compliance') || lower.includes('gdpr') ? 'GDPR / SOC2' : '',
        encryption: lower.includes('encrypt') ? 'AES-256 / HTTPS' : '',
        networkIsolation: lower.includes('private') || lower.includes('vnet'),
        privateConnectivity: lower.includes('private')
      },
      integration: {
        existingAPIs: lower.includes('api') ? 'REST Web Services' : '',
        erp: lower.includes('erp') ? 'Enterprise ERP' : '',
        crm: lower.includes('crm') ? 'Customer CRM' : '',
        sap: lower.includes('sap') ? 'SAP Instance' : '',
        sharepoint: lower.includes('sharepoint') ? 'SharePoint Online' : '',
        dataverse: lower.includes('dataverse') ? 'Microsoft Dataverse' : '',
        externalSystems: '',
        thirdPartyAPIs: ''
      },
      data: {
        relationalData: lower.includes('relational') || lower.includes('sql'),
        noSqlData: lower.includes('nosql') || lower.includes('cosmos'),
        documents: lower.includes('document') || lower.includes('file'),
        search: lower.includes('search') || lower.includes('find'),
        analytics: lower.includes('analytics') || lower.includes('report'),
        retentionPeriod: ''
      },
      budget: {
        monthlyBudget: budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : undefined,
        maximumBudget: undefined,
        costSensitivity: lower.includes('sensitive') ? 'High' : 'Medium' as any
      },
      development: {
        existingTeamSkills: 'Microsoft Power Platform / C#',
        preferredLanguage: 'TypeScript / C#',
        existingCodebase: '',
        deploymentModel: 'CI/CD Automated'
      }
    };

    return {
      requirements,
      missingRequirements,
      confidenceScore: {
        completeness,
        architecture,
        cost,
        security
      },
      structuredRequirements
    };
  }
}
