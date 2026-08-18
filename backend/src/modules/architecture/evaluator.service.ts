import { GoogleGenAI } from '@google/genai';
import { ArchitectureProject, CriticReview, WAFReview, ADR, WAFGap, WAFPillarReview } from '../projects/project.model.js';
import dotenv from 'dotenv';

dotenv.config();

export class EvaluatorService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.6-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'mock' && apiKey !== 'YOUR_API_KEY_HERE') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  // 1. Security / Enterprise Critic Audit
  async evaluateCritic(project: ArchitectureProject): Promise<CriticReview> {
    if (!this.ai) {
      return { findings: [], managedIdentityOpportunities: [] };
    }

    try {
      const selectedOptionId = project.selectedOptionId || 'option-a';
      const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];

      const userMessage = `Perform a security, risk, and optimization audit on the selected architecture option:
Selected Option ID: ${selectedOptionId}
Selected Option Name: ${selectedOption?.name}
Selected Option Description: ${selectedOption?.description}
Services/Components Present in this Option: ${JSON.stringify(selectedOption?.services)}
Workload Requirements: ${JSON.stringify(project.structuredRequirements)}

Instructions:
1. You MUST analyze ONLY the services, components, dependencies, and characteristics that actually belong to this selected option.
2. Do NOT apply generic Azure recommendations (like Azure VNet, Private Endpoints, Application Gateway, Azure Front Door, Azure WAF, Managed Identity for Azure Functions/SQL/Service Bus) unless those Azure services are explicitly listed in the components list of this option.
3. Categorize findings strictly into the following findingCategory values:
   - 'Critical Security' (actual security vulnerabilities)
   - 'Architecture Risk' (scalability, reliability, integration, performance risks)
   - 'Governance Gap' (DLP, RBAC, audit, environment governance)
   - 'Optimization Opportunity' (cost, performance, maintainability optimizations)
   - 'Requires Validation' (unconfirmed parameters like unknown TPS, SAP OData limits, RTO/RPO)
4. Do NOT assume that high daily or monthly transaction volumes (e.g. 500k/month or 1M/day) automatically mean "severe performance bottlenecks" or "severe throttling". Treat them as "potential risks requiring validation" (e.g. 'Potential throttling risk - peak TPS, connector limits, SAP API limits, concurrency, and retry behavior must be validated').
5. Detail the 'whyItApplies' field to explain clearly why this finding applies to this specific architecture option.`;

      console.log(`🤖 Sending Option-Aware Security Critic audit request to Gemini API...`);
      console.log(`💬 Model: ${this.modelName} | Context length: ${userMessage.length} characters.`);
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: userMessage,
        config: {
          systemInstruction: `You are an architecture-aware security, risk, and optimization critic reviewer. You identify issues strictly relevant to the components present in the selected architecture option. You MUST NOT mention or recommend Azure-specific infrastructure controls (like VNets, WAF, Front Door, Private Endpoints, or Azure Managed Identity) for Microsoft SaaS/Power Platform options (Option A) unless those Azure services are explicitly included in the services list. Output JSON matching the requested schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              findings: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                    title: { type: 'STRING' },
                    description: { type: 'STRING' },
                    recommendation: { type: 'STRING' },
                    affectedComponent: { type: 'STRING' },
                    evidence: { type: 'STRING' },
                    whyItApplies: { type: 'STRING' },
                    missingInformation: { type: 'STRING' },
                    confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] },
                    findingCategory: { type: 'STRING', enum: ['Critical Security', 'Architecture Risk', 'Governance Gap', 'Optimization Opportunity', 'Requires Validation'] }
                  },
                  required: [
                    'severity', 'title', 'description', 'recommendation', 
                    'affectedComponent', 'evidence', 'whyItApplies', 
                    'missingInformation', 'confidence', 'findingCategory'
                  ]
                }
              },
              managedIdentityOpportunities: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    sourceService: { type: 'STRING' },
                    targetService: { type: 'STRING' },
                    canUseManagedIdentity: { type: 'BOOLEAN' },
                    reason: { type: 'STRING' }
                  },
                  required: ['sourceService', 'targetService', 'canUseManagedIdentity', 'reason']
                }
              }
            },
            required: ['findings', 'managedIdentityOpportunities']
          }
        }
      });

      if (!response.text) throw new Error('Empty response');
      console.log(`✅ Received Gemini response for Security Critic audit. Length: ${response.text.length} chars.`);
      const review = JSON.parse(response.text) as CriticReview;
      console.log(`🛡️ Parsed audit containing ${review.findings?.length || 0} findings and ${review.managedIdentityOpportunities?.length || 0} MI paths.`);
      return review;
    } catch (err: any) {
      console.warn('Critic API failed:', err);
      const error: any = new Error(err.message || 'Critic API failed');
      error.status = err.status || err.statusCode || (err.message?.includes('503') ? 503 : 500);
      throw error;
    }
  }

  // 2. Well-Architected Framework Evaluation
  async evaluateWAF(project: ArchitectureProject): Promise<WAFReview> {
    if (!this.ai) {
      return {
        scores: { security: 0, reliability: 0, costOptimization: 0, operationalExcellence: 0, performanceEfficiency: 0 },
        pillars: {
          security: { strengths: [], gaps: [] },
          reliability: { strengths: [], gaps: [] },
          costOptimization: { strengths: [], gaps: [] },
          operationalExcellence: { strengths: [], gaps: [] },
          performanceEfficiency: { strengths: [], gaps: [] }
        }
      };
    }

    try {
      const selectedOptionId = project.selectedOptionId || 'option-a';
      const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];

      const userMessage = `Perform a Microsoft Well-Architected Framework (WAF) review on the selected architecture option:
Selected Option ID: ${selectedOptionId}
Selected Option Name: ${selectedOption?.name}
Selected Option Description: ${selectedOption?.description}
Services/Components Present in this Option: ${JSON.stringify(selectedOption?.services)}
Workload Requirements: ${JSON.stringify(project.structuredRequirements)}

Instructions:
1. You MUST evaluate ONLY the services, components, dependencies, and characteristics that actually belong to this selected option.
2. Do NOT recommend Azure components (like Azure Private Link, VNet integrations, APIM, Azure Functions, Azure Service Bus, Key Vault, or Application Gateway) for SaaS options (Option A) unless those components are explicitly in the services list.
3. For the 'Reliability' pillar, evaluate end-to-end system availability: look at downstream ERP/SAP dependency failure points, retry logic, queuing mechanisms, and retry/failover capacity, rather than simply citing individual platform SLAs.
4. Output JSON strictly matching the requested response schema.`;

      console.log(`🤖 Sending Option-Aware WAF review request to Gemini API...`);
      console.log(`💬 Model: ${this.modelName} | Context size: ${userMessage.length} characters.`);
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: userMessage,
        config: {
          systemInstruction: `You are an architecture-aware Microsoft Well-Architected Framework (WAF) reviewer. You evaluate and score the five WAF pillars (Security, Reliability, Cost Optimization, Operational Excellence, Performance Efficiency) from 0 to 5 based strictly on the components present in the selected architecture option. Output JSON only.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              scores: {
                type: 'OBJECT',
                properties: {
                  security: { type: 'INTEGER' },
                  reliability: { type: 'INTEGER' },
                  costOptimization: { type: 'INTEGER' },
                  operationalExcellence: { type: 'INTEGER' },
                  performanceEfficiency: { type: 'INTEGER' }
                },
                required: ['security', 'reliability', 'costOptimization', 'operationalExcellence', 'performanceEfficiency']
              },
              pillars: {
                type: 'OBJECT',
                properties: {
                  security: {
                    type: 'OBJECT',
                    properties: {
                      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                      gaps: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                            affectedComponent: { type: 'STRING' },
                            whyItApplies: { type: 'STRING' },
                            evidence: { type: 'STRING' },
                            recommendation: { type: 'STRING' },
                            confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] }
                          },
                          required: ['title', 'severity', 'affectedComponent', 'whyItApplies', 'evidence', 'recommendation', 'confidence']
                        }
                      }
                    },
                    required: ['strengths', 'gaps']
                  },
                  reliability: {
                    type: 'OBJECT',
                    properties: {
                      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                      gaps: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                            affectedComponent: { type: 'STRING' },
                            whyItApplies: { type: 'STRING' },
                            evidence: { type: 'STRING' },
                            recommendation: { type: 'STRING' },
                            confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] }
                          },
                          required: ['title', 'severity', 'affectedComponent', 'whyItApplies', 'evidence', 'recommendation', 'confidence']
                        }
                      }
                    },
                    required: ['strengths', 'gaps']
                  },
                  costOptimization: {
                    type: 'OBJECT',
                    properties: {
                      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                      gaps: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                            affectedComponent: { type: 'STRING' },
                            whyItApplies: { type: 'STRING' },
                            evidence: { type: 'STRING' },
                            recommendation: { type: 'STRING' },
                            confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] }
                          },
                          required: ['title', 'severity', 'affectedComponent', 'whyItApplies', 'evidence', 'recommendation', 'confidence']
                        }
                      }
                    },
                    required: ['strengths', 'gaps']
                  },
                  operationalExcellence: {
                    type: 'OBJECT',
                    properties: {
                      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                      gaps: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                            affectedComponent: { type: 'STRING' },
                            whyItApplies: { type: 'STRING' },
                            evidence: { type: 'STRING' },
                            recommendation: { type: 'STRING' },
                            confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] }
                          },
                          required: ['title', 'severity', 'affectedComponent', 'whyItApplies', 'evidence', 'recommendation', 'confidence']
                        }
                      }
                    },
                    required: ['strengths', 'gaps']
                  },
                  performanceEfficiency: {
                    type: 'OBJECT',
                    properties: {
                      strengths: { type: 'ARRAY', items: { type: 'STRING' } },
                      gaps: {
                        type: 'ARRAY',
                        items: {
                          type: 'OBJECT',
                          properties: {
                            title: { type: 'STRING' },
                            severity: { type: 'STRING', enum: ['Critical', 'High', 'Medium', 'Low'] },
                            affectedComponent: { type: 'STRING' },
                            whyItApplies: { type: 'STRING' },
                            evidence: { type: 'STRING' },
                            recommendation: { type: 'STRING' },
                            confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low'] }
                          },
                          required: ['title', 'severity', 'affectedComponent', 'whyItApplies', 'evidence', 'recommendation', 'confidence']
                        }
                      }
                    },
                    required: ['strengths', 'gaps']
                  }
                },
                required: ['security', 'reliability', 'costOptimization', 'operationalExcellence', 'performanceEfficiency']
              }
            },
            required: ['scores', 'pillars']
          }
        }
      });

      if (!response.text) throw new Error('Empty response');
      console.log(`✅ Received Gemini response for WAF review. Length: ${response.text.length} chars.`);
      const waf = JSON.parse(response.text) as WAFReview;
      console.log(`⭐️ WAF review parsed. Scores: SEC: ${waf.scores?.security}, REL: ${waf.scores?.reliability}, COST: ${waf.scores?.costOptimization}, OPS: ${waf.scores?.operationalExcellence}, PERF: ${waf.scores?.performanceEfficiency}`);
      return waf;
    } catch (err: any) {
      console.warn('WAF API failed:', err);
      const error: any = new Error(err.message || 'WAF API failed');
      error.status = err.status || err.statusCode || (err.message?.includes('503') ? 503 : 500);
      throw error;
    }
  }

  // 3. ADR (Architecture Decision Record) Draft generator
  async generateADRs(project: ArchitectureProject): Promise<ADR[]> {
    if (!this.ai) {
      return [];
    }

    try {
      const selectedOptionId = project.selectedOptionId || 'option-a';
      const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];

      const userMessage = `Create Architecture Decision Records (ADRs) for the selected architecture option:
Selected Option ID: ${selectedOptionId}
Selected Option Name: ${selectedOption?.name}
Services Present in this Option: ${JSON.stringify(selectedOption?.services)}
Structured Requirements: ${JSON.stringify(project.structuredRequirements)}

Instructions:
1. You MUST generate 3 ADRs focusing on key architectural decisions specific to this selected option.
2. The decisions should capture actual tradeoffs and decisions rather than generic technology selections (e.g. 'Use Dataverse instead of SharePoint Lists for structured configuration data' instead of 'Selection of Dataverse').
3. For ALL generated decisions:
   - Set 'status' to 'Proposed' (never 'Accepted' or 'Rejected' initially).
   - Set 'affectedOptionId' to the selected option ID: '${selectedOptionId}'.
   - Specify the primary 'alternative' runner-up evaluated and the detailed architectural 'reasonRejected'.
   - Detail the 'decisionDriver' that drove the choice.
4. Output JSON strictly conforming to the requested schema.`;

      console.log(`🤖 Sending Option-Aware ADR draft generation request to Gemini API...`);
      console.log(`💬 Model: ${this.modelName} | Context size: ${userMessage.length} characters.`);
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: userMessage,
        config: {
          systemInstruction: `You are a solution architect drafting formal Architecture Decision Records (ADRs). You generate high-quality decisions specific to the active option, defaulting their status to 'Proposed' and outlining clear drivers, alternatives, and reasons for rejecting those alternatives. Output JSON only.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              decisions: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    title: { type: 'STRING' },
                    status: { type: 'STRING', enum: ['Proposed', 'Accepted', 'Rejected'] },
                    context: { type: 'STRING' },
                    decision: { type: 'STRING' },
                    alternatives: { type: 'ARRAY', items: { type: 'STRING' } },
                    reasons: { type: 'ARRAY', items: { type: 'STRING' } },
                    impacts: {
                      type: 'OBJECT',
                      properties: {
                        security: { type: 'STRING' },
                        cost: { type: 'STRING' },
                        reliability: { type: 'STRING' }
                      },
                      required: ['security', 'cost', 'reliability']
                    },
                    consequences: { type: 'STRING' },
                    affectedOptionId: { type: 'STRING' },
                    whyItApplies: { type: 'STRING' },
                    confidence: { type: 'INTEGER' },
                    decisionDriver: { type: 'STRING' },
                    alternative: { type: 'STRING' },
                    reasonRejected: { type: 'STRING' }
                  },
                  required: [
                    'id', 'title', 'status', 'context', 'decision', 'alternatives', 
                    'reasons', 'impacts', 'consequences', 'affectedOptionId', 
                    'whyItApplies', 'confidence', 'decisionDriver', 'alternative', 'reasonRejected'
                  ]
                }
              }
            },
            required: ['decisions']
          }
        }
      });

      if (!response.text) throw new Error('Empty response');
      console.log(`✅ Received Gemini response for ADR generator. Length: ${response.text.length} chars.`);
      const parsed = JSON.parse(response.text);
      console.log(`📋 Successfully generated ${parsed.decisions?.length || 0} architecture decision logs.`);
      return parsed.decisions as ADR[];
    } catch (err: any) {
      console.warn('ADR API failed:', err);
      const error: any = new Error(err.message || 'ADR API failed');
      error.status = err.status || err.statusCode || (err.message?.includes('503') ? 503 : 500);
      throw error;
    }
  }

  private runMockCritic(project: ArchitectureProject): Promise<CriticReview> {
    console.log('⚡ Generating dynamic mock Security Critic audit...');
    const reqs = project.structuredRequirements;
    const findings: CriticReview['findings'] = [];
    const managedIdentityOpportunities: CriticReview['managedIdentityOpportunities'] = [];

    const selectedOptionId = project.selectedOptionId || 'option-a';
    const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];
    const isSaaS = selectedOption?.name?.toLowerCase().includes('saas') || selectedOption?.name?.toLowerCase().includes('power platform') || selectedOptionId === 'option-a';

    // 1. Unrestricted Public Network Exposure (Critical) - Only applies if not Option A
    if (!isSaaS && !reqs.security?.networkIsolation && !reqs.security?.privateConnectivity) {
      findings.push({
        severity: 'Critical',
        title: 'Unrestricted Public Network Exposure',
        description: 'The solution is deployed with public endpoints. No Virtual Network (VNet) isolation is active, meaning compute and database instances are exposed to raw public internet traffic scans.',
        recommendation: 'Deploy your resources inside an Azure VNet, establish Private Endpoints for database instances, and configure Azure Front Door or WAF to block unauthorized ingress.',
        affectedComponent: 'Azure VNet',
        evidence: 'No VNet or Private Endpoint configured in requirements.',
        whyItApplies: 'Applies to custom Azure compute options B and C where public endpoints are exposed.',
        missingInformation: 'Details on corporate network security standard approvals.',
        confidence: 'High',
        findingCategory: 'Critical Security'
      });
    }

    // 2. Identity and Authentication Risk (High)
    const authType = reqs.security?.authentication || '';
    if (!authType.toLowerCase().includes('entra') && !authType.toLowerCase().includes('azure ad')) {
      findings.push({
        severity: 'High',
        title: 'Centralized Identity Governance Risk',
        description: `The authentication method specified ("${authType || 'None'}") does not leverage centralized enterprise IAM, increasing the risk of weak password policies and API credential disclosures.`,
        recommendation: 'Integrate Microsoft Entra ID (formerly Azure Active Directory) as the centralized single sign-on (SSO) authority for both users and service integrations.',
        affectedComponent: 'Microsoft Entra ID',
        evidence: `Authentication type configured: "${authType || 'None'}"`,
        whyItApplies: 'Natively applies to authentication mechanisms across all option frontends.',
        missingInformation: 'Details on existing active directories.',
        confidence: 'High',
        findingCategory: 'Critical Security'
      });
    }

    // 3. Workload Surge Throttling Risks (Medium) - Applies to Option A / B
    const transactions = reqs.workload?.transactionsPerMonth || 0;
    if (transactions > 100000) {
      findings.push({
        severity: 'Medium',
        title: 'Workload Surge Throttling Under Peak Volumes',
        description: `With transactions estimated at ${transactions} per month, synchronous integration runs will face throttling limits and rate locks if traffic spikes suddenly.`,
        recommendation: 'Decouple transaction handshakes by placing an asynchronous message broker (like Azure Service Bus) in front of the target ERP processing services.',
        affectedComponent: isSaaS ? 'Power Automate Flows' : 'API Management',
        evidence: `Estimated monthly transactions count: ${transactions}`,
        whyItApplies: 'Applies to integration paths that handle heavy transaction workloads without asynchronous buffers.',
        missingInformation: 'Peak TPS rates and SAP API rate limits.',
        confidence: 'Medium',
        findingCategory: 'Architecture Risk'
      });
    }

    // 4. Default Data-at-Rest Encryption Risk (Medium)
    if (!reqs.security?.encryption?.trim()) {
      findings.push({
        severity: 'Medium',
        title: 'Default Data-at-Rest Encryption Risk',
        description: 'Sensitive business files are stored without explicit customer-managed key (CMK) encryption parameters, relying on standard platform defaults.',
        recommendation: 'Configure Azure Key Vault to store encryption keys and enforce Transparent Data Encryption (TDE) on database instances.',
        affectedComponent: isSaaS ? 'Dataverse' : 'Azure SQL Database',
        evidence: 'Encryption strategy parameter is empty.',
        whyItApplies: 'Applies to the core storage and databases where files or transactions are stored.',
        missingInformation: 'Corporate compliance encryption policy details.',
        confidence: 'High',
        findingCategory: 'Critical Security'
      });
    }

    // 5. Budget Alert (Low)
    if (!reqs.budget?.monthlyBudget) {
      findings.push({
        severity: 'Low',
        title: 'Lack of Budgetary Consumption Safeguards',
        description: 'No spending alerts or monthly budgets are defined, making the subscription vulnerable to run-away consumption costs during high traffic spikes.',
        recommendation: 'Implement Azure billing alerts to notify technical leads when consumption exceeds 80% of target bounds.',
        affectedComponent: 'Azure Cost Management',
        evidence: 'No monthly budget target configured.',
        whyItApplies: 'Applies to subscription governance controls across all cloud deployment tiers.',
        missingInformation: 'Target departmental cost allocation budgets.',
        confidence: 'High',
        findingCategory: 'Governance Gap'
      });
    }

    // --- Managed Identity Opportunities ---
    if (!isSaaS) {
      if (reqs.data?.relationalData || reqs.data?.noSqlData) {
        managedIdentityOpportunities.push({
          sourceService: 'Azure Functions / App Service',
          targetService: reqs.data.relationalData ? 'Azure SQL Database' : 'Azure Cosmos DB',
          canUseManagedIdentity: true,
          reason: 'Azure SQL and Cosmos DB fully support Microsoft Entra ID database authentication, enabling passwordless connection strings.'
        });
      }

      if (transactions > 100000) {
        managedIdentityOpportunities.push({
          sourceService: 'Azure Functions',
          targetService: 'Azure Service Bus',
          canUseManagedIdentity: true,
          reason: 'Service Bus standard roles (Service Bus Data Sender/Receiver) can be bound directly to the compute system-assigned identity.'
        });
      }
    }

    // Fallback default findings if user filled everything perfectly!
    if (findings.length === 0) {
      findings.push({
        severity: 'Low',
        title: 'Optimized Security Profile',
        description: 'No major vulnerability flags found. All key network isolation, centralized identity, and encryption settings are defined.',
        recommendation: 'Perform periodic automated penetration tests and configure Azure Advisor checks.',
        affectedComponent: 'Tenant Governance',
        evidence: 'All required parameters configured.',
        whyItApplies: 'Applies to highly secure architecture baselines.',
        missingInformation: 'None',
        confidence: 'High',
        findingCategory: 'Optimization Opportunity'
      });
    }

    return Promise.resolve({ findings, managedIdentityOpportunities });
  }

  private runMockWAF(project: ArchitectureProject): Promise<WAFReview> {
    console.log('⚡ Generating dynamic mock WAF Review...');
    const reqs = project.structuredRequirements;
    const selectedOptionId = project.selectedOptionId || 'option-a';
    const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];
    const isSaaS = selectedOption?.name?.toLowerCase().includes('saas') || selectedOption?.name?.toLowerCase().includes('power platform') || selectedOptionId === 'option-a';
    const isHybrid = selectedOption?.name?.toLowerCase().includes('hybrid') || selectedOptionId === 'option-b';
    const isPaaS = selectedOption?.name?.toLowerCase().includes('paas') || selectedOption?.name?.toLowerCase().includes('app service') || selectedOptionId === 'option-c';

    const buildMockPillar = (
      strengths: string[],
      gaps: WAFGap[]
    ): WAFPillarReview => ({
      strengths: strengths.length ? strengths : ['Standard managed service capabilities'],
      gaps
    });

    const securityGaps: WAFGap[] = [];
    const reliabilityGaps: WAFGap[] = [];
    const costGaps: WAFGap[] = [];
    const opsGaps: WAFGap[] = [];
    const perfGaps: WAFGap[] = [];

    // Security Gaps
    if (!reqs.security?.authentication) {
      securityGaps.push({
        title: 'Centralized SSO Authentication Gap',
        severity: 'High',
        affectedComponent: isSaaS ? 'Power Apps' : 'App Service',
        whyItApplies: 'Required to govern user access and ensure least-privilege directory control.',
        evidence: 'No centralized identity provider configured.',
        recommendation: 'Configure Microsoft Entra ID integration.',
        confidence: 'High'
      });
    }

    // Reliability Gaps
    if (isSaaS) {
      reliabilityGaps.push({
        title: 'Downstream SAP Availability SLA Dependency',
        severity: 'Medium',
        affectedComponent: 'Power Automate',
        whyItApplies: 'Option A integrates directly to external SAP endpoints; failures in SAP will affect end-to-end flow execution.',
        evidence: 'Transactions integration to SAP is synchronous.',
        recommendation: 'Configure retry loops and failure notification buffers in Power Automate.',
        confidence: 'High'
      });
    } else {
      reliabilityGaps.push({
        title: 'Single Region Compute Availability Risk',
        severity: 'Medium',
        affectedComponent: 'Azure Functions',
        whyItApplies: 'Compute resources are provisioned in a single region without failover.',
        evidence: `Deployment region: ${project.region || 'Central India'}`,
        recommendation: 'Deploy Azure Functions to a secondary region and configure Traffic Manager / Front Door.',
        confidence: 'Medium'
      });
    }

    // Cost Optimization Gaps
    if (!reqs.budget?.monthlyBudget) {
      costGaps.push({
        title: 'Lack of Automated Cost Warnings',
        severity: 'Low',
        affectedComponent: 'Billing Account',
        whyItApplies: 'Subscriptions require budget alert setups to avoid unexpected scaling bills.',
        evidence: 'Target monthly budget parameters unspecified.',
        recommendation: 'Enforce billing thresholds and trigger alerts at 80% consumption.',
        confidence: 'High'
      });
    }

    // Operational Excellence Gaps
    const deployModel = reqs.development?.deploymentModel || '';
    if (!deployModel.toLowerCase().includes('automated')) {
      opsGaps.push({
        title: 'Manual Deployment Strategy',
        severity: 'Medium',
        affectedComponent: isSaaS ? 'Power Platform Solutions' : 'Infrastructure Resources',
        whyItApplies: 'Manual release models increase deployment drift risks.',
        evidence: `Deployment model: "${deployModel || 'Manual'}"`,
        recommendation: isSaaS ? 'Establish ALM pipelines.' : 'Enforce Infrastructure as Code using Bicep or Terraform.',
        confidence: 'High'
      });
    }

    // Performance Efficiency Gaps
    const txns = reqs.workload?.transactionsPerMonth || 0;
    if (txns > 100000) {
      perfGaps.push({
        title: 'Sync Integration Throughput Constraints',
        severity: 'Medium',
        affectedComponent: isSaaS ? 'Power Automate Flows' : 'Azure SQL Database',
        whyItApplies: 'High workload volumes require validating connection pool sizing and request throttling thresholds.',
        evidence: `Workload volume: ${txns} monthly transactions`,
        recommendation: 'Perform load test validations and benchmark downstream rate limits.',
        confidence: 'Medium'
      });
    }

    return Promise.resolve({
      scores: {
        security: securityGaps.length ? 3 : 5,
        reliability: reliabilityGaps.length ? 3 : 5,
        costOptimization: costGaps.length ? 3 : 5,
        operationalExcellence: opsGaps.length ? 3 : 5,
        performanceEfficiency: perfGaps.length ? 3 : 5
      },
      pillars: {
        security: buildMockPillar(
          reqs.security?.authentication ? [`Enforces identity authentication via ${reqs.security.authentication}`] : [],
          securityGaps
        ),
        reliability: buildMockPillar(
          reqs.availability?.requiredSLA ? [`SLA targets mapped to ${reqs.availability.requiredSLA}`] : [],
          reliabilityGaps
        ),
        costOptimization: buildMockPillar(
          reqs.budget?.monthlyBudget ? [`Baseline monthly budget defined at $${reqs.budget.monthlyBudget}`] : [],
          costGaps
        ),
        operationalExcellence: buildMockPillar(
        deployModel ? [`Deployment tracking strategy: ${deployModel}`] : [],
          opsGaps
        ),
        performanceEfficiency: buildMockPillar(
          txns ? [`Configured to support ${txns} transactions/month`] : [],
          perfGaps
        )
      }
    });
  }

  private runMockADRs(project: ArchitectureProject): Promise<ADR[]> {
    console.log('⚡ Generating dynamic mock ADR documents...');
    const reqs = project.structuredRequirements;
    const selectedOptionId = project.selectedOptionId || 'option-a';
    const region = project.region || 'Central India';
    const transactions = reqs.workload?.transactionsPerMonth || 0;

    const selectedOption = project.architectureOptions?.find(opt => opt.id === selectedOptionId) || project.architectureOptions?.[0];
    const isSaaS = selectedOption?.name?.toLowerCase().includes('saas') || selectedOption?.name?.toLowerCase().includes('power platform') || selectedOptionId === 'option-a';
    const isHybrid = selectedOption?.name?.toLowerCase().includes('hybrid') || selectedOptionId === 'option-b';
    const isPaaS = selectedOption?.name?.toLowerCase().includes('paas') || selectedOption?.name?.toLowerCase().includes('app service') || selectedOptionId === 'option-c';

    const result: ADR[] = [];

    if (isSaaS) {
      result.push({
        id: 'adr-001',
        title: 'Use Microsoft Dataverse instead of SharePoint Lists for structured configuration data',
        status: 'Proposed',
        context: 'The Turbine Configuration Management application contains complex relational schemas and dependencies across gearboxes, couplings, and lubrication parameters.',
        decision: 'We will utilize Microsoft Dataverse as the primary structured relational data store.',
        alternatives: ['SharePoint Online Lists', 'Azure SQL Database'],
        reasons: ['Native Power Apps integration without premium connector latency', 'Rich relational schema design capabilities and referential integrity', 'Built-in security roles and auditing logs'],
        impacts: {
          security: 'Enforces directory-level Entra ID governance and field-level permissions.',
          cost: 'Dataverse storage is billed at baseline rates ($40/GB/month) rather than being included in standard M365 storage.',
          reliability: 'Fully managed Microsoft SLA; avoids custom indexing database administration overhead.'
        },
        consequences: 'Tenant capacity limits must be monitored regularly in the Power Platform Admin Center.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Dataverse is the target data layer for the Microsoft SaaS option.',
        confidence: 90,
        decisionDriver: 'Complex configuration table relationships',
        alternative: 'SharePoint Online Lists',
        reasonRejected: 'SharePoint Lists lack referential integrity and have a 5,000-item view limit constraint.'
      });

      result.push({
        id: 'adr-002',
        title: 'Retain Power Automate for business approvals but throttle direct high-volume SAP updates',
        status: 'Proposed',
        context: 'Operator change approvals require workflow routing, but direct synchronous transaction loads to SAP ERP reach 500,000 requests monthly.',
        decision: 'Use Power Automate for approval routings; configure retry loops and concurrency limits (maximum 50 parallel runs) on the SAP connector.',
        alternatives: ['Azure Service Bus queue buffering', 'Logic Apps synchronous runs'],
        reasons: ['Maintains SaaS-only low-code platform boundaries', 'Native approvals connector triggers alerts directly in Microsoft Teams'],
        impacts: {
          security: 'Protects SAP credentials via Entra ID connection references.',
          cost: 'Included in the Power Automate Premium licenses budget ($15/user/month).',
          reliability: 'Flow failures can trigger automatic email alerts; retries use exponential backoff.'
        },
        consequences: 'We must validate SAP API rate limits to prevent connector rate limits throttling.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Option A relies solely on Power Automate flow orchestrations.',
        confidence: 85,
        decisionDriver: 'Approval workflows and integration boundaries',
        alternative: 'Azure Service Bus queue buffering',
        reasonRejected: 'Azure Service Bus is an infrastructure service and is not available in Option A.'
      });

      result.push({
        id: 'adr-003',
        title: 'Centralize user authentication and RBAC roles on Microsoft Entra ID',
        status: 'Accepted',
        context: 'We require centralized single sign-on (SSO), multifactor authentication (MFA), and audit trails for all operators editing turbine configs.',
        decision: 'Enforce Microsoft Entra ID authentication for the Power Apps front-end and mapped connection references.',
        alternatives: ['Custom credential databases'],
        reasons: ['Leverages existing active Office 365 tenant directory credentials', 'Enables conditional access MFA policies', 'Saves password database maintenance and compliance overhead'],
        impacts: {
          security: 'Eliminates password exposure; enforces tenant identity boundaries.',
          cost: '$0 extra licensing cost as it is included in existing corporate licensing.',
          reliability: 'Enterprise-grade identity uptime SLA.'
        },
        consequences: 'Requires administrators to register connection references using corporate accounts.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Identity provider mapping is shared across all options.',
        confidence: 95,
        decisionDriver: 'Corporate single sign-on security mandates',
        alternative: 'Custom credential databases',
        reasonRejected: 'Introducing custom password storage violates corporate security compliance regulations.'
      });
    } else if (isHybrid) {
      result.push({
        id: 'adr-001',
        title: 'Use Azure API Management (APIM) as a gateway to external legacy SAP ERP services',
        status: 'Proposed',
        context: 'Custom workflows built in Power Apps need to fetch SAP data without direct connections leaking SAP credentials.',
        decision: 'Deploy Azure API Management in front of the SAP endpoints to act as a secure, monitored API gateway.',
        alternatives: ['Direct Custom Connector integration'],
        reasons: ['Centralized endpoint monitoring and request tracking', 'Throttling and rate-limiting enforcement at the gateway level', 'Exposes clean OpenAPI specs for Power Platform flows'],
        impacts: {
          security: 'Enforces OAuth2 keys and secures back-end legacy SAP interfaces.',
          cost: 'Adds APIM billing baseline ($30/month minimum in Developer tier).',
          reliability: 'Shields downstream ERP systems from unexpected frontend request spikes.'
        },
        consequences: 'Requires updating custom connector definitions whenever back-end API schemas change.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Option B utilizes API Management to bridge Low-Code with Azure services.',
        confidence: 88,
        decisionDriver: 'SAP backend security and telemetry isolation',
        alternative: 'Direct Custom Connector integration',
        reasonRejected: 'Direct connectors expose credentials and cannot throttle peak surge traffic before it hits SAP.'
      });

      result.push({
        id: 'adr-002',
        title: 'Decouple transaction payloads using Azure Service Bus queues',
        status: 'Proposed',
        context: 'Workloads of 500,000 monthly transactions require asynchronous transaction handshakes to guarantee message survival.',
        decision: 'Route Power Automate requests into an Azure Service Bus queue for processing by back-end Azure Functions.',
        alternatives: ['Synchronous HTTP trigger updates'],
        reasons: ['FIFO queuing guarantees transaction order', 'Built-in dead-letter queues hold failed items for manual audit reprocessing', 'Decouples transaction surges from direct backend latency'],
        impacts: {
          security: 'Uses Managed Identities to authorize compute triggers (no keys stored in variables).',
          cost: 'Billed on a low consumption base (under $10/month).',
          reliability: 'Guarantees queue durability during SAP offline updates or maintenance.'
        },
        consequences: 'Enforces asynchronous transaction status checking in the frontend UI.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Option B leverages Service Bus for asynchronous enterprise messaging.',
        confidence: 90,
        decisionDriver: 'High-throughput transactional survivability',
        alternative: 'Synchronous HTTP trigger updates',
        reasonRejected: 'Direct HTTP calls time out during peak traffic surges or SAP downtime, losing transaction context.'
      });
    } else {
      // Option C
      result.push({
        id: 'adr-001',
        title: 'Adopt Azure SQL Database (Standard S1 tier) for transactional relational storage',
        status: 'Proposed',
        context: 'The Turbine Configuration Management application requires structured relational storage with custom schema controls and sub-second query latency.',
        decision: 'Deploy Azure SQL Database Standard S1 to serve as the relational configuration catalog.',
        alternatives: ['Azure Cosmos DB NoSQL API', 'Microsoft Dataverse'],
        reasons: ['Strict schema locking and indexing controls', 'ACID transaction boundaries', 'Full administrative database controller access'],
        impacts: {
          security: 'Protected via VNet Private Endpoints and Entra database authentication.',
          cost: 'Fixed infrastructure cost starting at $30/month.',
          reliability: '99.99% database SLA with automated daily point-in-time recovery (PITR) backups.'
        },
        consequences: 'Requires team developers to manage schema migrations manually using Entity Framework or Flyway.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Option C is an Azure-first custom code architecture using SQL.',
        confidence: 92,
        decisionDriver: 'Custom database administration controls',
        alternative: 'Azure Cosmos DB NoSQL API',
        reasonRejected: 'Cosmos DB NoSQL lacks relational schema relationships, increasing query construction complexity.'
      });

      result.push({
        id: 'adr-002',
        title: 'Build a custom React frontend hosted on Azure Static Web Apps',
        status: 'Proposed',
        context: 'We require a custom UI styling framework, advanced charting libraries, and high responsiveness for 2,500 active operators.',
        decision: 'Create a custom React + TypeScript web application and deploy it via Azure Static Web Apps.',
        alternatives: ['Power Apps Canvas Apps'],
        reasons: ['Complete frontend customization freedom and speed', 'Global CDN caching and zero-cost scaling capacity', 'Automated GitHub Actions CI/CD workflows'],
        impacts: {
          security: 'Enforces secure cookies and integrates with Entra ID enterprise applications.',
          cost: 'Extremely cheap static file hosting under consumption pricing.',
          reliability: 'Distributed globally via Edge caching CDNs.'
        },
        consequences: 'Increases initial implementation cycles and team frontend maintenance effort.',
        affectedOptionId: selectedOptionId,
        whyItApplies: 'Option C is a custom-developed web application.',
        confidence: 85,
        decisionDriver: 'Advanced charting and performance customizations',
        alternative: 'Power Apps Canvas Apps',
        reasonRejected: 'Power Apps is a low-code platform and has UI customization limitations for advanced dashboards.'
      });
    }

    return Promise.resolve(result);
  }
}
