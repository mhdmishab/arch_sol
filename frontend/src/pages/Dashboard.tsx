import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Calendar, Cpu, ArrowRight, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Project {
  id: string;
  name: string;
  description?: string;
  industry: string;
  cloudPreference: string;
  expectedUsers?: number;
  region: string;
  requirements: any[];
  missingRequirements: any[];
  confidenceScore: {
    completeness: number;
    architecture: number;
    cost: number;
    security: number;
  };
  wellArchitectedReview?: any;
  criticReview?: any;
  decisions?: any[];
  updatedAt: string;
}

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects.');
      }
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getSuccessProbability = (proj: Project) => {
    if (!proj) return 0;
    let prob = 50;
    
    const completeness = proj.confidenceScore?.completeness || 0;
    prob += (completeness / 100) * 20;
    
    const waf = proj.wellArchitectedReview?.scores;
    if (waf) {
      const wafScoresList = [
        waf.security || 0,
        waf.reliability || 0,
        waf.costOptimization || 0,
        waf.operationalExcellence || 0,
        waf.performanceEfficiency || 0
      ];
      const avgWAF = wafScoresList.reduce((a, b) => a + b, 0) / 5;
      prob += (avgWAF / 5) * 15;
    }
    
    const decisions = proj.decisions || [];
    if (decisions.length > 0) {
      const accepted = decisions.filter((d: any) => d.status === 'Accepted').length;
      prob += (accepted / decisions.length) * 15;
    }
    
    const findings = proj.criticReview?.findings || [];
    findings.forEach((f: any) => {
      if (f.severity === 'Critical') prob -= 15;
      else if (f.severity === 'High') prob -= 8;
      else if (f.severity === 'Medium') prob -= 3;
      else if (f.severity === 'Low') prob -= 1;
    });
    
    return Math.max(10, Math.min(100, Math.round(prob)));
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-[#0d1321] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 h-64 w-64 bg-violet-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Welcome to ArchitectAI Workspace</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Input business goals and workloads to extract requirements, evaluate cloud alignments, check constraints, and generate optimized Azure and Microsoft SaaS architecture options.
          </p>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-600/20 hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" />
            Create Architecture Project
          </Link>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2.5 text-gray-200">
            <Folder className="h-5 w-5 text-violet-400" />
            Architecture Projects
          </h3>
          <button
            onClick={fetchProjects}
            className="p-2 rounded-lg bg-[#0d1321] border border-white/5 text-gray-400 hover:text-gray-200 transition-colors"
            title="Refresh Projects"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-white/5 bg-[#0d1321]/30">
            <Cpu className="h-10 w-10 mx-auto text-gray-600 mb-3 animate-pulse" />
            <p className="text-gray-400 font-medium">No architecture projects found</p>
            <p className="text-xs text-gray-600 mt-1 mb-4">Get started by creating your first design project.</p>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-colors"
            >
              Initialize Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const score = getSuccessProbability(project);
              return (
                <div
                  key={project.id}
                  className="rounded-xl bg-[#0d1321]/50 border border-white/5 hover:border-violet-500/30 hover:bg-[#0d1321]/70 transition-all duration-200 p-6 flex flex-col group justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h4 className="font-bold text-gray-200 group-hover:text-violet-400 transition-colors text-base">
                          {project.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                            {project.industry}
                          </span>
                          <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                            {project.cloudPreference}
                          </span>
                          <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                            {project.region}
                          </span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded text-xs font-bold border ${getConfidenceBg(score)}`}>
                        <span className={getConfidenceColor(score)}>{score}% Confidence</span>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-6">
                      {project.description || 'No project description provided. Analyze requirements to evaluate architectures.'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold transition-colors group/link"
                    >
                      Workspace
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
