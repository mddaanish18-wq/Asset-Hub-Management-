const express = require('express');
const router = express.Router();
const db = require('../db');

// Mock technician data
const TECHNICIANS = [
    { id: 1, name: "John Smith", specialty: "Brake Systems", available: true },
    { id: 2, name: "Sarah Johnson", specialty: "General Maintenance", available: true },
    { id: 3, name: "Mike Chen", specialty: "Engine Diagnostics", available: true },
    { id: 4, name: "Emily Davis", specialty: "Electrical Systems", available: true }
];

// --- Helper Functions ---

function getAssetsByRisk(riskCategory) {
    try {
        let stmt;
        let params = [];

        if (riskCategory === 'Critical') {
            stmt = db.prepare('SELECT * FROM assets WHERE risk_level = ? ORDER BY health_score ASC');
            params = ['Critical'];
        } else if (riskCategory === 'High') {
            stmt = db.prepare('SELECT * FROM assets WHERE risk_level = ? ORDER BY health_score ASC');
            params = ['High'];
        } else if (riskCategory === 'Watchlist') {
            stmt = db.prepare('SELECT * FROM assets WHERE risk_level IN (?, ?) ORDER BY health_score ASC');
            params = ['Medium', 'Low'];
        } else {
            return [];
        }

        return stmt.all(...params);
    } catch (error) {
        console.error(`Error fetching ${riskCategory} assets:`, error);
        return [];
    }
}

function calculateTimeline(scheduledDate) {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const hoursDiff = (scheduled - now) / (1000 * 60 * 60);

    if (hoursDiff <= 0 || hoursDiff <= 24) return 'today';
    if (hoursDiff <= 48) return '48hrs';
    return 'next_week';
}

