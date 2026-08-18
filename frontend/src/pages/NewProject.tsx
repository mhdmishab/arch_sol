import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Cpu } from 'lucide-react';
import { API_BASE_URL } from '../config';

export function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('Retail');
  const [cloudPreference, setCloudPreference] = useState('Microsoft');
  const [expectedUsers, setExpectedUsers] = useState('');
  const [region, setRegion] = useState('Central India');
  const [rawTextRequirements, setRawTextRequirements] = useState('');

  const industries = [
    'Retail',
    'Finance & Banking',
    'Healthcare',
    'Manufacturing',
    'Energy',
    'Education',
    'Public Sector',
    'Technology',
    'Logistics & Supply Chain'
  ];

  const cloudPreferences = [
    'Microsoft',
    'Azure',
    'AWS',
    'GCP',
    'Hybrid',
    'No preference'
  ];

  const regions = [
    'Central India',
    'East US',
    'West US',
    'West Europe',
    'Southeast Asia',
    'Australia East',
    'UK South'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          industry,
          cloudPreference,
          expectedUsers: expectedUsers ? Number(expectedUsers) : undefined,
          region,
          rawTextRequirements,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project.');
      }

      const createdProject = await response.json();
      
      // If we have requirements text, trigger the analysis immediately
      if (rawTextRequirements.trim() !== '') {
        console.log('Requirements present, auto-running analysis...');
        await fetch(`${API_BASE_URL}/projects/${createdProject.id}/requirements/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
      }

      navigate(`/projects/${createdProject.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the project.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setName('Customer Order Platform');
    setDescription('Solution architecture for processing e-commerce orders, tracking inventory, and publishing notifications.');
    setIndustry('Retail');
    setCloudPreference('Microsoft');
    setExpectedUsers('2500');
    setRegion('Central India');
    setRawTextRequirements(`We have a legacy SharePoint application used by 2500 employees. It uses Power Automate for basic approval workflows.
We need to rebuild it to integrate with an external SAP ERP system.
The system is expected to handle around 500,000 transactions per month.
We need a 99.9% availability SLA.
The customer requires their data to remain within the Microsoft cloud ecosystem.
The approximate budget is $1500/month.
We also need robust security with role-based access control and encryption.`);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-200">Initialize Solution Design</h2>
          <p className="text-xs text-gray-500 mt-1">Specify target metadata and describe your business problems to begin.</p>
        </div>
        <button
          onClick={handleFillDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-xs text-violet-400 font-semibold transition-colors"
        >
          <Cpu className="h-3.5 w-3.5" />
          Load Demo Case
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Metadata and requirements */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Project Scope</h3>
            
            <div className="space-y-1.5">
              <label htmlFor="projectName" className="text-xs font-semibold text-gray-400">Project Name *</label>
              <input
                id="projectName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Enterprise Ordering Gateway"
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-gray-400">Project Context / Summary</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a brief context or business background (optional)..."
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Elicitation Prompt (Raw Text)</h3>
              <span className="text-[10px] text-gray-500">Natural Language requirement input</span>
            </div>
            
            <div className="space-y-1.5">
              <textarea
                rows={8}
                value={rawTextRequirements}
                onChange={(e) => setRawTextRequirements(e.target.value)}
                placeholder="Type your architecture notes, transcripts, or specifications here... (e.g. 'We have a SharePoint portal with 5000 users. We need SAP synchronization. The system needs to be online 99.9% of the time. Target budget is $1000/month...')"
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors resize-none leading-relaxed"
              />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                The ArchitectAI requirements engine uses a custom model pass to parse this raw text block, classify items, flag missing parameters, and estimate architectural readiness.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Cloud context filters */}
        <div className="space-y-6">
          <div className="rounded-xl bg-[#0d1321]/50 border border-white/5 p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Architectural Filters</h3>

            <div className="space-y-1.5">
              <label htmlFor="industry" className="text-xs font-semibold text-gray-400">Industry Sector</label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cloudPreference" className="text-xs font-semibold text-gray-400">Cloud Platform Preference</label>
              <select
                id="cloudPreference"
                value={cloudPreference}
                onChange={(e) => setCloudPreference(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                {cloudPreferences.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="expectedUsers" className="text-xs font-semibold text-gray-400">Expected Active Users</label>
              <input
                id="expectedUsers"
                type="number"
                value={expectedUsers}
                onChange={(e) => setExpectedUsers(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="region" className="text-xs font-semibold text-gray-400">Target Region</label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#080c14] border border-white/5 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
              >
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action box */}
          <div className="rounded-xl bg-[#0d1321]/30 border border-dashed border-white/5 p-6 flex flex-col gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-all duration-200 shadow-lg shadow-violet-600/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze & Save Project
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
