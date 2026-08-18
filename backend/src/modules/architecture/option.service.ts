import { GoogleGenAI } from '@google/genai';
import { ArchitectureProject, ArchitectureOption } from '../projects/project.model.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

export class OptionService {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.6-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'mock' && apiKey !== 'YOUR_API_KEY_HERE') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateOptions(project: ArchitectureProject): Promise<ArchitectureOption[]> {
    if (!this.ai) {
      console.warn('⚠️ No Gemini API key provided. Cannot generate options. Returning empty options list.');
      return [];
    }

    try {
      const promptPath = path.join(process.cwd(), 'prompts', 'architecture-generator.v1.md');
      let systemPrompt = '';
      if (fs.existsSync(promptPath)) {
        systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      } else {
        throw new Error(`System prompt not found at: ${promptPath}`);
      }

      const userMessage = `Generate architecture options for project:
Name: ${project.name}
Industry: ${project.industry}
Cloud Preference: ${project.cloudPreference}
Expected Users: ${project.expectedUsers || 'Unspecified'}
Region: ${project.region}
Raw Text requirements:
"${project.rawTextRequirements || ''}"

Structured parameters:
${JSON.stringify(project.structuredRequirements, null, 2)}`;

      console.log(`🤖 Sending options generation request to Gemini API...`);
      console.log(`💬 Model: ${this.modelName} | Prompt: ${userMessage.length} chars | System Instruction: ${systemPrompt.length} chars`);
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
              options: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    id: { type: 'STRING' },
                    name: { type: 'STRING' },
                    description: { type: 'STRING' },
                    benefits: { type: 'ARRAY', items: { type: 'STRING' } },
                    disadvantages: { type: 'ARRAY', items: { type: 'STRING' } },
                    complexity: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                    migrationEffort: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
                    services: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          serviceName: { type: 'STRING' },
                          sku: { type: 'STRING' },
                          region: { type: 'STRING' },
                          category: { type: 'STRING', enum: ['Compute', 'Database', 'Storage', 'Networking', 'Integration', 'Security', 'Monitoring'] },
                          usageMetric: { type: 'STRING' },
                          estimatedUsageQuantity: { type: 'INTEGER' },
                          unitPrice: { type: 'INTEGER' },
                          monthlyCost: { type: 'INTEGER' },
                          confidence: { type: 'INTEGER' },
                          reasonSelected: { type: 'STRING' },
                          alternativesRejected: { type: 'ARRAY', items: { type: 'STRING' } }
                        },
                        required: ['serviceName', 'sku', 'region', 'category', 'usageMetric', 'estimatedUsageQuantity', 'unitPrice', 'monthlyCost', 'confidence', 'reasonSelected']
                      }
                    },
                    diagram: {
                      type: 'OBJECT',
                      properties: {
                        nodes: {
                          type: 'ARRAY',
                          items: {
                            type: 'OBJECT',
                            properties: {
                              id: { type: 'STRING' },
                              type: { type: 'STRING' },
                              label: { type: 'STRING' }
                            },
                            required: ['id', 'type', 'label']
                          }
                        },
                        edges: {
                          type: 'ARRAY',
                          items: {
                            type: 'OBJECT',
                            properties: {
                              source: { type: 'STRING' },
                              target: { type: 'STRING' }
                            },
                            required: ['source', 'target']
                          }
                        }
                      },
                      required: ['nodes', 'edges']
                    },
                    comparisonMatrix: {
                      type: 'OBJECT',
                      properties: {
                        security: { type: 'INTEGER' },
                        reliability: { type: 'INTEGER' },
                        scalability: { type: 'INTEGER' },
                        cost: { type: 'INTEGER' },
                        complexity: { type: 'INTEGER' },
                        maintainability: { type: 'INTEGER' },
                        explanations: {
                          type: 'OBJECT',
                          properties: {
                            security: { type: 'STRING' },
                            reliability: { type: 'STRING' },
                            scalability: { type: 'STRING' },
                            cost: { type: 'STRING' },
                            complexity: { type: 'STRING' },
                            maintainability: { type: 'STRING' }
                          }
                        }
                      },
                      required: ['security', 'reliability', 'scalability', 'cost', 'complexity', 'maintainability']
                    }
                  },
                  required: ['id', 'name', 'description', 'benefits', 'disadvantages', 'complexity', 'migrationEffort', 'services', 'diagram', 'comparisonMatrix']
                }
              }
            },
            required: ['options']
          }
        }
      });

      if (!response.text) {
        throw new Error('Empty response from options generator API');
      }

      console.log(`✅ Received Gemini response for options generation. Length: ${response.text.length} chars.`);
      const result = JSON.parse(response.text);
      console.log(`📋 Successfully parsed ${result.options?.length || 0} architecture options from response.`);
      return result.options as ArchitectureOption[];
    } catch (error) {
      console.error('Gemini option generation failed:', error);
      return [];
    }
  }

  private runMockOptionGeneration(project: ArchitectureProject): Promise<ArchitectureOption[]> {
    console.log('⚡ Running dynamic mock architecture options generation...');
    const reqs = project.structuredRequirements || {};
    const region = project.region || 'Central India';
    const transactions = reqs.workload?.transactionsPerMonth || 1000000;
    const expectedUsers = project.expectedUsers || reqs.users?.userCount || 2000;
    const hasVNet = !!(reqs.security?.networkIsolation || reqs.security?.privateConnectivity);

    // Dynamic Sizing choices
    const sqlSku = transactions > 1000000 ? 'Premium P1' : 'Standard S1 (20 DTU)';
    const appServiceSku = transactions > 1000000 ? 'Premium V3 P1v3' : 'Basic B1';
    
    // APIM Pricing Model: VNet requires Developer/Premium tier
    const apimSku = hasVNet ? 'Developer' : 'Consumption';
    const apimQty = hasVNet ? 1 : transactions;
    const apimMetric = hasVNet ? 'Gateway hour' : 'Gateway calls';

    // Database Service mapping based on user selection
    const dbServiceName = reqs.data?.noSqlData && !reqs.data?.relationalData ? 'Azure Cosmos DB' : 'Azure SQL Database';
    const dbSku = dbServiceName === 'Azure Cosmos DB' ? 'NoSQL Autoscale' : sqlSku;
    const dbMetric = dbServiceName === 'Azure Cosmos DB' ? 'Request Unit' : 'Database hour';
    const dbReason = dbServiceName === 'Azure Cosmos DB' 
      ? 'Provides low-latency document stores scaling horizontally for NoSQL data.'
      : `Supports relational tables, ACID compliance, and query joins in the ${region} region.`;
    const dbAlternatives = dbServiceName === 'Azure Cosmos DB'
      ? ['Azure SQL Database (rejected due to rigid relational structure)']
      : ['Azure Cosmos DB NoSQL API (rejected due to complex relational query needs)'];

    const options: ArchitectureOption[] = [
      {
        id: `arch-opt-${crypto.randomUUID()}`,
        name: 'Remain on Microsoft SaaS / Power Platform',
        description: 'Leverage the existing SharePoint lists and Power Automate flow, wrapped in a customized canvas Power App. Keeps the workload fully contained within the low-code SaaS workspace.',
        benefits: [
          'Extremely low development time and immediate deployment.',
          'Zero hosting infrastructure cost (leveraged in existing Microsoft 365 licensing).',
          'Low complexity, maintainable by business analysts.'
        ],
        disadvantages: [
          'Poor performance under large workloads (API limits of Power Automate).',
          'Dataverse/SharePoint API throttling issues.',
          'Lack of professional API governance and legacy ERP transaction locks.'
        ],
        complexity: 'Low',
        migrationEffort: 'Low',
        services: [
          {
            serviceName: 'Power Apps',
            sku: 'Per User Plan',
            region: 'SaaS',
            category: 'Compute',
            usageMetric: 'User License',
            estimatedUsageQuantity: expectedUsers,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 90,
            reasonSelected: 'Low-code portal frontend to interact with SharePoint lists.',
            alternativesRejected: ['Custom React App (requires dedicated hosting and CDN)']
          },
          {
            serviceName: 'Power Automate',
            sku: 'Per User Plan',
            region: 'SaaS',
            category: 'Integration',
            usageMetric: 'Flow runs',
            estimatedUsageQuantity: 1,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 85,
            reasonSelected: 'Orchestrates document approvals and sends system alerts.',
            alternativesRejected: ['Logic Apps (adds Azure compute cost)']
          },
          {
            serviceName: 'SharePoint Online',
            sku: 'Standard List',
            region: 'SaaS',
            category: 'Storage',
            usageMetric: 'Gigabytes stored',
            estimatedUsageQuantity: 200,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 95,
            reasonSelected: 'Primary data store. Leverages existing Microsoft 365 subscriptions.',
            alternativesRejected: ['Azure SQL (requires database license and server setup)']
          }
        ],
        diagram: {
          nodes: [
            { id: 'powerapps', type: 'powerapps', label: 'Power Apps UI' },
            { id: 'flow', type: 'powerautomate', label: 'Power Automate' },
            { id: 'sharepoint', type: 'sharepoint', label: 'SharePoint Lists' }
          ],
          edges: [
            { source: 'powerapps', target: 'flow' },
            { source: 'flow', target: 'sharepoint' }
          ]
        },
        comparisonMatrix: {
          security: 4,
          reliability: 3,
          scalability: 2,
          cost: 5,
          complexity: 5,
          maintainability: 4,
          explanations: {
            security: 'Enforces standard Microsoft 365 compliance and document permissions out of the box.',
            reliability: 'Highly reliable but subject to standard platform throttling during concurrent workflow calls.',
            scalability: 'Low scalability. Throttles at high volumes (e.g. over 10k transactions/day).',
            cost: 'Extremely cheap. Leverages existing office licensing without extra Azure subscriptions.',
            complexity: 'Extremely simple to construct and configure.',
            maintainability: 'Easy to update without dev team skills.'
          }
        }
      },
      {
        id: `arch-opt-${crypto.randomUUID()}`,
        name: 'Hybrid Architecture (Integration & API Management)',
        description: 'Keeps low-code frontends (Power Apps canvas app or SharePoint pages) for business users, but routes backend processes and SAP transaction handshakes through an Azure API Management gateway and serverless API.',
        benefits: [
          'Preserves user experience and training inside SharePoint/Office ecosystem.',
          'Professional integration with API governance, error checking, and retry handling.',
          'Serverless billing model for custom endpoints.'
        ],
        disadvantages: [
          'Split maintenance model across Low-Code and custom code environments.',
          'SaaS API request latency to custom REST endpoints.'
        ],
        complexity: 'Medium',
        migrationEffort: 'Medium',
        services: [
          {
            serviceName: 'Power Apps',
            sku: 'Premium license',
            region: 'SaaS',
            category: 'Compute',
            usageMetric: 'User License',
            estimatedUsageQuantity: expectedUsers,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 90,
            reasonSelected: 'Canvas app frontend for business operations.',
            alternativesRejected: ['Custom Vue/React app (more development effort)']
          },
          {
            serviceName: 'API Management',
            sku: apimSku,
            region,
            category: 'Integration',
            usageMetric: apimMetric,
            estimatedUsageQuantity: apimQty,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 85,
            reasonSelected: `Enforces rate limits, validates authentications, and secures connections on the ${apimSku} tier.`,
            alternativesRejected: ['Direct App Service API (lacks gateway policies)']
          },
          {
            serviceName: 'Azure Functions',
            sku: 'Consumption',
            region,
            category: 'Compute',
            usageMetric: 'Executions',
            estimatedUsageQuantity: transactions,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 90,
            reasonSelected: 'Processes ERP transactional synchronization serverlessly, scaling dynamically.',
            alternativesRejected: ['Container Apps (unnecessary configuration overhead for simple functions)']
          },
          {
            serviceName: 'Azure Service Bus',
            sku: 'Standard',
            region,
            category: 'Integration',
            usageMetric: 'Base unit',
            estimatedUsageQuantity: 1,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 95,
            reasonSelected: 'Provides asynchronous queue system to handle ERP traffic spikes safely without dropouts.',
            alternativesRejected: ['Event Grid (lacks strict FIFO queue transaction controls)']
          }
        ],
        diagram: {
          nodes: [
            { id: 'powerapps', type: 'powerapps', label: 'Power Apps UI' },
            { id: 'apim', type: 'apim', label: 'API Management' },
            { id: 'functions', type: 'azurefunctions', label: 'Azure Functions' },
            { id: 'servicebus', type: 'servicebus', label: 'Service Bus queue' },
            { id: 'erp', type: 'entra', label: 'External ERP (SAP)' }
          ],
          edges: [
            { source: 'powerapps', target: 'apim' },
            { source: 'apim', target: 'functions' },
            { source: 'functions', target: 'servicebus' },
            { source: 'servicebus', target: 'erp' }
          ]
        },
        comparisonMatrix: {
          security: 5,
          reliability: 5,
          scalability: 4,
          cost: 4,
          complexity: 3,
          maintainability: 4,
          explanations: {
            security: 'Secured via APIM token validation and virtual networking options to external services.',
            reliability: 'Service Bus queue guarantees message delivery even when SAP goes offline.',
            scalability: 'Scales serverlessly up to millions of events per month easily.',
            cost: 'Low starting costs due to APIM/Functions consumption tier billing.',
            complexity: 'Medium. Requires setup of Azure resources and Power Apps custom connectors.',
            maintainability: 'Clean decoupling of business frontends from core integrations.'
          }
        }
      },
      {
        id: `arch-opt-${crypto.randomUUID()}`,
        name: 'Cloud Native PaaS (Azure App Service & Database)',
        description: 'Complete custom cloud build. Renders a React SPA frontend hosted on static Web Apps, authenticating via Microsoft Entra ID. Business logic runs entirely in APIM and App Services, storing data in Azure SQL Database.',
        benefits: [
          'Maximum performance, microsecond latencies, and unlimited scalability.',
          'Complete freedom from low-code license fees (Power Apps per-user costs).',
          'Professional CI/CD pipelines and developer tooling.'
        ],
        disadvantages: [
          'High initial development and migration effort.',
          'Dedicated resources (e.g. Azure SQL database, App Service Plan) add fixed monthly costs.'
        ],
        complexity: 'High',
        migrationEffort: 'High',
        services: [
          {
            serviceName: 'App Service',
            sku: appServiceSku,
            region,
            category: 'Compute',
            usageMetric: 'Plan hours',
            estimatedUsageQuantity: 730,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 80,
            reasonSelected: `Dedicated hosting environment for the React SPA and REST API running on ${appServiceSku} tier.`,
            alternativesRejected: ['Virtual Machines (unnecessary OS patching burden)']
          },
          {
            serviceName: dbServiceName,
            sku: dbSku,
            region,
            category: 'Database',
            usageMetric: dbMetric,
            estimatedUsageQuantity: dbServiceName === 'Azure Cosmos DB' ? 10000 : 730,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 90,
            reasonSelected: dbReason,
            alternativesRejected: dbAlternatives
          },
          {
            serviceName: 'API Management',
            sku: apimSku,
            region,
            category: 'Integration',
            usageMetric: apimMetric,
            estimatedUsageQuantity: apimQty,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 90,
            reasonSelected: 'Secures and throttles API request entry points.',
            alternativesRejected: ['Direct App Service (exposes API directly without protection)']
          },
          {
            serviceName: 'Azure Service Bus',
            sku: 'Standard',
            region,
            category: 'Integration',
            usageMetric: 'Base unit',
            estimatedUsageQuantity: 1,
            unitPrice: 0,
            monthlyCost: 0,
            confidence: 95,
            reasonSelected: 'Guarantees reliable message queuing.',
            alternativesRejected: ['Storage Queues (lack transactions and duplicate detection)']
          }
        ],
        diagram: {
          nodes: [
            { id: 'react', type: 'entra', label: 'React SPA Frontend' },
            { id: 'apim', type: 'apim', label: 'API Management' },
            { id: 'appservice', type: 'azurefunctions', label: 'API App Service' },
            { id: 'sql', type: 'database', label: dbServiceName === 'Azure Cosmos DB' ? 'Cosmos DB (NoSQL)' : 'Azure SQL Database' },
            { id: 'servicebus', type: 'servicebus', label: 'Service Bus queue' },
            { id: 'erp', type: 'entra', label: 'External ERP (SAP)' }
          ],
          edges: [
            { source: 'react', target: 'apim' },
            { source: 'apim', target: 'appservice' },
            { source: 'appservice', target: 'sql' },
            { source: 'appservice', target: 'servicebus' },
            { source: 'servicebus', target: 'erp' }
          ]
        },
        comparisonMatrix: {
          security: 5,
          reliability: 5,
          scalability: 5,
          cost: 2,
          complexity: 2,
          maintainability: 3,
          explanations: {
            security: 'Full network boundary control via VNets and Private Links. Zero public endpoints.',
            reliability: 'Highly resilient. Custom code lets us customize database connection pools and fault tolerance.',
            scalability: 'Virtually unlimited. Can scale horizontally automatically.',
            cost: 'Expensive starting baseline. Dedicated database and compute add fixed monthly costs.',
            complexity: 'High. Requires professional cloud engineering and deployment orchestrations.',
            maintainability: 'Requires developer skillset to make custom edits and support.'
          }
        }
      }
    ];

    return Promise.resolve(options);
  }
}