function scheduleMaintenanceAction(assetId, date, technicianName, priority = 'high') {
    try {
        const timeline = calculateTimeline(date);
        const stmt = db.prepare(`
            INSERT INTO actions (asset_id, action_type, description, scheduled_date, priority, created_by, status, timeline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            assetId,
            'Maintenance',
            `Scheduled maintenance for ${assetId}`,
            date,
            priority.toLowerCase(),
            technicianName,
            'pending',
            timeline
        );
        return { success: true, actionId: result.lastInsertRowid };
    } catch (error) {
        console.error('Error scheduling maintenance:', error);
        return { success: false, error: error.message };
    }
}

// --- GenAI Simulation Functions ---

// Generate detailed explanation for a single asset
function generateAssetExplanation(asset) {
    const trends = JSON.parse(asset.sensor_trends || '{}');
    const parts = asset.predicted_failure.split(':');
    const failureType = parts[0] || 'General Failure';

    // Simulate natural language generation based on data
    let explanation = `Vehicle **${asset.id}** shows `;

    if (parseFloat(trends.vibration) > 5.0) {
        explanation += `abnormal vibration patterns (${trends.vibration}G) `;
    } else {
        explanation += `consistent performance variances `;
    }

    if (asset.technician_notes) {
        explanation += `and technician reported: "${asset.technician_notes}". `;
    } else {
        explanation += `along with sensor anomalies. `;
    }

    explanation += `Recommended action: **${failureType} inspection** within `;

    let timeWindow = '7d';
    if (asset.risk_level === 'Critical') timeWindow = '24h';
    else if (asset.risk_level === 'High') timeWindow = '48h';

    explanation += `${timeWindow}.`;

    return {
        explanation: explanation,
        recommended_action: `${failureType} Inspection`,
        recommended_time_window: timeWindow,
        confidence: asset.confidence || 'Medium'
    };
}

// Generate RCA
function generateRCA(asset) {
    const failureType = asset.predicted_failure.split(':')[0] || 'Unknown';
    const region = asset.region;

    return {
        root_cause_summary: `Likely root cause: **${failureType}** accelerated by ${region} region terrain conditions. Similar pattern seen in 3 other units this month.`,
        corrective_steps: [
            `Inspect ${failureType} assembly for wear.`,
            `Check sensor calibration for false positives.`,
            `Review driver logs for route anomalies.`
        ]
    };
}

// Generate Executive Summary
function generateExecutiveSummary() {
    // In a real app, this would aggregate real stats
    const critical = db.prepare("SELECT COUNT(*) as count FROM assets WHERE risk_level = 'Critical'").get().count;
    const high = db.prepare("SELECT COUNT(*) as count FROM assets WHERE risk_level = 'High'").get().count;
    const actions = db.prepare("SELECT COUNT(*) as count FROM actions WHERE status = 'pending'").get().count;

    return `This week, predictive maintenance identified **${critical + high} high-risk vehicles**. **${actions} maintenance tickets** are currently pending. Estimated downtime reduction is **15%** compared to last month.`;
}

// Chatbot Logic
function generateChatResponse(question, asset) {
    const q = question.toLowerCase();
    const trends = JSON.parse(asset.sensor_trends || '{}');

    let answer = `Based on current data for ${asset.id}:\n\n`;

    if (q.includes('overheat') || q.includes('temp')) {
        answer += `• Temperature sensors read **${trends.temp}°F**, which is ${trends.temp > 190 ? 'critical' : 'within normal range'}.\n`;
        answer += `• Check coolant levels and radiator intake for debris.`;
    } else if (q.includes('vibration') || q.includes('shake')) {
        answer += `• Vibration is at **${trends.vibration}G**.\n`;
        answer += `• Inspect suspension struts and wheel balance immediately.`;
    } else {
        answer += `• Detected issue: **${asset.predicted_failure}**.\n`;
        answer += `• Recommended: Full diagnostic scan and visual inspection of undercarriage.`;
    }

    return answer;
}

// --- Endpoints ---

// --- GenAI Integration ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyCIZHAWect8JZ33HYmt0qzYggg8d2StqrQ';
console.log('🔑 Gemini API Key configured:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to call Gemini with fallback
async function callGemini(systemPrompt, userPrompt, fallbackFn) {
    console.log('\n🤖 Calling Gemini API...');
    console.log('📝 System Prompt:', systemPrompt.substring(0, 100) + '...');
    console.log('💬 User Prompt:', userPrompt.substring(0, 150) + '...');

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        console.log('🚀 Sending request to Gemini...');

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ Gemini Response received:', text.substring(0, 200) + '...');
        return text;
    } catch (error) {
        console.error("🚨 Gemini API Error:", error.message);
        console.error("📋 Full error:", error);
        console.log('⚠️ Using fallback response');
        return fallbackFn();
    }
}



// Generate Asset Context String
function getAssetContext(asset) {
    const trends = JSON.parse(asset.sensor_trends || '{}');
    return `
    Asset ID: ${asset.id}
    Type: ${asset.type}
    Region: ${asset.region}
    Health Score: ${asset.health_score}
    Risk Level: ${asset.risk_level}
    Predicted Failure: ${asset.predicted_failure}
    Technician Notes: "${asset.technician_notes || 'None'}"
    Sensor Data: Vibration ${trends.vibration}G, Temp ${trends.temp}F, Fuel Efficiency ${trends.fuel} mpg.
    `;
}

// --- Endpoints ---

// 1. Generate Maintenance Plan (Batch)
router.post('/plan', async (req, res) => {
    try {
        const { asset_ids } = req.body;
        let assets = [];
        if (asset_ids && asset_ids.length > 0) {
            const placeholders = asset_ids.map(() => '?').join(',');
            assets = db.prepare(`SELECT * FROM assets WHERE id IN (${placeholders})`).all(asset_ids);
        } else {
            assets = db.prepare("SELECT * FROM assets WHERE risk_level IN ('Critical', 'High')").all();
        }

        // We will process assets in parallel for speed, or just the top 5 to save tokens if list is huge
        const topAssets = assets.slice(0, 5); // Limit for prototype speed

        const plannedAssets = await Promise.all(topAssets.map(async (asset) => {
            const systemPrompt = `You are a senior fleet maintenance manager. 
            Available Technicians:
            - John Smith (Brake Systems)
            - Sarah Johnson (General Maintenance)
            - Mike Chen (Engine Diagnostics)
            - Emily Davis (Electrical Systems)
            
            Assign the best technician for the job based on the vehicle issue.`;

            const userPrompt = `Analyze this vehicle and recommend a specific maintenance action and timeline.
            Context: ${getAssetContext(asset)}
            Return ONLY a valid JSON object with these keys: explanation, recommended_action, recommended_time_window, assigned_technician.
            Example: {"explanation": "High vibration indicates strut wear...", "recommended_action": "Strut Replacement", "recommended_time_window": "48h", "assigned_technician": "John Smith"}`;

            // Fallback
            const fallback = () => {
                const expl = generateAssetExplanation(asset);
                // Simple keyword matching for fallback assignment
                let tech = "Sarah Johnson";
                if (expl.recommended_action.toLowerCase().includes('engine') || expl.explanation.toLowerCase().includes('engine')) tech = "Mike Chen";
                if (expl.recommended_action.toLowerCase().includes('brake')) tech = "John Smith";
                if (expl.recommended_action.toLowerCase().includes('electric') || expl.explanation.toLowerCase().includes('sensor')) tech = "Emily Davis";

                return {
                    ...expl,
                    assigned_technician: tech
                };
            };

            try {
                const content = await callGemini(systemPrompt, userPrompt, () => JSON.stringify(fallback()));
                // Clean markdown if present
                const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiData = JSON.parse(jsonStr);

                // Ensure assigned_technician is present
                if (!aiData.assigned_technician) {
                    aiData.assigned_technician = fallback().assigned_technician;
                }

                return { ...asset, ...aiData };
            } catch (e) {
                return { ...asset, ...fallback() };
            }
        }));

        // Generate Plan Summary
        const summaryPrompt = `Summarize the maintenance plan for these ${plannedAssets.length} vehicles. 
        High level risks: ${plannedAssets.filter(a => a.risk_level === 'Critical').length} Critical.
        Regions involved: ${[...new Set(plannedAssets.map(a => a.region))].join(', ')}.
        Write a 2-sentence executive summary for the dashboard.`;

        const planSummary = await callGemini(
            "You are a fleet executive assistant.",
            summaryPrompt,
            () => `Today's maintenance focus is **${plannedAssets.length} vehicles** primarily in the **${plannedAssets[0]?.region || 'various'}** region.`
        );

        res.json({
            success: true,
            plan_summary: planSummary,
            plan_confidence: 'High',
            assets: plannedAssets
        });

    } catch (error) {
        console.error('Error generating plan:', error);
        res.status(500).json({ success: false, error: 'Failed to generate plan' });
    }
});

