import { connectDB } from './config/db.js';
import { ProjectRepository } from './modules/projects/project.model.js';
import { getAIProvider } from './config/ai.js';

async function testAnalyzer() {
  console.log('🧪 Starting requirements analyzer test...');

  // Initialize DB fallback
  await connectDB();

  // Create a new project
  const name = 'Order E-Commerce Integration';
  const rawTextRequirements = `
    We have a SharePoint application used by 5000 employees.
    It uses Power Automate for workflows.
    We need to integrate with SAP.
    The system processes around 1 million transactions per day.
    We need 99.9% availability.
    The business wants the solution to remain within Microsoft technologies.
    The budget is around $3000/month.
  `;

  console.log('1. Creating test project in database/JSON...');
  const project = await ProjectRepository.create({
    name,
    industry: 'Retail',
    cloudPreference: 'Microsoft',
    expectedUsers: 5000,
    region: 'Central India',
    rawTextRequirements
  });
  console.log(`✅ Test project created with ID: ${project.id}`);

  console.log('2. Running requirements analysis via AI provider...');
  const aiProvider = getAIProvider();
  const result = await aiProvider.analyzeRequirements(project.rawTextRequirements!, {
    industry: project.industry,
    cloudPreference: project.cloudPreference,
    expectedUsers: project.expectedUsers,
    region: project.region
  });

  console.log('\n--- Analysis Results ---');
  console.log(`Completeness Score: ${result.confidenceScore.completeness}%`);
  console.log(`Architecture Score: ${result.confidenceScore.architecture}%`);
  console.log(`Cost Score:         ${result.confidenceScore.cost}%`);
  console.log(`Security Score:     ${result.confidenceScore.security}%`);
  
  console.log('\nExtracted Requirements:');
  result.requirements.forEach((req, idx) => {
    console.log(`  [${req.classification}] (${req.confidence}% conf) ${req.text}`);
  });

  console.log('\nMissing Requirements Detected:');
  result.missingRequirements.forEach((mr, idx) => {
    console.log(`  [${mr.importance} priority] ${mr.field}: ${mr.description}`);
  });

  console.log('\n3. Saving results back to project repository...');
  const updated = await ProjectRepository.update(project.id, {
    requirements: result.requirements.map((r, i) => ({
      id: `req-${Date.now()}-${i}`,
      text: r.text,
      classification: r.classification as any,
      confidence: r.confidence,
      source: 'extracted'
    })),
    missingRequirements: result.missingRequirements,
    confidenceScore: result.confidenceScore
  });

  if (updated && updated.requirements.length > 0) {
    console.log('✅ Test complete: Project successfully analyzed and saved!');
  } else {
    console.error('❌ Test failed: Project could not be updated or saved.');
  }

  process.exit(0);
}

testAnalyzer().catch(err => {
  console.error('💥 Test execution failed:', err);
  process.exit(1);
});
