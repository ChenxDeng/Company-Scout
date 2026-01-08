import { GoogleGenAI } from "@google/genai";
import { CompanyInfo, GroundingChunk } from "../types";

export const getCompanyDetails = async (companyName: string): Promise<CompanyInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `你是一名资深的商业分析专家。请为我全网搜索并深度调查 "${companyName}" 的情报。
  
  请务必严格遵守以下输出规范：
  1. 禁用所有 Markdown 标题符（如 #, ##, ###）和加粗符（**）。
  2. 每一条核心内容必须以 "● [内容提炼]: [具体解释内容]" 的格式独立成行。
  3. 中括号内的 [内容提炼] 必须是对该条目内容的 4-6 字精炼总结，严禁直接重复大类别标题。
  4. 回报内容必须覆盖以下四个维度：
     - [500强地位]: 明确是否为世界/中国500强。如果是，请在第一行明确写出“是世界/中国500强企业”并给出具体排名。
     - [福利待遇与晋升]: 详细列出薪酬福利（五险一金、补贴、假期等）及职级晋升机制。
     - [历史与愿景]: 关键发展历史简报，以及未来3-5年的行业发展趋势预测。
     - [最新动态]: 总结最近3个月内的重大商业新闻、裁员/扩招情况或财报核心数据。
  5. 就业体验评分模型：返回以下四个维度的评分（1-10分），格式固定为：
     [RADAR_DATA]薪资待遇:8,工作福利:7,工作强度:6,晋升空间:7[/RADAR_DATA]
  6. 维度解读：在评分后紧跟以下格式提供四个维度的极简解释（每项15字以内）：
     [EXPLAIN]薪资待遇:解释,工作福利:解释,工作强度:解释,晋升空间:解释[/EXPLAIN]

  请确保分析基于真实搜索数据，观点客观专业。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let rawText = response.text || "扫描失败，未发现有效数据。";
    
    // Cleaning
    rawText = rawText.replace(/#+/g, '').replace(/\*/g, '');

    // Score Extraction
    const scoreMatch = rawText.match(/\[RADAR_DATA\](.*?)\[\/RADAR_DATA\]/);
    let finalScores = [
      { subject: '薪资待遇', value: 5 },
      { subject: '工作福利', value: 5 },
      { subject: '工作强度', value: 5 },
      { subject: '晋升空间', value: 5 },
    ];

    if (scoreMatch) {
      const parts = scoreMatch[1].split(',');
      finalScores = parts.map(p => {
        const [k, v] = p.split(':');
        return { subject: k.trim(), value: parseInt(v) || 5 };
      });
      rawText = rawText.replace(/\[RADAR_DATA\].*?\[\/RADAR_DATA\]/g, '');
    }

    // Explanation Extraction
    const explainMatch = rawText.match(/\[EXPLAIN\](.*?)\[\/EXPLAIN\]/);
    let scoreExplanations: Record<string, string> = {};
    if (explainMatch) {
      const parts = explainMatch[1].split(',');
      parts.forEach(p => {
        const [k, v] = p.split(':');
        if (k && v) scoreExplanations[k.trim()] = v.trim();
      });
      rawText = rawText.replace(/\[EXPLAIN\].*?\[\/EXPLAIN\]/g, '');
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (groundingChunks as GroundingChunk[])
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title || '外部来源',
        uri: chunk.web?.uri || '#'
      }));

    const lines = rawText.split('\n').filter(l => l.trim().startsWith('●'));
    
    return {
      name: companyName,
      isFortune500: lines.filter(l => l.includes('500强') || l.includes('地位') || l.includes('排名') || l.includes('量级')).join('\n') || "未发现明确的500强排名信息。",
      benefitsAndCareer: lines.filter(l => l.includes('福利') || l.includes('晋升') || l.includes('薪') || l.includes('待遇') || l.includes('职级')).join('\n') || "相关福利待遇数据暂缺。",
      historyAndFuture: lines.filter(l => l.includes('历史') || l.includes('愿景') || l.includes('趋势') || l.includes('预测') || l.includes('发展')).join('\n') || "历史与未来趋势分析正在生成中...",
      latestNews: lines.filter(l => l.includes('动态') || l.includes('新闻') || l.includes('商业') || l.includes('裁员') || l.includes('财报')).join('\n') || "近期暂无重大动态记录。",
      scores: finalScores,
      scoreExplanations,
      sources
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};