// 2. Root Cause Analysis
router.post('/rca', async (req, res) => {
    try {
        const { asset_id } = req.body;
        const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });

        const systemPrompt = "You are an expert heavy machinery diagnostic AI. Provide a detailed Root Cause Analysis.";
        const userPrompt = `Analyze the probable root cause for the predicted failure: ${asset.predicted_failure}.
        Vehicle Context: ${getAssetContext(asset)}
        
        Output valid JSON with:
        - root_cause_summary (1 short sentence)
        - corrective_steps (array of 3 specific technical steps)
        `;

        const fallback = () => generateRCA(asset);

        if (!process.env.GOOGLE_API_KEY) {
            return res.json({ success: true, ...fallback() });
        }

        const content = await callGemini(systemPrompt, userPrompt, () => JSON.stringify(fallback()));

        try {
            // Try parsing JSON
            const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            res.json({ success: true, ...data });
        } catch (e) {
            // If JSON parse fails, return the text as summary and use simulation for steps, or just failback
            console.warn("JSON Parse failed for RCA, using fallback");
            res.json({ success: true, ...fallback() });
        }

    } catch (error) {
        console.error('Error in RCA:', error);
        res.status(500).json({ success: false, error: 'RCA generation failed' });
    }
});

// 3. Technician Chat
router.post('/chat', async (req, res) => {
    try {
        const { asset_id, question } = req.body;
        const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(asset_id);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });

        const systemPrompt = "You are a helpful AI assistant for fleet technicians. Answer questions based strictly on the provided vehicle data.";
        const userPrompt = `
        Vehicle Data: ${getAssetContext(asset)}
        
        Technician Question: "${question}"
        
        Answer professionally and concisely. Mention specific sensor readings if relevant.`;

        const answer = await callGemini(systemPrompt, userPrompt, () => generateChatResponse(question, asset));
        res.json({ success: true, answer });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ success: false, error: 'Chat failed' });
    }
});

