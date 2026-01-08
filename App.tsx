import React, { useState, FormEvent } from 'react';
import { getCompanyDetails } from './services/geminiService';
import { CompanyInfo } from './types';
import { Skeleton } from './components/Skeleton';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyInfo | null>(null);

  const handleSearch = async (e?: FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getCompanyDetails(activeQuery);
      setResult(data);
    } catch (err) {
      setError('情报调取失败。可能是网络波动或 API 限制，请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const renderCleanPoints = (text: string) => {
    return text.split('\n').map((line, i) => {
      const match = line.match(/●\s*\[(.*?)\]:\s*(.*)/);
      if (match) {
        return (
          <div key={i} className="mb-4 last:mb-0 group animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <span className="text-emerald-400 font-bold block md:inline md:mr-2">● {match[1]}:</span>
            <span className="text-slate-300 font-light leading-relaxed">{match[2]}</span>
          </div>
        );
      }
      return line.trim() ? <p key={i} className="text-slate-500 text-sm mb-2">{line}</p> : null;
    });
  };

  // Helper to get specific score
  const getScoreValue = (subject: string) => {
    return result?.scores.find(s => s.subject === subject)?.value || 0;
  };

  // Heuristic to determine if the company is a confirmed Fortune 500 based on the response text
  const isFortune500Company = result && 
    (result.isFortune500.includes('是世界500强') || 
     result.isFortune500.includes('是中国500强') || 
     (result.isFortune500.includes('500强') && result.isFortune500.includes('排名第'))) &&
    !result.isFortune500.includes('不属于') &&
    !result.isFortune500.includes('暂未进入');

  return (
    <div className="min-h-screen pb-24 selection:bg-emerald-500/30">
      {/* Dynamic Header */}
      <nav className="glass-card sticky top-0 z-50 border-b border-white/5 py-4 px-6 mb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="tech-gradient-bg w-10 h-10 rounded-xl flex items-center justify-center glow-mint">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span className="text-xl font-black tech-gradient-text uppercase tracking-widest">Scout Pro</span>
          </div>

          <form onSubmit={handleSearch} className="relative w-full md:w-[480px]">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入公司全名，例如：字节跳动"
              className="w-full bg-slate-900/40 border border-slate-700/50 rounded-2xl py-3.5 pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-slate-100 placeholder-slate-600 shadow-inner"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 tech-gradient-bg text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? '分析中' : '全网扫描'}
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6">
        {!result && !loading && !error && (
          <div className="text-center py-20 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter text-white">
              找工作前，先看 <br/>
              <span className="tech-gradient-text">公司底牌</span>
            </h1>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto mb-12">
              基于 Google Gemini 3.0 与实时搜索增强，为您透视企业的 500 强排名、真实福利与未来潜力。
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['华为', '小米', '微软', '美团'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(undefined, tag)}
                  className="px-8 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="max-w-4xl mx-auto">
            <Skeleton />
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl text-center font-medium">
            <p>{error}</p>
            <button onClick={() => handleSearch()} className="mt-4 text-sm underline opacity-70 hover:opacity-100">点击重试</button>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8">
            {/* Summary & Radar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Top Left Company Summary Box */}
              <div className={`lg:col-span-8 glass-card p-10 rounded-[2.5rem] relative overflow-hidden group transition-all duration-700 ${isFortune500Company ? 'border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'border-white/5'}`}>
                <div className={`absolute top-0 right-0 w-80 h-80 blur-[100px] -mr-40 -mt-40 transition-colors duration-700 ${isFortune500Company ? 'bg-emerald-400/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`}></div>
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className={`text-5xl font-black italic tracking-tighter mb-4 transition-colors duration-700 ${isFortune500Company ? 'text-emerald-50' : 'text-white'}`}>{result.name}</h2>
                    <div className="flex gap-2">
                      <span className={`border text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest transition-all duration-700 ${isFortune500Company ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 glow-mint' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {isFortune500Company ? 'Fortune 500 Elite' : 'Scanned Status: Active'}
                      </span>
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest">Grounding: Live</span>
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-3xl border transition-all duration-700 ${isFortune500Company ? 'bg-emerald-950/40 border-emerald-500/20 glow-mint shadow-inner' : 'bg-slate-950/50 border-white/5'}`}>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className={`w-1 h-3 transition-colors duration-700 ${isFortune500Company ? 'bg-emerald-400' : 'tech-gradient-bg'}`}></div> 500强地位 / 行业地位
                  </div>
                  {renderCleanPoints(result.isFortune500)}
                </div>
              </div>

              {/* Radar Card & Detailed Scores */}
              <div className="lg:col-span-4 glass-card p-10 rounded-[2.5rem] flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">就业体验</h3>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                  </div>
                </div>
                
                <div className="w-full h-[220px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={result.scores}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                      <Radar
                        name="综合评分"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-4 px-2 mb-2">
                  {['薪资待遇', '工作福利', '工作强度', '晋升空间'].map((subject) => {
                    const val = getScoreValue(subject);
                    const explain = result.scoreExplanations[subject];
                    return (
                      <div key={subject} className="animate-fade-in group/item">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider group-hover/item:text-emerald-400 transition-colors">{subject}</span>
                          <span className="text-[11px] font-black text-emerald-400">{val}/10</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden border border-white/5 mb-1.5">
                          <div 
                            className="h-full tech-gradient-bg shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${(val / 10) * 100}%` }}
                          ></div>
                        </div>
                        {explain && (
                          <p className="text-[10px] text-slate-500 leading-snug font-light italic">
                            {explain}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="mt-auto pt-6 text-[9px] text-slate-600 text-center uppercase tracking-[0.2em] leading-loose">
                  * 评分基于全网公开资讯及商业报表 <br/> 由 AI 模型生成的加权参考。
                </p>
              </div>
            </div>

            {/* Detailed Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-10 rounded-[2.5rem]">
                <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <div className="bg-emerald-500/10 p-2 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  福利待遇与职级晋升
                </h4>
                <div className="space-y-2">
                  {renderCleanPoints(result.benefitsAndCareer)}
                </div>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem]">
                <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <div className="bg-blue-500/10 p-2 rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  </div>
                  历史背景与趋势预测
                </h4>
                <div className="space-y-2">
                  {renderCleanPoints(result.historyAndFuture)}
                </div>
              </div>

              <div className="glass-card p-10 rounded-[2.5rem] md:col-span-2">
                <div className="flex flex-col lg:flex-row gap-12">
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <div className="bg-slate-500/10 p-2 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"/></svg>
                      </div>
                      实时企业最新动态
                    </h4>
                    {renderCleanPoints(result.latestNews)}
                  </div>
                  
                  {result.sources.length > 0 && (
                    <div className="lg:w-1/3 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-12">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-6">情报数据溯源</span>
                      <div className="grid gap-3">
                        {result.sources.map((src, i) => (
                          <a 
                            key={i} 
                            href={src.uri} 
                            target="_blank" 
                            className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                          >
                            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-40 pb-20 text-center opacity-30">
        <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-500">
          Professional Career Intelligence Tool • Build v4.1.5
        </p>
      </footer>
    </div>
  );
};

export default App;