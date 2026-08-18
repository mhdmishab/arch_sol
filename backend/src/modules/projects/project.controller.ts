import { Request, Response, NextFunction } from 'express';
import { ProjectRepository, StructuredRequirements, ConfidenceScore, createDefaultStructuredRequirements } from './project.model.js';
import { getAIProvider } from '../../config/ai.js';
import { OptionService } from '../architecture/option.service.js';
import { CostCalculator } from '../cost/cost.calculator.js';
import { EvaluatorService } from '../architecture/evaluator.service.js';

export function calculateDeterministicConfidence(reqs: StructuredRequirements): ConfidenceScore {
  let totalFields = 0;
  let populatedFields = 0;

  const checkValue = (val: any) => {
    totalFields++;
    if (val !== undefined && val !== null) {
      if (typeof val === 'string') {
        if (val.trim() !== '') populatedFields++;
      } else if (typeof val === 'number') {
        if (val > 0) populatedFields++;
      } else if (typeof val === 'boolean') {
        // Any defined boolean counts as specified
        populatedFields++;
      } else {
        populatedFields++;
      }
    }
  };

  // Business (6 fields)
  checkValue(reqs.business?.businessProblem);
  checkValue(reqs.business?.businessObjective);
  checkValue(reqs.business?.businessCriticality);
  checkValue(reqs.business?.existingApplication);
  checkValue(reqs.business?.existingTechnology);
  checkValue(reqs.business?.currentPainPoints);

  // Users (4 fields)
  checkValue(reqs.users?.userCount);
  checkValue(reqs.users?.userTypes);
  checkValue(reqs.users?.geographicDistribution);
  checkValue(reqs.users?.authenticationRequirements);

  // Workload (8 fields)
  checkValue(reqs.workload?.requestsPerSecond);
  checkValue(reqs.workload?.requestsPerMinute);
  checkValue(reqs.workload?.requestsPerDay);
  checkValue(reqs.workload?.transactionsPerMonth);
  checkValue(reqs.workload?.peakTraffic);
  checkValue(reqs.workload?.averagePayloadSize);
  checkValue(reqs.workload?.fileSize);
  checkValue(reqs.workload?.dataVolume);

  // Availability & DR (5 fields)
  checkValue(reqs.availability?.requiredSLA);
  checkValue(reqs.availability?.rto);
  checkValue(reqs.availability?.rpo);
  checkValue(reqs.availability?.disasterRecoveryRequirements);
  checkValue(reqs.availability?.multiRegionRequirement);

  // Security & Network (7 fields)
  checkValue(reqs.security?.authentication);
  checkValue(reqs.security?.authorization);
  checkValue(reqs.security?.sensitiveData);
  checkValue(reqs.security?.compliance);
  checkValue(reqs.security?.encryption);
  checkValue(reqs.security?.networkIsolation);
  checkValue(reqs.security?.privateConnectivity);

  // System Integration (8 fields)
  checkValue(reqs.integration?.existingAPIs);
  checkValue(reqs.integration?.erp);
  checkValue(reqs.integration?.crm);
  checkValue(reqs.integration?.sap);
  checkValue(reqs.integration?.sharepoint);
  checkValue(reqs.integration?.dataverse);
  checkValue(reqs.integration?.externalSystems);
  checkValue(reqs.integration?.thirdPartyAPIs);

  // Data & Database (6 fields)
  checkValue(reqs.data?.relationalData);
  checkValue(reqs.data?.noSqlData);
  checkValue(reqs.data?.documents);
  checkValue(reqs.data?.search);
  checkValue(reqs.data?.analytics);
  checkValue(reqs.data?.retentionPeriod);

  // Budget & Costs (3 fields)
  checkValue(reqs.budget?.monthlyBudget);
  checkValue(reqs.budget?.maximumBudget);
  checkValue(reqs.budget?.costSensitivity);

  // Development Team (4 fields)
  checkValue(reqs.development?.existingTeamSkills);
  checkValue(reqs.development?.preferredLanguage);
  checkValue(reqs.development?.existingCodebase);
  checkValue(reqs.development?.deploymentModel);

  const completeness = Math.min(100, Math.round((populatedFields / totalFields) * 100));

  // 2. Security Score
  let securityScore = 15; // base threshold
  if (reqs.security?.authentication?.trim()) securityScore += 30;
  if (reqs.security?.authorization?.trim()) securityScore += 20;
  if (reqs.security?.encryption?.trim()) securityScore += 20;
  if (reqs.security?.networkIsolation) securityScore += 15;

  // 3. Cost Score
  let costScore = 20; // base threshold
  if (reqs.budget?.monthlyBudget || reqs.budget?.maximumBudget) costScore += 40;
  if (reqs.workload?.transactionsPerMonth || reqs.workload?.requestsPerDay) costScore += 30;
  if (reqs.budget?.costSensitivity) costScore += 10;

  // 4. Architecture Score
  const architecture = Math.round((completeness + securityScore + costScore) / 3);

  return {
    completeness,
    security: securityScore,
    cost: costScore,
    architecture
  };
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description, industry, cloudPreference, expectedUsers, region, rawTextRequirements } = req.body;

    if (!name || !industry || !cloudPreference || !region) {
      res.status(400).json({ error: 'Missing required fields: name, industry, cloudPreference, and region are required.' });
      return;
    }

    const parsedUsers = expectedUsers ? Number(expectedUsers) : undefined;
    const defaultSpecs = createDefaultStructuredRequirements();
    if (parsedUsers !== undefined) {
      defaultSpecs.users.userCount = parsedUsers;
    }

    const project = await ProjectRepository.create({
      name,
      description,
      industry,
      cloudPreference,
      expectedUsers: parsedUsers,
      region,
      rawTextRequirements: rawTextRequirements || '',
      requirements: [],
      missingRequirements: [],
      confidenceScore: { completeness: 0, architecture: 0, cost: 0, security: 0 },
      structuredRequirements: defaultSpecs
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await ProjectRepository.findAll();
    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deleted = await ProjectRepository.delete(id);

    if (!deleted) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function analyzeRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { rawTextRequirements } = req.body;

    const project = await ProjectRepository.findById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    // Use updated text if provided in body, else use existing stored text
    const textToAnalyze = rawTextRequirements !== undefined ? rawTextRequirements : project.rawTextRequirements;

    if (!textToAnalyze || textToAnalyze.trim() === '') {
      res.status(400).json({ error: 'No raw requirements text found to analyze.' });
      return;
    }

    // Update raw text first if it was passed in the request body
    if (rawTextRequirements !== undefined && rawTextRequirements !== project.rawTextRequirements) {
      await ProjectRepository.update(id, { rawTextRequirements });
    }

    console.log(`🧠 Triggering AI requirement analysis for project: ${project.name}`);
    const aiProvider = getAIProvider();
    const analysisResult = await aiProvider.analyzeRequirements(textToAnalyze, {
      industry: project.industry,
      cloudPreference: project.cloudPreference,
      expectedUsers: project.expectedUsers,
      region: project.region
    });

    const analyzedUserCount = analysisResult.structuredRequirements?.users?.userCount;

    const updatedProject = await ProjectRepository.update(id, {
      requirements: analysisResult.requirements.map((r: any, i: number) => ({
        id: `req-${Date.now()}-${i}`,
        text: r.text,
        classification: r.classification as any,
        confidence: r.confidence,
        source: 'extracted'
      })),
      missingRequirements: analysisResult.missingRequirements,
      structuredRequirements: analysisResult.structuredRequirements || project.structuredRequirements,
      expectedUsers: typeof analyzedUserCount === 'number' ? analyzedUserCount : project.expectedUsers,
      confidenceScore: analysisResult.structuredRequirements
        ? calculateDeterministicConfidence(analysisResult.structuredRequirements)
        : analysisResult.confidenceScore
    });

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
}

export async function updateStructuredRequirements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { structuredRequirements } = req.body;

    if (!structuredRequirements) {
      res.status(400).json({ error: 'Missing structuredRequirements object in body.' });
      return;
    }

    const project = await ProjectRepository.findById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    // Sync root expectedUsers with structuredRequirements.users.userCount
    const userCountVal = structuredRequirements.users?.userCount;
    const expectedUsers = (userCountVal === null || userCountVal === undefined) ? undefined : Number(userCountVal);

    // Recalculate confidence score
    const confidenceScore = calculateDeterministicConfidence(structuredRequirements);

    // Recalculate missing requirements checklist by filtering out resolved fields
    let updatedMissing = project.missingRequirements || [];
    
    // Map missing field names to structured requirements lookups
    const isFieldPopulated = (fieldName: string, reqs: StructuredRequirements): boolean => {
      const name = fieldName.toLowerCase();
      if (name.includes('sla') || name.includes('availability target')) {
        return !!reqs.availability?.requiredSLA?.trim();
      }
      if (name.includes('rto') || name.includes('rpo')) {
        return !!((reqs.availability?.rto !== undefined && reqs.availability.rto > 0) || (reqs.availability?.rpo !== undefined && reqs.availability.rpo > 0));
      }
      if (name.includes('budget')) {
        return !!(reqs.budget?.monthlyBudget && reqs.budget.monthlyBudget > 0);
      }
      if (name.includes('user count') || name.includes('number of users')) {
        return !!(reqs.users?.userCount && reqs.users.userCount > 0);
      }
      if (name.includes('auth') || name.includes('identity')) {
        return !!reqs.security?.authentication?.trim();
      }
      if (name.includes('security') || name.includes('encryption')) {
        return !!(reqs.security?.encryption?.trim() || reqs.security?.authorization?.trim());
      }
      if (name.includes('sap')) {
        return !!reqs.integration?.sap?.trim();
      }
      if (name.includes('erp')) {
        return !!reqs.integration?.erp?.trim();
      }
      if (name.includes('database') || name.includes('data storage')) {
        return !!(reqs.workload?.dataVolume?.trim() || reqs.data?.relationalData || reqs.data?.noSqlData || reqs.data?.documents);
      }
      return false;
    };

    updatedMissing = updatedMissing.filter(mr => !isFieldPopulated(mr.field, structuredRequirements));

    // Mark reviews as stale when requirements change
    let architectureOptions = project.architectureOptions || [];
    if (architectureOptions.length > 0) {
      architectureOptions = architectureOptions.map(opt => {
        const updatedOpt = { ...opt };
        if (updatedOpt.criticReview) {
          updatedOpt.criticReview = { ...updatedOpt.criticReview, isStale: true };
        }
        if (updatedOpt.wellArchitectedReview) {
          updatedOpt.wellArchitectedReview = { ...updatedOpt.wellArchitectedReview, isStale: true };
        }
        return updatedOpt;
      });
    }
    const rootCritic = project.criticReview ? { ...project.criticReview, isStale: true } : undefined;
    const rootWAF = project.wellArchitectedReview ? { ...project.wellArchitectedReview, isStale: true } : undefined;

    const updated = await ProjectRepository.update(id, {
      structuredRequirements,
      confidenceScore,
      missingRequirements: updatedMissing,
      expectedUsers: expectedUsers,
      architectureOptions,
      criticReview: rootCritic,
      wellArchitectedReview: rootWAF,
      costScenariosStale: true
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function generateArchitectureOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    console.log(`🤖 Generating architecture options for project: ${project.name}`);
    const optionService = new OptionService();
    const options = await optionService.generateOptions(project);

    // Save generated options
    const updated = await ProjectRepository.update(id, {
      architectureOptions: options,
      selectedOptionId: options[1]?.id || options[0]?.id // Default select Option B or A
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function calculateProjectCosts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    console.log(`💲 Triggering cost scenarios calculation for project: ${project.name}`);
    const calculator = new CostCalculator();
    const scenarioResults = await calculator.calculateScenarios(project);

    // Update Project Option components monthlyCost and unitPrice with expected totals
    const options = project.architectureOptions || [];
    const updatedOptions = options.map((opt) => {
      const result = scenarioResults[opt.id];
      if (!result) return opt;

      const services = opt.services.map((service) => {
        const componentResult = result.components.find(
          (c) => c.serviceName === service.serviceName && c.sku === service.sku
        );
        if (!componentResult) return service;

        return {
          ...service,
          unitPrice: componentResult.unitPrice,
          monthlyCost: componentResult.expectedCost
        };
      });

      return {
        ...opt,
        services
      };
    });

    // Save updated options with pricing populated and cache costScenarios
    await ProjectRepository.update(id, {
      architectureOptions: updatedOptions,
      costScenarios: scenarioResults,
      costScenariosStale: false
    });

    res.json(scenarioResults);
  } catch (error) {
    next(error);
  }
}

export async function runCriticAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    console.log(`🛡️ Running security critic review for project: ${project.name}`);
    const evaluator = new EvaluatorService();
    const criticReview = await evaluator.evaluateCritic(project);
    criticReview.isStale = false;

    const selectedOptionId = project.selectedOptionId || 'option-a';
    const optIndex = (project.architectureOptions || []).findIndex(opt => opt.id === selectedOptionId);

    const updates: any = { criticReview };
    if (optIndex !== -1) {
      project.architectureOptions[optIndex].criticReview = criticReview;
      updates.architectureOptions = project.architectureOptions;
    }

    const updated = await ProjectRepository.update(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function runWAFReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    console.log(`📋 Running WAF pillar review for project: ${project.name}`);
    const evaluator = new EvaluatorService();
    const wellArchitectedReview = await evaluator.evaluateWAF(project);
    wellArchitectedReview.isStale = false;

    const selectedOptionId = project.selectedOptionId || 'option-a';
    const optIndex = (project.architectureOptions || []).findIndex(opt => opt.id === selectedOptionId);

    const updates: any = { wellArchitectedReview };
    if (optIndex !== -1) {
      project.architectureOptions[optIndex].wellArchitectedReview = wellArchitectedReview;
      updates.architectureOptions = project.architectureOptions;
    }

    const updated = await ProjectRepository.update(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function generateProjectADRs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await ProjectRepository.findById(id);

    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    console.log(`📝 Generating ADR logs for project: ${project.name}`);
    const evaluator = new EvaluatorService();
    const decisions = await evaluator.generateADRs(project);

    // Keep decisions from other options, and merge/overwrite the ones for the selectedOptionId
    const selectedOptionId = project.selectedOptionId || 'option-a';
    const otherOptionDecisions = (project.decisions || []).filter(d => d.affectedOptionId !== selectedOptionId);
    const updatedDecisions = [...otherOptionDecisions, ...decisions];

    const updated = await ProjectRepository.update(id, { decisions: updatedDecisions });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function updateADRStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, adrId } = req.params;
    const { status } = req.body; // 'Proposed' | 'Accepted' | 'Rejected'

    const project = await ProjectRepository.findById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    const decisions = project.decisions || [];
    const adrIndex = decisions.findIndex((d) => d.id === adrId);
    if (adrIndex === -1) {
      res.status(404).json({ error: `ADR with ID ${adrId} not found.` });
      return;
    }

    // Update status
    decisions[adrIndex].status = status;

    const updated = await ProjectRepository.update(id, { decisions });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { selectedOptionId } = req.body;

    const project = await ProjectRepository.findById(id);
    if (!project) {
      res.status(404).json({ error: `Project with ID ${id} not found.` });
      return;
    }

    const updates: any = {};
    if (selectedOptionId !== undefined) {
      updates.selectedOptionId = selectedOptionId;
    }

    const updated = await ProjectRepository.update(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