// 4. Executive Summary with Comprehensive Dashboard Data
router.get('/summary', async (req, res) => {
    try {
        // Get all assets
        const assets = db.prepare('SELECT * FROM assets').all();
        const actions = db.prepare('SELECT * FROM actions WHERE status = ?').all('pending');

        // Calculate comprehensive metrics
        const critical = assets.filter(a => a.risk_level === 'Critical');
        const high = assets.filter(a => a.risk_level === 'High');
        const medium = assets.filter(a => a.risk_level === 'Medium');
        const low = assets.filter(a => a.risk_level === 'Low');

        // Fleet Health Score (0-100)
        const healthScore = Math.round(
            assets.reduce((sum, a) => sum + a.health_score, 0) / assets.length
        );

        // Regional breakdown
        const regions = {};
        assets.forEach(asset => {
            if (!regions[asset.region]) {
                regions[asset.region] = { total: 0, critical: 0, high: 0, avgHealth: 0 };
            }
            regions[asset.region].total++;
            if (asset.risk_level === 'Critical') regions[asset.region].critical++;
            if (asset.risk_level === 'High') regions[asset.region].high++;
            regions[asset.region].avgHealth += asset.health_score;
        });

        Object.keys(regions).forEach(region => {
            regions[region].avgHealth = Math.round(regions[region].avgHealth / regions[region].total);
        });

        // Calculate trends (mock week-over-week for now)
        const trends = {
            healthScore: healthScore > 75 ? '+2.3%' : '-1.5%',
            criticalCount: critical.length > 5 ? '+1' : '-2',
            maintenanceCost: '-8.5%',
            uptime: '+0.4%'
        };

        // Top 3 action items
        const actionItems = [
            `${critical.length} critical vehicles require immediate attention`,
            `Schedule maintenance for ${high.length} high-risk assets within 7 days`,
            `${actions.length} pending maintenance actions need approval`
        ];

        // Cost summary (mock data)
        const costSummary = {
            thisWeek: 12450,
            lastWeek: 13600,
            savings: 1150,
            projected: 48000 // monthly
        };

        // KPIs
        const kpis = {
            uptime: '99.2%',
            activeVehicles: `${assets.length - critical.length}/${assets.length}`,
            avgHealthScore: healthScore,
            maintenanceCost: `$${costSummary.thisWeek.toLocaleString()}`,
            criticalAssets: critical.length,
            pendingActions: actions.length
        };

        // Generate AI summary text
        const summaryText = `Fleet Health Overview: Your fleet is currently operating at ${healthScore}% health with ${critical.length} critical and ${high.length} high-risk vehicles requiring attention. ${critical.length > 0 ? `Immediate action needed for assets: ${critical.slice(0, 3).map(a => a.id).join(', ')}.` : 'No critical issues detected.'} Maintenance costs are trending ${trends.maintenanceCost} compared to last week, with overall fleet uptime at ${kpis.uptime}.`;

        res.json({
            success: true,
            executive_summary: summaryText,
            dashboard: {
                healthScore,
                trends,
                actionItems,
                costSummary,
                kpis,
                regions,
                breakdown: {
                    critical: critical.length,
                    high: high.length,
                    medium: medium.length,
                    low: low.length,
                    total: assets.length
                },
                topCritical: critical.slice(0, 5).map(a => ({
                    id: a.id,
                    type: a.type,
                    region: a.region,
                    issue: a.predicted_failure,
                    healthScore: a.health_score
                }))
            }
        });
    } catch (error) {
        console.error('Error in summary:', error);
        res.status(500).json({ success: false, error: 'Summary failed' });
    }
});

