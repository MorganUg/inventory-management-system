# How to Use the AI Features
## Sweet Inventory Management System

**Version:** 1.0  
**Last Updated:** April 2026

---

## What Does the AI Do?

The AI in this system uses **local statistical models** (no external services or internet required) to analyze your historical dispatch data and provide:

- **Demand Forecasting** — Predicts how much of each product you are likely to sell in the next 4 weeks.
- **Trend Detection** — Tells you if demand for a product is rising, falling, or stable.
- **Risk Alerts** — Identifies products that may run out of stock soon.
- **Smart Recommendations** — Suggests when and how much you should produce.
- **Confidence Scores** — Shows how reliable the prediction is based on available data.

All analysis happens locally on your server.

---

## Where to Find the AI

### 1. Dashboard (Home Page)
- After logging in, look for the section called **"AI Highlights"**.
- It gives a quick summary and a direct link to the full AI tools.

### 2. Reports → AI Insights Tab (Main Feature)
This is where you get the full power of the AI.

1. Go to the **Reports** page (only Admin and Manager roles can access this).
2. Click on the **"AI Insights"** tab at the top.

---

## How to Use the AI Insights Tab

### Option A: Analyze a Single Product

1. In the AI Insights tab, make sure **"Single Product"** is selected.
2. Use the dropdown to choose any finished good.
3. The system will automatically run the AI and show you:

   - **Summary Cards**: Current stock, 4-week forecast, trend, confidence %, data quality %
   - **Forecast Chart**: Visual line chart showing expected demand over the next 4 weeks
   - **AI Insights**: Specific alerts (e.g., "Stockout risk in ~2 weeks")
   - **Recommendations**: Suggested production quantities with urgency level and recommended action date

### Option B: Analyze All Products at Once (Recommended)

This is the most powerful feature for managers.

1. In the AI Insights tab, click **"All Products Overview"**.
2. Click the big button **"Analyze All Products"**.
3. Wait a few seconds while the AI processes every product.
4. You will see a table with all your products sorted by **risk level** (highest risk first).

The table shows:
- Product name
- Current Stock
- 4-Week AI Forecast
- Trend (rising / stable / falling)
- Confidence Score
- **Risk Level** (High / Medium / Low)
- Quick "View Details" button

Click **"View Details"** on any row to jump into the detailed single-product view for that item.

---

## Understanding the Results

### Key Numbers Explained

| Metric              | What It Means                                      | Good vs Bad                  |
|---------------------|----------------------------------------------------|------------------------------|
| **Confidence Score**    | How reliable the forecast is                     | 70%+ = Good, Below 45% = Weak |
| **Data Quality**        | How much reliable history the AI had to work with | Higher is better             |
| **Stockout Risk Weeks** | Estimated weeks until you run out at current pace | Lower number = Higher urgency |
| **Risk Level**          | Combined view of stock vs forecast                 | High = Act soon              |

### Trend Colors
- **Green** = Rising demand (good for production planning)
- **Red** = Falling demand
- **Gray** = Stable / no clear trend

### Recommendations
The system will suggest:
- Urgency level (High / Medium / Low)
- Recommended action date
- Suggested production quantity

These are calculated by comparing current stock against the AI forecast.

---

## Tips for Best Results

1. **More data = Better forecasts**
   - The AI works best when a product has at least 6–8 weeks of dispatch history.
   - Products with very little data will show low confidence scores.

2. **Use "Analyze All Products" regularly**
   - Run it weekly or before big production planning meetings.

3. **Pay special attention to "High" risk items**
   - These are the products most likely to stock out soon based on current trends.

4. **Cross-check with your knowledge**
   - The AI is a powerful assistant, not a replacement for human judgment (especially around holidays, promotions, or new products).

---

## Current Limitations

- The AI only looks at **historical dispatch data**. It does not know about:
  - Upcoming promotions or marketing campaigns
  - Seasonal events (unless they appear in past data)
  - New products with no history
- Analysis can take a few seconds when using "Analyze All Products" if you have many items.
- Currently only available to **Admin** and **Manager** users.

---

## Quick Start Checklist

- [ ] Log in as Admin or Manager
- [ ] Go to **Reports → AI Insights**
- [ ] Try analyzing **one product** first
- [ ] Then click **"Analyze All Products"** to see the full overview
- [ ] Check the **Dashboard** regularly for the AI Highlights box

---

**Need help?**  
Contact your system administrator or refer to the technical documentation in the project.

---

*This guide was generated for the Sweet Inventory Management System AI integration.*