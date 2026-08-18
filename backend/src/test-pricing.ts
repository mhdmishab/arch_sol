import { PricingService } from './modules/pricing/pricing.service.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testPricing() {
  console.log('🧪 Starting Azure Retail Prices API integration test...');

  // Initialize DB connection so MongoDB cache works if active
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && mongoUri !== 'mock' && mongoUri !== 'YOUR_API_KEY_HERE') {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB pricing cache repository.');
    } catch (err) {
      console.warn('⚠️ Could not connect to MongoDB for test, falling back to local JSON cache.');
    }
  }

  const pricing = new PricingService();

  // Test cases: Service, SKU, Region
  const testCases = [
    { name: 'API Management', sku: 'Developer', region: 'East US' },
    { name: 'Azure SQL Database', sku: 'Standard S1', region: 'West US' },
    { name: 'Power Apps', sku: 'Per User', region: 'SaaS' } // SaaS Fallback
  ];

  for (const tc of testCases) {
    console.log(`\n🔍 Querying price for: ${tc.name} | SKU: ${tc.sku} | Region: ${tc.region}`);
    
    // First query (API fetch or Cache load)
    const start1 = Date.now();
    const res1 = await pricing.getAzurePrice(tc.name, tc.sku, tc.region);
    const duration1 = Date.now() - start1;
    console.log(`   [Attempt 1] Price: $${res1.price} per ${res1.unit} (Source: ${res1.source}, Duration: ${duration1}ms)`);

    // Second query (Must load from Cache instantly!)
    const start2 = Date.now();
    const res2 = await pricing.getAzurePrice(tc.name, tc.sku, tc.region);
    const duration2 = Date.now() - start2;
    console.log(`   [Attempt 2] Price: $${res2.price} per ${res2.unit} (Source: ${res2.source}, Duration: ${duration2}ms)`);
  }

  // Disconnect mongoose
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from DB.');
  }

  console.log('✅ Pricing test complete!');
}

testPricing().catch(console.error);