// Legacy Chatbot Endpoint (Preserving for backward compatibility if needed, or redirecting)
// Supporting the specific "Show high risk" flow requested previously in the same router logic
// ideally we merge them, but for now let's keep a handler for the chat interface if it calls this specific path
// 5. Fleet Chat (Conversational AI for Asset Management)
router.post('/fleet-chat', async (req, res) => {
    try {
        const { prompt, asset_context, conversationHistory } = req.body;

        console.log('\n📨 Fleet Chat Request:', prompt);

        // Build comprehensive context about the fleet
        let contextStr = `You are managing a fleet of ${asset_context?.length || 50} vehicles.`;

        if (asset_context && asset_context.length > 0) {
            const criticalCount = asset_context.filter(a => a.risk_level === 'Critical').length;
            const highCount = asset_context.filter(a => a.risk_level === 'High').length;
            const mediumLowCount = asset_context.length - criticalCount - highCount;

            contextStr += `\n\nFleet Status:`;
            contextStr += `\n- Critical Risk: ${criticalCount} vehicles`;
            contextStr += `\n- High Risk: ${highCount} vehicles`;
            contextStr += `\n- Watchlist: ${mediumLowCount} vehicles`;

            // Add details about top risk assets
            const topRisks = asset_context
                .filter(a => a.risk_level === 'Critical' || a.risk_level === 'High')
                .slice(0, 5);

            if (topRisks.length > 0) {
                contextStr += `\n\nTop Priority Assets:`;
                topRisks.forEach(asset => {
                    contextStr += `\n- ${asset.id} (${asset.type}, ${asset.region}): ${asset.predicted_failure} - Health Score: ${asset.health_score}`;
                });
            }
        }

        // Build conversation history for context
        let conversationContext = '';
        if (conversationHistory && conversationHistory.length > 0) {
            conversationContext = '\n\nPrevious Conversation:\n';
            conversationHistory.slice(-5).forEach(msg => {
                conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}\n`;
            });
        }

        const systemPrompt = `You are an intelligent Fleet Maintenance Copilot AI assistant. Your primary responsibilities are:
1. Help managers understand asset health and risks
2. Recommend maintenance actions based on data
3. Answer questions about specific vehicles
4. Provide insights on fleet performance
5. Assist with scheduling and prioritization

Be conversational, helpful, and data-driven. Reference specific asset IDs, health scores, and risk levels when relevant.
Keep responses concise but informative (2-4 sentences typically).`;

        const userPrompt = `${contextStr}${conversationContext}\n\nUser Query: "${prompt}"\n\nProvide a helpful, conversational response. If the user asks about specific actions or recommendations, be specific about which assets need attention.`;

        // Intelligent fallback function that analyzes the query
        const intelligentFallback = () => {
            const lowerPrompt = prompt.toLowerCase();

            // Analyze query intent
            if (lowerPrompt.includes('critical') || lowerPrompt.includes('urgent') || lowerPrompt.includes('immediate')) {
                const critical = asset_context?.filter(a => a.risk_level === 'Critical') || [];
                if (critical.length > 0) {
                    return `I've identified **${critical.length} critical vehicles** requiring immediate attention:\n\n${critical.slice(0, 5).map(a => `• **${a.id}** (${a.type}): ${a.predicted_failure} - Health Score: ${a.health_score}/100`).join('\n')}\n\nI recommend scheduling maintenance for these assets within the next 24-48 hours to prevent failures.`;
                } else {
                    return `Good news! I don't see any critical vehicles at the moment. However, we should check the high-risk assets.`;
                }
            }

            if (lowerPrompt.includes('high') || (lowerPrompt.includes('risk') && !lowerPrompt.includes('summary'))) {
                const high = asset_context?.filter(a => a.risk_level === 'High') || [];
                if (high.length > 0) {
                    return `I found **${high.length} high-risk vehicles** that need attention soon (within 7 days):\n\n${high.slice(0, 5).map(a => `• **${a.id}** (${a.type}): ${a.predicted_failure} - Health Score: ${a.health_score}/100`).join('\n')}\n\nWould you like to schedule maintenance for any of these?`;
                } else {
                    return `There are currently no high-risk vehicles tracked.`;
                }
            }

            if (lowerPrompt.includes('watchlist') || lowerPrompt.includes('watch list')) {
                const watchlist = asset_context?.filter(a => a.risk_level === 'Medium' || a.risk_level === 'Low') || [];
                if (watchlist.length > 0) {
                    return `Here are the top **${Math.min(5, watchlist.length)} vehicles on the watchlist**:\n\n${watchlist.slice(0, 5).map(a => `• **${a.id}** (${a.type}): ${a.risk_level} Risk - Health Score: ${a.health_score}/100`).join('\n')}\n\nThese vehicles are stable but should be monitored during routine inspections.`;
                } else {
                    return `The watchlist is currently empty.`;
                }
            }

            if (lowerPrompt.includes('recommend') || lowerPrompt.includes('action') || lowerPrompt.includes('should i') || lowerPrompt.includes('what') || lowerPrompt.includes('priority')) {
                const highRisk = asset_context?.filter(a => a.risk_level === 'Critical' || a.risk_level === 'High') || [];
                if (highRisk.length > 0) {
                    const byRegion = {};
                    highRisk.forEach(a => {
                        byRegion[a.region] = (byRegion[a.region] || 0) + 1;
                    });
                    const topRegion = Object.keys(byRegion).sort((a, b) => byRegion[b] - byRegion[a])[0];

                    return `Based on current fleet data, I recommend prioritizing **${highRisk.length} high-risk vehicles**, with focus on the **${topRegion}** region (${byRegion[topRegion]} vehicles). Top priorities:\n\n${highRisk.slice(0, 3).map(a => `• **${a.id}**: ${a.predicted_failure}`).join('\n')}\n\nWould you like me to help schedule these maintenance actions?`;
                }
            }

            if (lowerPrompt.includes('risk') || lowerPrompt.includes('status') || lowerPrompt.includes('summary') || lowerPrompt.includes('overview')) {
                const critical = asset_context?.filter(a => a.risk_level === 'Critical').length || 0;
                const high = asset_context?.filter(a => a.risk_level === 'High').length || 0;
                const total = asset_context?.length || 50;

                return `**Fleet Risk Summary:**\n\n🔴 Critical: ${critical} vehicles (${Math.round(critical / total * 100)}%)\n🟠 High Risk: ${high} vehicles (${Math.round(high / total * 100)}%)\n🟢 Watchlist: ${total - critical - high} vehicles\n\nOverall fleet health is ${critical > 5 ? 'concerning' : critical > 0 ? 'moderate' : 'good'}. ${critical > 0 ? `Immediate action needed for ${critical} critical assets.` : 'Continue monitoring watchlist vehicles.'}`;
            }

            if (lowerPrompt.includes('schedule') || lowerPrompt.includes('when') || lowerPrompt.includes('maintenance')) {
                return `I can help you schedule maintenance for your fleet. Based on risk levels:\n\n• **Critical vehicles**: Schedule within 24-48 hours\n• **High-risk vehicles**: Schedule within 7 days\n• **Watchlist**: Monitor and schedule routine maintenance\n\nWhich vehicles would you like to schedule first?`;
            }

            // General helpful response
            const total = asset_context?.length || 50;
            const critical = asset_context?.filter(a => a.risk_level === 'Critical').length || 0;
            const high = asset_context?.filter(a => a.risk_level === 'High').length || 0;

            return `I'm here to help you manage your fleet of **${total} vehicles**. Currently tracking **${critical} critical** and **${high} high-risk** assets.\n\nYou can ask me to:\n• "Show critical assets"\n• "Recommend maintenance actions"\n• "Summarize fleet risks"\n• "Help schedule maintenance"\n\nWhat would you like to know?`;
        };

        // Try Gemini API first, fallback to intelligent response
        const content = await callGemini(systemPrompt, userPrompt, intelligentFallback);

        res.json({
            success: true,
            plan: {
                type: 'text',
                message: content
            }
        });

    } catch (error) {
        console.error('Error in fleet-chat:', error);
        res.status(500).json({ success: false, error: 'Fleet chat failed' });
    }
});


// Get technician list endpoint
router.get('/technicians', (req, res) => {
    res.json({ success: true, technicians: TECHNICIANS });
});

module.exports = router;
