import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ProjectRepository } from './modules/projects/project.model.js';
import { OptionService } from './modules/architecture/option.service.js';
import { CostCalculator } from './modules/cost/cost.calculator.js';
import { EvaluatorService } from './modules/architecture/evaluator.service.js';

dotenv.config();

async function testArchitectureFlow() {
  console.log('🧪 Starting ArchitectAI complete solution architecture flow verification...');

  // Connect Mongoose if URI is present
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri !== 'mock' && mongoUri !== 'YOUR_API_KEY_HERE') {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB.');
    } catch {
      console.warn('⚠️ MongoDB connection failed, running with local file fallbacks.');
    }
  }

  // 1. Create a dummy project
  console.log('\nStep 1: Creating a project to evaluate...');
  const project = await ProjectRepository.create({
    name: 'Enterprise Logistics Rebuild',
    industry: 'Logistics',
    cloudPreference: 'Azure',
    region: 'East US',
    expectedUsers: 2500,
    rawTextRequirements: 'We need to migrate our legacy order sync process. Expected peak is 50 requests/second. Budget target is $3000/month. Standard Entra security isolation required.',
    structuredRequirements: {
      business: {
        businessProblem: 'Legacy ERP timeout during spike periods',
        businessObjective: 'Highly available transaction synchronization portal',
        businessCriticality: 'High'
      },
      users: {
        userCount: 2500,
        userTypes: 'Internal employees and suppliers',
        geographicDistribution: 'East US and Europe',
        authenticationRequirements: 'SSO Entra ID'
      },
      workload: {
        requestsPerSecond: 50,
        transactionsPerMonth: 1200000
      },
      availability: {
        requiredSLA: '99.9%',
        rto: 240,
        rpo: 60
      },
      security: {
        authentication: 'Entra ID',
        authorization: 'RBAC',
        networkIsolation: true,
        privateConnectivity: true
      },
      integration: {
        existingAPIs: 'REST Web Service',
        erp: 'SAP Integration'
      },
      data: {
        relationalData: true,
        documents: true
      },
      budget: {
        monthlyBudget: 3000,
        maximumBudget: 5000,
        costSensitivity: 'Medium'
      },
      development: {
        existingTeamSkills: 'React, TypeScript and .NET'
      }
    }
  });
  console.log(`✅ Project created with ID: ${project.id}`);

  // 2. Generate Options
  console.log('\nStep 2: Generating architecture options (Option A, B, C)...');
  const optionService = new OptionService();
  const options = await optionService.generateOptions(project);
  console.log(`✅ Generated ${options.length} options:`);
  options.forEach(o => console.log(`   - [${o.id}] ${o.name} (${o.services.length} services)`));

  // Save options to project document
  const projectWithOptions = await ProjectRepository.update(project.id, {
    architectureOptions: options,
    selectedOptionId: options[1]?.id
  });

  if (!projectWithOptions) throw new Error('Failed to update project options');

  // 3. Calculate Scenarios Costs
  console.log('\nStep 3: Calculating scenario costs (Low, Expected, High) for options...');
  const costCalculator = new CostCalculator();
  const scenarioCosts = await costCalculator.calculateScenarios(projectWithOptions);
  for (const [optId, details] of Object.entries(scenarioCosts)) {
    console.log(`   - [Option: ${optId}] Costs -> Low: $${details.lowCost}/mo, Expected: $${details.expectedCost}/mo, High: $${details.highCost}/mo`);
    if (details.warnings.length > 0) {
      details.warnings.forEach(w => console.log(`     ⚠️ Warning: ${w}`));
    }
  }

  // 4. Run Evaluator audits (Critic, WAF, ADRs)
  console.log('\nStep 4: Running Critic audit, WAF ratings, and ADR proposals...');
  const evaluator = new EvaluatorService();
  
  const criticResult = await evaluator.evaluateCritic(projectWithOptions);
  console.log(`✅ Critic audit complete. Found ${criticResult.findings.length} findings.`);
  criticResult.findings.forEach(f => console.log(`   - [${f.severity}] ${f.title}: ${f.recommendation}`));

  const wafResult = await evaluator.evaluateWAF(projectWithOptions);
  console.log(`✅ WAF review complete. Score ratings:`);
  console.log(`   - Security: ${wafResult.scores.security}/5`);
  console.log(`   - Reliability: ${wafResult.scores.reliability}/5`);
  console.log(`   - Cost Optimization: ${wafResult.scores.costOptimization}/5`);

  const adrs = await evaluator.generateADRs(projectWithOptions);
  console.log(`✅ ADR proposals drafted:`);
  adrs.forEach(a => console.log(`   - [${a.id} - ${a.status}] ${a.title}`));

  // 5. Cleanup project
  console.log('\nStep 5: Cleaning up test records...');
  await ProjectRepository.delete(project.id);
  console.log('✅ Cleaned up successfully.');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  console.log('🏁 Integration flow test complete!');
}

testArchitectureFlow().catch(console.error);
