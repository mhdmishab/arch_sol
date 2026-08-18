import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  analyzeRequirements,
  updateStructuredRequirements,
  generateArchitectureOptions,
  calculateProjectCosts,
  runCriticAnalysis,
  runWAFReview,
  generateProjectADRs,
  updateADRStatus,
  updateProject
} from './project.controller.js';

const router = Router();

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.delete('/:id', deleteProject);
router.put('/:id', updateProject);
router.post('/:id/requirements/analyze', analyzeRequirements);
router.put('/:id/requirements', updateStructuredRequirements);
router.post('/:id/architecture/generate', generateArchitectureOptions);
router.post('/:id/cost/calculate', calculateProjectCosts);
router.post('/:id/critic/analyze', runCriticAnalysis);
router.post('/:id/well-architected/review', runWAFReview);
router.post('/:id/adr/generate', generateProjectADRs);
router.put('/:id/adr/:adrId', updateADRStatus);

export default router;
