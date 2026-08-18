import mongoose, { Schema } from 'mongoose';
import { isUsingMongoDB } from '../../config/db.js';
import fs from 'fs';
import path from 'path';

// Define Mongoose Schema for Cache
const PricingCacheSchema = new Schema({
  serviceKey: { type: String, required: true, unique: true }, // e.g., "apimanagement-centralindia-consumption"
  price: { type: Number, required: true },
  unit: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

let PricingCacheModel: any;
if (isUsingMongoDB) {
  try {
    PricingCacheModel = mongoose.model('PricingCache', PricingCacheSchema);
  } catch {
    PricingCacheModel = mongoose.model('PricingCache');
  }
}

// Local cache file fallback config
const LOCAL_CACHE_FILE = path.join(process.cwd(), 'data', 'pricing_cache.json');

function readLocalCache(): Record<string, { price: number; unit: string; updatedAt: string }> {
  try {
    if (!fs.existsSync(LOCAL_CACHE_FILE)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(LOCAL_CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeLocalCache(cache: Record<string, any>): void {
  try {
    const dir = path.dirname(LOCAL_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed writing local pricing cache:', error);
  }
}

const AZURE_PRICE_BASELINES: Record<string, { price: number; unit: string }> = {
  'api-management-consumption': { price: 0.000072, unit: '10,000 calls' },
  'api-management-developer': { price: 48.04, unit: 'Month' },
  'api-management-developerplan': { price: 48.04, unit: 'Month' },
  'api-management-standard': { price: 686.0, unit: 'Month' },
  'azure-functions-consumption': { price: 0.000016, unit: '100,000 GB-s/Executions' },
  'azure-service-bus-standard': { price: 10.0, unit: 'Month' },
  'azure-service-bus-premium': { price: 668.0, unit: 'Month' },
  'app-service-premiumv3-p1v3': { price: 120.0, unit: 'Month' },
  'app-service-standard-s1': { price: 73.0, unit: 'Month' },
  'app-service-standards1': { price: 73.0, unit: 'Month' },
  'azure-sql-database-standard-s1': { price: 30.0, unit: 'Month' },
  'azure-sql-database-standards1': { price: 30.0, unit: 'Month' },
  'azure-sql-database-basic': { price: 4.9, unit: 'Month' },
  'storage-accounts-standard-lrs': { price: 0.02, unit: 'GB/Month' },
  'application-insights-loganalytics': { price: 2.3, unit: 'GB Ingested' },
  'power-apps-peruser': { price: 20.0, unit: 'User/Month' },
  'power-apps-peruserplan': { price: 20.0, unit: 'User/Month' },
  'power-automate-peruser': { price: 15.0, unit: 'User/Month' },
  'power-automate-peruserplan': { price: 15.0, unit: 'User/Month' },
  'sharepoint-online-standard': { price: 0.2, unit: 'GB/Month' },
  'sharepoint-online-standardlist': { price: 0.2, unit: 'GB/Month' }
};

// Normalized region name converter for Azure API: e.g. "Central India" -> "centralindia"
export function normalizeRegionName(region: string): string {
  return region.toLowerCase().replace(/\s+/g, '');
}

// Map project service names to Azure serviceName filter parameter
function mapToAzureServiceName(serviceName: string): string {
  const name = serviceName.toLowerCase();
  if (name.includes('api management') || name.includes('apim')) return 'API Management';
  if (name.includes('function')) return 'Functions';
  if (name.includes('service bus')) return 'Service Bus';
  if (name.includes('sql database') || name.includes('azure sql')) return 'SQL Database';
  if (name.includes('storage') || name.includes('blob')) return 'Storage';
  if (name.includes('app service')) return 'Virtual Machines'; // App Service Plans query VMs under the hood
  if (name.includes('monitor') || name.includes('application insights')) return 'Azure Monitor';
  return '';
}

export class PricingService {
  async getAzurePrice(serviceName: string, sku: string, region: string): Promise<{ price: number; unit: string; source: 'API' | 'Cache' | 'Fallback' }> {
    const cleanServiceName = mapToAzureServiceName(serviceName);
    const cleanSku = sku.replace(/\s+/g, '').toLowerCase();
    const cleanRegion = normalizeRegionName(region);
    
    const serviceKey = `${cleanServiceName.replace(/\s+/g, '').toLowerCase()}-${cleanRegion}-${cleanSku}`;
    const fallbackKey = `${serviceName.toLowerCase().replace(/\s+/g, '-')}-${cleanSku}`;

    // 1. Check cache first
    const cached = await this.getCachedPrice(serviceKey);
    if (cached) {
      return { price: cached.price, unit: cached.unit, source: 'Cache' };
    }

    // If it is a SaaS/Power Platform service, return baseline directly (not available in Retail prices API)
    if (serviceName.toLowerCase().includes('power') || serviceName.toLowerCase().includes('sharepoint')) {
      const saasPrice = AZURE_PRICE_BASELINES[fallbackKey] || { price: 0, unit: 'SaaS Included' };
      return { price: saasPrice.price, unit: saasPrice.unit, source: 'Fallback' };
    }

    if (!cleanServiceName) {
      const baseline = AZURE_PRICE_BASELINES[fallbackKey] || { price: 0.0, unit: 'Unit' };
      return { price: baseline.price, unit: baseline.unit, source: 'Fallback' };
    }

    // 2. Fetch from Azure Retail Prices API
    try {
      const filter = `serviceName eq '${cleanServiceName}' and armRegionName eq '${cleanRegion}' and priceType eq 'Consumption'`;
      const url = `https://prices.azure.com/api/retail/prices?$filter=${encodeURIComponent(filter)}`;
      
      console.log(`🌐 Fetching Azure pricing from Retail API: ${cleanServiceName} (${cleanSku}) in ${cleanRegion}`);
      console.log(`🔗 Query URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.Items || [];
      console.log(`✅ Azure Retail response: Received ${items.length} pricing items.`);

      // Filter out zero-price items (e.g. Developer Workspace Pack which is $0)
      const validItems = items.filter((item: any) => item.retailPrice > 0);

      // Find the item matching the SKU
      // Note: Pricing API uses slightly different names for SKUs, we do a substring match
      const matched = validItems.find((item: any) => {
        const skuName = (item.armSkuName || item.skuName || '').toLowerCase();
        const meter = (item.meterName || '').toLowerCase();
        return skuName.includes(cleanSku) || meter.includes(cleanSku);
      }) || validItems[0] || items[0]; // fallback chain

      if (matched && matched.retailPrice > 0) {
        const price = matched.retailPrice;
        const unit = matched.unitOfMeasure || 'Unit';
        console.log(`💰 Matched SKU: ${cleanSku} ➔ ${matched.skuName || 'generic'}. Price: $${price} per ${unit}`);
        
        // Cache price
        await this.setCachedPrice(serviceKey, price, unit);
        return { price, unit, source: 'API' };
      }

      throw new Error(`No non-zero price found for SKU: ${sku}`);
    } catch (error) {
      console.warn(`⚠️ Retail prices API fetch failed for ${serviceName} (${sku}):`, (error as Error).message);
      return { price: 0, unit: 'Cannot fetch', source: 'Fallback' };
    }
  }

  private async getCachedPrice(serviceKey: string): Promise<{ price: number; unit: string } | null> {
    if (isUsingMongoDB && PricingCacheModel) {
      try {
        const doc = await PricingCacheModel.findOne({ serviceKey });
        if (doc && doc.price > 0) {
          // Check if expired (24h)
          const age = Date.now() - new Date(doc.updatedAt).getTime();
          if (age < 86400000) {
            return { price: doc.price, unit: doc.unit };
          }
        }
      } catch (err) {
        console.error('Error querying MongoDB pricing cache:', err);
      }
    } else {
      const cache = readLocalCache();
      const item = cache[serviceKey];
      if (item && item.price > 0) {
        const age = Date.now() - new Date(item.updatedAt).getTime();
        if (age < 86400000) {
          return { price: item.price, unit: item.unit };
        }
      }
    }
    return null;
  }

  private async setCachedPrice(serviceKey: string, price: number, unit: string): Promise<void> {
    if (isUsingMongoDB && PricingCacheModel) {
      try {
        await PricingCacheModel.findOneAndUpdate(
          { serviceKey },
          { price, unit, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Failed setting pricing cache in MongoDB:', err);
      }
    } else {
      const cache = readLocalCache();
      cache[serviceKey] = {
        price,
        unit,
        updatedAt: new Date().toISOString()
      };
      writeLocalCache(cache);
    }
  }
}
