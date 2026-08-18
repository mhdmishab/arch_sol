import { ArchitectureProject, ArchitectureOption } from '../projects/project.model.js';
import { PricingService } from '../pricing/pricing.service.js';

interface ScenarioResult {
  lowCost: number;
  expectedCost: number;
  highCost: number;
  components: Array<{
    serviceName: string;
    sku: string;
    category: string;
    unitPrice: number;
    unit: string;
    lowQty: number;
    expectedQty: number;
    highQty: number;
    lowCost: number;
    expectedCost: number;
    highCost: number;
    reasonSelected: string;
    costCategory?: 'Azure Infrastructure' | 'Microsoft Licensing' | 'External Licensing';
    sourceType?: 'Azure API' | 'Microsoft Published License' | 'External licensing / Assumed' | 'Requires customer contract' | 'Estimate / N/A';
  }>;
  warnings: string[];
}

export class CostCalculator {
  private pricing = new PricingService();

  async calculateScenarios(project: ArchitectureProject): Promise<Record<string, ScenarioResult>> {
    const results: Record<string, ScenarioResult> = {};
    const options = project.architectureOptions || [];

    // Retrieve budget parameters
    const targetBudget = project.structuredRequirements?.budget?.monthlyBudget || 3000;
    const maxBudget = project.structuredRequirements?.budget?.maximumBudget || 5000;

    const m365LicenseTier = project.structuredRequirements?.budget?.m365LicenseTier || 'None';
    const m365UserCount = project.structuredRequirements?.budget?.m365UserCount || project.structuredRequirements?.users?.userCount || project.expectedUsers || 1000;
    const powerAutomatePremiumAdminOnly = project.structuredRequirements?.budget?.powerAutomatePremiumAdminOnly || false;
    const licensingModel = project.structuredRequirements?.budget?.licensingModel || 'User-based';

    // Parse data volume string (e.g. "500 GB" -> 500)
    const parseDataVolumeGB = (volStr?: string): number => {
      if (!volStr) return 100;
      const match = volStr.match(/(\d+(?:\.\d+)?)\s*(gb|tb|mb)/i);
      if (!match) return 100;
      const val = parseFloat(match[1]);
      const unitType = match[2].toLowerCase();
      if (unitType === 'tb') return val * 1024;
      if (unitType === 'mb') return val / 1024;
      return val;
    };
    const dataVolumeGB = parseDataVolumeGB(project.structuredRequirements?.workload?.dataVolume);

    // Define Scenario parameters
    const expectedUsers = project.structuredRequirements?.users?.userCount || project.expectedUsers || 1000;
    const expectedTxns = project.structuredRequirements?.workload?.transactionsPerMonth || 500000;

    const lowUsers = 100;
    const lowTxns = 10000;

    const highUsers = expectedUsers * 5;
    const highTxns = expectedTxns * 5;

    for (const opt of options) {
      const components: ScenarioResult['components'] = [];
      let totalLow = 0;
      let totalExpected = 0;
      let totalHigh = 0;
      const warnings: string[] = [];

      for (const service of opt.services) {
        let unitPrice = 0;
        let unit = 'Unit';
        let costCategory: 'Azure Infrastructure' | 'Microsoft Licensing' | 'External Licensing' = 'Azure Infrastructure';
        let sourceType: 'Azure API' | 'Microsoft Published License' | 'External licensing / Assumed' | 'Requires customer contract' | 'Estimate / N/A' = 'Azure API';

        let lowQty = service.estimatedUsageQuantity || 1;
        let expectedQty = service.estimatedUsageQuantity || 1;
        let highQty = service.estimatedUsageQuantity || 1;
        let reasonSelected = service.reasonSelected;

        const serviceNameLower = service.serviceName.toLowerCase();
        const skuLower = service.sku.toLowerCase();

        // 1. Separate by platform types:
        if (serviceNameLower.includes('power apps') || serviceNameLower.includes('powerapps')) {
          costCategory = 'Microsoft Licensing';
          sourceType = 'Microsoft Published License';
          
          if (licensingModel === 'Business-based') {
            unitPrice = 5.0; // Power Apps Per App plan
            unit = 'User/App/Month';
            lowQty = Math.max(1, Math.round(expectedUsers * 0.1));
            expectedQty = expectedUsers;
            highQty = highUsers;
            reasonSelected = `${service.reasonSelected} (Switched to Business Per App plan)`;
          } else if (licensingModel === 'Enterprise-based') {
            unitPrice = 10.0; // Power Apps PAYG plan (based on active monthly users)
            unit = 'Active User/Month';
            lowQty = Math.max(1, Math.round(expectedUsers * 0.05)); // 5% active
            expectedQty = Math.max(1, Math.round(expectedUsers * 0.25)); // 25% active
            highQty = Math.max(1, Math.round(highUsers * 0.4)); // 40% active
            reasonSelected = `${service.reasonSelected} (Switched to Enterprise PAYG dynamic consumption plan)`;
          } else {
            unitPrice = 20.0; // Power Apps Premium default
            unit = 'User/Month';
            lowQty = Math.max(1, Math.round(expectedUsers * 0.1));
            expectedQty = expectedUsers;
            highQty = highUsers;
          }
        } 
        else if (serviceNameLower.includes('power automate') || serviceNameLower.includes('powerautomate')) {
          costCategory = 'Microsoft Licensing';
          sourceType = 'Microsoft Published License';
          
          if (licensingModel === 'Business-based') {
            unitPrice = 100.0; // Power Automate Per Flow plan
            unit = 'Flow/Month';
            lowQty = 1;
            expectedQty = 2; // Assuming 2 flows for the solution
            highQty = 4;
            reasonSelected = `${service.reasonSelected} (Switched to Business Per Flow flat licensing)`;
          } else if (licensingModel === 'Enterprise-based') {
            unitPrice = 0.6; // Logic Apps Consumption/PAYG run estimate
            unit = 'Runs/Month';
            lowQty = lowTxns;
            expectedQty = expectedTxns;
            highQty = highTxns;
            reasonSelected = `${service.reasonSelected} (Switched to Enterprise consumption execution runs)`;
          } else {
            unit = powerAutomatePremiumAdminOnly ? 'Admin User/Month' : 'User/Month';
            unitPrice = 15.0; // Power Automate Premium default
            
            if (powerAutomatePremiumAdminOnly) {
              lowQty = 1;
              expectedQty = 2;
              highQty = 5;
            } else {
              lowQty = Math.max(1, Math.round(expectedUsers * 0.1));
              expectedQty = expectedUsers;
              highQty = highUsers;
            }
          }
        }
        else if (serviceNameLower.includes('dataverse')) {
          costCategory = 'Microsoft Licensing';
          sourceType = 'Microsoft Published License';
          unit = 'GB/Month';
          
          if (licensingModel === 'Business-based') {
            unitPrice = 30.0; // Volume discount
          } else if (licensingModel === 'Enterprise-based') {
            unitPrice = 20.0; // Enterprise capacity reservation
          } else {
            unitPrice = 40.0; // Standard database capacity
          }
          
          lowQty = Math.max(1, Math.round(dataVolumeGB * 0.5));
          expectedQty = dataVolumeGB;
          highQty = dataVolumeGB * 2;
        }
        else if (serviceNameLower.includes('sharepoint') || serviceNameLower.includes('share point')) {
          costCategory = 'Microsoft Licensing';
          sourceType = 'Microsoft Published License';
          unitPrice = m365LicenseTier !== 'None' ? 0.0 : 0.2; // SharePoint Storage capacity per GB (fully covered by M365 baseline)
          unit = 'GB/Month';
          if (m365LicenseTier !== 'None') {
            reasonSelected = `${service.reasonSelected} (Storage cost fully covered by M365 license)`;
          }
          
          lowQty = Math.max(1, Math.round(dataVolumeGB * 0.5));
          expectedQty = dataVolumeGB;
          highQty = dataVolumeGB * 2;
        }
        else if (serviceNameLower.includes('sap') || serviceNameLower.includes('erp')) {
          costCategory = 'External Licensing';
          sourceType = 'Requires customer contract';
          unitPrice = 0.0;
          unit = 'Cannot fetch'; // Forces UI warning to notify SAP licensing contract is required
          
          lowQty = 0;
          expectedQty = 0;
          highQty = 0;
        }
        else {
          // Sourced from Azure Retail Prices API
          const pricingInfo = await this.pricing.getAzurePrice(service.serviceName, service.sku, project.region);
          unitPrice = pricingInfo.price;
          unit = pricingInfo.unit;
          costCategory = 'Azure Infrastructure';
          sourceType = pricingInfo.unit === 'Cannot fetch' ? 'Estimate / N/A' : 'Azure API';

          // Calculate quantities dynamically based on service category and billing metric
          lowQty = service.estimatedUsageQuantity;
          expectedQty = service.estimatedUsageQuantity;
          highQty = service.estimatedUsageQuantity;

          // Consumption scaling
          if (skuLower.includes('consumption') || unit.toLowerCase().includes('call') || unit.toLowerCase().includes('execution')) {
            let scaleFactor = 1;
            if (unit.includes('10,000')) scaleFactor = 10000;
            if (unit.includes('100,000')) scaleFactor = 100000;
            if (unit.includes('million') || unit.includes('1,000,000')) scaleFactor = 1000000;

            lowQty = Math.max(1, Math.round(lowTxns / scaleFactor));
            expectedQty = Math.max(1, Math.round(expectedTxns / scaleFactor));
            highQty = Math.max(1, Math.round(highTxns / scaleFactor));
          }
          // Hourly scaling
          else if (unit.toLowerCase().includes('hour') || skuLower.includes('standard') || skuLower.includes('premium')) {
            const multiplier = unit.toLowerCase().includes('hour') ? 730 : 1;
            const baseInstances = service.estimatedUsageQuantity || 1;

            lowQty = baseInstances * multiplier;
            expectedQty = baseInstances * multiplier;
            highQty = baseInstances * multiplier;

            if (serviceNameLower.includes('sql') && highTxns > 2000000) {
              highQty = baseInstances * multiplier * 2;
            }
          }
          // Storage gigabytes
          else if (unit.toLowerCase().includes('gb') || serviceNameLower.includes('storage')) {
            lowQty = Math.max(10, Math.round(dataVolumeGB * 0.2));
            expectedQty = dataVolumeGB;
            highQty = dataVolumeGB * 4;
          }
        }

        // Calculate costs
        const costLow = Math.round(lowQty * unitPrice * 100) / 100;
        const costExpected = Math.round(expectedQty * unitPrice * 100) / 100;
        const costHigh = Math.round(highQty * unitPrice * 100) / 100;

        totalLow += costLow;
        totalExpected += costExpected;
        totalHigh += costHigh;

        components.push({
          serviceName: service.serviceName,
          sku: service.sku,
          category: service.category,
          unitPrice,
          unit,
          lowQty,
          expectedQty,
          highQty,
          lowCost: costLow,
          expectedCost: costExpected,
          highCost: costHigh,
          reasonSelected,
          costCategory,
          sourceType
        });
      }

      // Add baseline M365 license seat costs if selected
      if (m365LicenseTier !== 'None') {
        let m365Price = 0;
        if (m365LicenseTier === 'M365 Business Basic') m365Price = 2.0;
        else if (m365LicenseTier === 'M365 Business Standard') m365Price = 10.0;
        else if (m365LicenseTier === 'M365 Business Premium') m365Price = 22.0;
        else if (m365LicenseTier === 'M365 E3') m365Price = 36.0;
        else if (m365LicenseTier === 'M365 E5') m365Price = 57.0;

        const m365CostLow = lowUsers * m365Price;
        const m365CostExpected = m365UserCount * m365Price;
        const m365CostHigh = highUsers * m365Price;

        totalLow += m365CostLow;
        totalExpected += m365CostExpected;
        totalHigh += m365CostHigh;

        components.push({
          serviceName: m365LicenseTier,
          sku: 'Baseline User License',
          category: 'Licensing',
          unitPrice: m365Price,
          unit: 'User/Month',
          lowQty: lowUsers,
          expectedQty: m365UserCount,
          highQty: highUsers,
          lowCost: m365CostLow,
          expectedCost: m365CostExpected,
          highCost: m365CostHigh,
          reasonSelected: `Baseline enterprise productivity & collaboration seat licensing (${m365LicenseTier})`,
          costCategory: 'Microsoft Licensing',
          sourceType: 'Microsoft Published License'
        });
      }

      // Check budget warnings
      if (totalExpected > targetBudget) {
        warnings.push(`Expected monthly cost ($${Math.round(totalExpected)}) exceeds your target budget ($${targetBudget}).`);
      }
      if (totalExpected > maxBudget) {
        warnings.push(`Expected monthly cost ($${Math.round(totalExpected)}) exceeds your MAXIMUM allowed budget ($${maxBudget})! Consider switching tiers.`);
      }
      if (totalHigh > maxBudget * 1.5) {
        warnings.push(`Under high workload spike, cost escalates to $${Math.round(totalHigh)}. Review consumption throttle policies.`);
      }

      results[opt.id] = {
        lowCost: Math.round(totalLow * 100) / 100,
        expectedCost: Math.round(totalExpected * 100) / 100,
        highCost: Math.round(totalHigh * 100) / 100,
        components,
        warnings
      };
    }

    return results;
  }
}
