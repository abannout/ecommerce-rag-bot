import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import embedQuery from '@/lib/chat/embed';
import supabase from '@/db/supabase';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

interface ProductRow {
  url: string;
  name: string;
  size: string;
  category: string;
  price: string;
  color: string;
  description: string;
  groupe: string;
  gender: string;
  brand: string;
}

function formatContentForRAG(row: ProductRow): string {
  return `
Name: ${row.name}
Brand: ${row.brand}
Gender: ${row.gender}
Category Group: ${row.groupe}
Category: ${row.category}
URL: ${row.url}
Price: €${row.price}
Color: ${row.color}
Sizes: ${row.size}
Description: ${row.description}
  `.trim();
}

async function processBatch(rows: ProductRow[], batchSize: number = 10) {
  const batches = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  console.log(`📦 Processing ${rows.length} products in ${batches.length} batches`);

  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 Processing batch ${i + 1}/${batches.length}`);

    const promises = batch.map(async (row) => {
      try {
        const content = formatContentForRAG(row);
        const embedding = await embedQuery(content);
        const { error } = await supabase.from('product_chunks_cleaned').insert({
          content,
          embedding,
        });

        if (error) {
          console.error(`❌ Failed to insert "${row.name}":`, error.message);
          return { success: false, error: error.message, row };
        } else {
          console.log(`✅ Inserted: ${row.name}`);
        }
        
        return { success: true, row };
      } catch (err: any) {
        console.error(`⚠️ Error processing "${row.name}":`, err.message);
        return { success: false, error: err.message, row };
      }
    });

    const results = await Promise.all(promises);

    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    totalSuccess += successful;
    totalFailed += failed;

    console.log(`📊 Batch ${i + 1}: ${successful} success, ${failed} failed`);
  }

  console.log(`🎯 Final Results: ${totalSuccess} successful, ${totalFailed} failed`);
}

async function main() {
  try {
    console.log('📖 Reading CSV with csv-parser...');

    const results: ProductRow[] = [];
    let totalRows = 0;

    const stream = createReadStream('./dataset/products_asos_cleaned.csv')
      .pipe(csv({ separator: ',' }))
      .on('data', (row: ProductRow) => {
        totalRows++;
        if (row.name && row.url && row.price && row.description) {
          results.push(row);
        }

        if (totalRows % 1000 === 0) {
          console.log(`📊 Processed ${totalRows} rows, ${results.length} valid products found`);
        }
      })
      .on('end', async () => {
        console.log(`✅ CSV parsing complete!`);
        console.log(`📊 Total rows processed: ${totalRows}`);
        console.log(`📊 Valid products found: ${results.length}`);

        if (results.length === 0) {
          console.log('❌ No valid products found. Check your CSV structure.');
          return;
        }

        console.log('\n📋 Sample product data:');
        console.log('Name:', results[0].name);
        console.log('Brand:', results[0].brand);
        console.log('Category Group:', results[0].groupe);
        console.log('Description preview:', results[0].description.substring(0, 100) + '...');

        console.log('\n🚀 Starting batch processing...');
        await processBatch(results);

        console.log('🎉 All done! RAG database populated successfully.');
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        process.exit(1);
      });

    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
