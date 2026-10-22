import { GoogleGenAI } from '@google/genai';
import { Business, Product, SalesOrder, Expense } from '../types/index.ts';

// Server-side / Runtime Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';

export async function generateBusinessInsights(params: {
  business: Business;
  products: Product[];
  orders: SalesOrder[];
  expenses: Expense[];
  analysisType: 'executive' | 'inventory_reorder' | 'cashflow_forecast';
}): Promise<string> {
  if (!apiKey) {
    return 'Gemini API Key is not configured. Please ensure GEMINI_API_KEY is present in the environment.';
  }

  const ai = new GoogleGenAI({ apiKey });

  const totalSalesRevenue = params.orders
    .filter(o => o.status === 'completed')
    .reduce((acc, curr) => acc + curr.total, 0);

  const totalExpenses = params.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netOperatingProfit = totalSalesRevenue - totalExpenses;

  const lowStockItems = params.products.filter(p => p.stockQuantity <= p.reorderLevel);

  const businessContext = `
Business: ${params.business.name} (${params.business.category})
Currency: ${params.business.baseCurrency} (${params.business.currencySymbol})
Total Completed Sales Orders: ${params.orders.length}
Total Sales Volume: ${params.business.currencySymbol}${totalSalesRevenue.toFixed(2)}
Total Recorded Expenses: ${params.business.currencySymbol}${totalExpenses.toFixed(2)}
Estimated Net Profit: ${params.business.currencySymbol}${netOperatingProfit.toFixed(2)}
Total Products in Catalogue: ${params.products.length}
Low Stock Alert Count: ${lowStockItems.length}
Sample Low Stock Items: ${lowStockItems.slice(0, 5).map(p => `${p.name} (Qty: ${p.stockQuantity}, Reorder Level: ${p.reorderLevel})`).join(', ') || 'None'}
`;

  let prompt = '';
  if (params.analysisType === 'executive') {
    prompt = `You are the UBM Senior Enterprise Business Consultant.
Provide an executive, concise, high-impact business performance audit based on the operational data below:
${businessContext}

Provide:
1. Executive Snapshot (3 bullet points)
2. Revenue vs Expense Health & Margin Diagnosis
3. Critical Risk / Inventory Bottlenecks
4. 3 Actionable Strategic Steps for Immediate Revenue Growth.

Formatting: Clear markdown with bold titles, no conversational filler.`;
  } else if (params.analysisType === 'inventory_reorder') {
    prompt = `You are the UBM Supply Chain & Inventory Optimizer.
Analyze the inventory levels and recent sales context below:
${businessContext}

Provide:
1. Urgent Reorder Priorities
2. Recommended Reorder Quantities with economic order reasoning
3. Working capital allocation advice to prevent dead stock.`;
  } else {
    prompt = `You are the UBM Corporate Controller.
Analyze the following cashflow and expense metrics:
${businessContext}

Provide:
1. 30-Day Cashflow Runway Forecast
2. Top Expense Categories to audit or renegotiate
3. Working Capital & Receivables Recommendation.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 1000
      }
    });

    return response.text || 'No response returned from Gemini analysis.';
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return `AI Analysis could not be generated: ${error?.message || 'Network or token error'}`;
  }
}
