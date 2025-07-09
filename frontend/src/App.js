import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff, AlertCircle, Activity, Search } from 'lucide-react';

const MarketSentimentDashboard = () => {
  const [sentimentData, setSentimentData] = useState({});
  const [newsData, setNewsData] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [demoMode, setDemoMode] = useState(false);
  const [hasReceivedRealData, setHasReceivedRealData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ws = useRef(null);
  const intervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Mock data generators with more realistic values
  const generateMockSentiment = () => {
    const sentiment = (Math.random() - 0.5) * 1.6; // Range: -0.8 to 0.8
    const confidence = Math.random() * 0.3 + 0.7; // Range: 0.7 to 1.0
    let signal = 'HOLD';
    if (sentiment > 0.3) signal = 'BUY';
    else if (sentiment < -0.3) signal = 'SELL';
    return {
      sentiment: parseFloat(sentiment.toFixed(3)),
      confidence: parseFloat(confidence.toFixed(3)),
      signal,
      timestamp: new Date().toISOString()
    };
  };

  const generateMockNews = () => {
    const headlines = [
      "Tech Giants Report Strong Q4 Earnings Beating Expectations",
      "Federal Reserve Signals Potential Interest Rate Changes",
      "AI Sector Shows Unprecedented Growth in Market Valuation",
      "Market Volatility Decreases Following Positive Policy Changes",
      "Energy Stocks Surge on Supply Chain Improvements",
      "Healthcare Innovation Drives Strong Sector Performance",
      "Cryptocurrency Market Shows Signs of Long-term Stabilization",
      "Retail Earnings Beat Analyst Expectations Across Board"
    ];
    const sources = ["Reuters", "Bloomberg", "CNBC", "Wall Street Journal", "MarketWatch"];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA'];
    return Array.from({ length: 5 }, (_, i) => ({
      title: headlines[Math.floor(Math.random() * headlines.length)],
      summary: "Market analysis reveals significant developments in key sectors with potential implications for investors and market dynamics moving forward. Expert analysts provide insights into emerging trends.",
      published: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source: sources[Math.floor(Math.random() * sources.length)],
      sentiment_score: parseFloat(((Math.random() - 0.5) * 1.5).toFixed(3)),
      sentiment_label: Math.random() > 0.5 ? 'positive' : Math.random() > 0.5 ? 'negative' : 'neutral',
      symbols: symbols.slice(0, Math.floor(Math.random() * 3) + 1)
    }));
  };

  const initializeMockData = () => {
    const trackedSymbolsList = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'SPY', 'QQQ'];
    const mockSentiment = {};
    const mockHistorical = {};
    trackedSymbolsList.forEach(symbol => {
      mockSentiment[symbol] = generateMockSentiment();
      mockHistorical[symbol] = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(Date.now() - (19 - i) * 60000);
        const sentiment = (Math.random() - 0.5) * 1.4;
        const confidence = Math.random() * 0.3 + 0.7;
        let signal = 'HOLD';
        if (sentiment > 0.3) signal = 'BUY';
        else if (sentiment < -0.3) signal = 'SELL';
        return {
          time: time.toLocaleTimeString(),
          sentiment: parseFloat(sentiment.toFixed(3)),
          signal,
          confidence: parseFloat(confidence.toFixed(3))
        };
      });
    });
    setSentimentData(mockSentiment);
    setHistoricalData(mockHistorical);
    setNewsData(generateMockNews());
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const updateMockData = () => {
    if (!demoMode || hasReceivedRealData) return;
    const trackedSymbolsList = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'SPY', 'QQQ'];
    setSentimentData(prev => {
      const updated = { ...prev };
      trackedSymbolsList.forEach(symbol => {
        updated[symbol] = generateMockSentiment();
      });
      return updated;
    });
    setHistoricalData(prev => {
      const updated = { ...prev };
      trackedSymbolsList.forEach(symbol => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          sentiment: parseFloat(((Math.random() - 0.5) * 1.4).toFixed(3)),
          signal: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)],
          confidence: parseFloat((Math.random() * 0.3 + 0.7).toFixed(3))
        };
        updated[symbol] = [...(prev[symbol] || []).slice(-19), newPoint];
      });
      return updated;
    });
    if (Math.random() < 0.2) {
      setNewsData(generateMockNews());
    }
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const startDemoMode = () => {
    console.log('Starting demo mode');
    setDemoMode(true);
    setHasReceivedRealData(false);
    if (!intervalRef.current) {
      initializeMockData();
      intervalRef.current = setInterval(updateMockData, 10000);
    }
  };

  const stopDemoMode = () => {
    console.log('Stopping demo mode');
    setDemoMode(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const connectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    try {
      ws.current = new WebSocket(process.env.REACT_APP_WS_URL);
      ws.current.onopen = () => {
        console.log('WebSocket Connected');
        setConnected(true);
        setHasReceivedRealData(false);
        stopDemoMode();
      };
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message.type);
        setHasReceivedRealData(true);
        switch (message.type) {
          case 'initial_data':
            if (message.sentiment) setSentimentData(message.sentiment);
            if (message.news) setNewsData(message.news);
            setLastUpdate(new Date().toLocaleTimeString());
            break;
          case 'sentiment_update':
            const newSentiment = {};
            message.data.forEach(item => {
              newSentiment[item.symbol] = item;
              setHistoricalData(prev => ({
                ...prev,
                [item.symbol]: [
                  ...(prev[item.symbol] || []).slice(-49),
                  {
                    time: new Date(item.timestamp).toLocaleTimeString(),
                    sentiment: item.sentiment,
                    signal: item.signal,
                    confidence: item.confidence
                  }
                ]
              }));
            });
            setSentimentData(prev => ({ ...prev, ...newSentiment }));
            setLastUpdate(new Date().toLocaleTimeString());
            break;
          case 'news_update':
            if (message.data) setNewsData(message.data);
            break;
        }
      };
      ws.current.onclose = (event) => {
        console.log('WebSocket Disconnected:', event.code, event.reason);
        setConnected(false);
        if (!hasReceivedRealData) startDemoMode();
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 5000);
      };
      ws.current.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setConnected(false);
        if (!hasReceivedRealData) startDemoMode();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnected(false);
      startDemoMode();
    }
  };

  useEffect(() => {
    connectWebSocket();
    const demoTimeout = setTimeout(() => {
      if (!connected && !hasReceivedRealData) {
        startDemoMode();
      }
    }, 2000);
    return () => {
      if (ws.current) ws.current.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(demoTimeout);
    };
  }, []);

  const getSentimentIcon = (signal) => {
    if (signal === 'BUY') return <TrendingUp style={{ width: '18px', height: '18px', color: '#28a745' }} />;
    if (signal === 'SELL') return <TrendingDown style={{ width: '18px', height: '18px', color: '#dc3545' }} />;
    return <Minus style={{ width: '18px', height: '18px', color: '#6c757d' }} />;
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment > 0.1) return '#28a745';
    if (sentiment < -0.1) return '#dc3545';
    return '#adb5bd';
  };

  const getSignalStyles = (signal) => {
    switch (signal) {
      case 'BUY': return { backgroundColor: 'rgba(40, 167, 69, 0.2)', color: '#28a745' };
      case 'SELL': return { backgroundColor: 'rgba(220, 53, 69, 0.2)', color: '#dc3545' };
      default: return { backgroundColor: 'rgba(108, 117, 125, 0.2)', color: '#6c757d' };
    }
  };

  const formatSentimentValue = (value) => {
    return value > 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
  };

  const trackedSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'SPY', 'QQQ'];
  const filteredSymbols = trackedSymbols.filter(symbol =>
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentHistoricalData = historicalData[selectedSymbol] || [];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)',
      color: '#E6EDF3',
      padding: '24px',
      fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'"
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    headerTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #58A6FF, #A371F7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0
    },
    subtitle: {
      color: '#8B949E',
      marginTop: '8px',
      margin: 0
    },
    demoTag: {
      marginLeft: '12px',
      padding: '4px 10px',
      backgroundColor: '#F7B955',
      color: '#0D1117',
      fontSize: '0.8rem',
      borderRadius: '6px',
      fontWeight: '600'
    },
    statusContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px'
    },
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    connectedText: { fontSize: '0.875rem', color: '#3FB950' },
    disconnectedText: { fontSize: '0.875rem', color: '#F85149' },
    lastUpdate: { fontSize: '0.875rem', color: '#8B949E' },
    searchContainer: { position: 'relative', width: '300px' },
    searchInput: {
      width: '100%',
      padding: '10px 40px 10px 16px',
      backgroundColor: '#0D1117',
      border: '1px solid #30363D',
      borderRadius: '8px',
      color: '#E6EDF3',
      fontSize: '1rem',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    searchIcon: {
      position: 'absolute',
      top: '50%',
      right: '12px',
      transform: 'translateY(-50%)',
      color: '#8B949E'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    },
    symbolCard: {
      backgroundColor: '#161B22',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #30363D',
      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
      cursor: 'pointer'
    },
    symbolCardSelected: {
      borderColor: '#58A6FF',
      boxShadow: '0 0 15px rgba(88, 166, 255, 0.3)'
    },
    symbolHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    },
    symbolName: { fontWeight: '600', fontSize: '1.25rem', margin: 0 },
    sentimentValue: { fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '8px' },
    symbolFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    signalBadge: {
      padding: '5px 12px',
      borderRadius: '8px',
      fontSize: '0.8rem',
      fontWeight: '600'
    },
    confidence: { fontSize: '0.8rem', color: '#8B949E' },
    chartsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' },
    chartCard: {
      backgroundColor: '#161B22',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #30363D'
    },
    chartTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      margin: 0
    },
    chartIcon: { width: '24px', height: '24px', marginRight: '12px', color: '#58A6FF' },
    newsCard: {
      backgroundColor: '#161B22',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #30363D'
    },
    newsTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      margin: 0
    },
    newsIcon: { width: '24px', height: '24px', marginRight: '12px', color: '#F7B955' },
    newsContent: { maxHeight: '400px', overflowY: 'auto' },
    newsItem: {
      backgroundColor: '#0D1117',
      borderRadius: '10px',
      padding: '16px',
      border: '1px solid #30363D',
      marginBottom: '16px'
    },
    newsItemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
    newsItemTitle: { fontWeight: '600', fontSize: '1.125rem', color: '#E6EDF3', margin: 0, flex: 1 },
    newsItemSentiment: {
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: '600',
      marginLeft: '16px',
      whiteSpace: 'nowrap'
    },
    newsItemSummary: { color: '#8B949E', fontSize: '0.9rem', lineHeight: '1.5', marginTop: '8px', marginBottom: '12px' },
    newsItemFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#8B949E' },
    newsItemMeta: { display: 'flex', alignItems: 'center', gap: '16px' },
    symbolTags: { display: 'flex', gap: '6px', alignItems: 'center' },
    symbolTag: { backgroundColor: '#58A6FF', color: '#0D1117', padding: '3px 8px', borderRadius: '6px', fontWeight: '500' },
    symbolExtra: { color: '#8B949E' },
    emptyState: { textAlign: 'center', color: '#8B949E', padding: '48px' },
    emptyIcon: { width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }
  };

  return (
    <div style={styles.container}>
      <style>{`
          @keyframes pulse { 50% { opacity: 0.5; } }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #0D1117; }
          ::-webkit-scrollbar-thumb { background: #30363D; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #58A6FF; }
      `}</style>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <div>
              <h1 style={styles.title}>Quant Sentiment</h1>
              <p style={styles.subtitle}>
                Real-time sentiment analysis from financial news
                {demoMode && <span style={styles.demoTag}>DEMO MODE</span>}
              </p>
            </div>
            <div style={styles.statusContainer}>
              <div style={styles.connectionStatus}>
                {connected ? <Wifi style={{ color: '#3FB950' }} /> : <WifiOff style={{ color: '#F85149' }} />}
                <span style={connected ? styles.connectedText : styles.disconnectedText}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastUpdate && <div style={styles.lastUpdate}>Last update: {lastUpdate}</div>}
            </div>
          </div>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search Symbols..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = '#58A6FF'; e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.3)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none'; }}
            />
            <Search style={styles.searchIcon} size={20} />
          </div>
        </div>

        <div style={styles.grid}>
          {filteredSymbols.map(symbol => {
            const data = sentimentData[symbol];
            const isSelected = selectedSymbol === symbol;
            return (
              <div
                key={symbol}
                style={{
                  ...styles.symbolCard,
                  ...(isSelected ? styles.symbolCardSelected : {})
                }}
                onClick={() => setSelectedSymbol(symbol)}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#8B949E'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#30363D'; }}
              >
                <div style={styles.symbolHeader}>
                  <h3 style={styles.symbolName}>{symbol}</h3>
                  {data && getSentimentIcon(data.signal)}
                </div>
                {data ? (
                  <>
                    <div style={{ ...styles.sentimentValue, color: getSentimentColor(data.sentiment) }}>
                      {formatSentimentValue(data.sentiment)}
                    </div>
                    <div style={styles.symbolFooter}>
                      <span style={{ ...styles.signalBadge, ...getSignalStyles(data.signal) }}>
                        {data.signal}
                      </span>
                      <span style={styles.confidence}>{Math.round(data.confidence * 100)}% Conf.</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <div style={{ height: '32px', backgroundColor: '#30363D', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#30363D', borderRadius: '4px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}><Activity style={styles.chartIcon} />Sentiment History - {selectedSymbol}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentHistoricalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="time" stroke="#8B949E" tick={{ fontSize: 12 }} />
                <YAxis stroke="#8B949E" domain={[-1, 1]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #30363D', borderRadius: '8px' }}
                  labelStyle={{ color: '#E6EDF3' }}
                />
                <Legend />
                <Line type="monotone" dataKey="sentiment" stroke="#58A6FF" strokeWidth={2} dot={false} name="Sentiment" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Confidence Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trackedSymbols.map(s => ({ symbol: s, confidence: sentimentData[s]?.confidence || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis dataKey="symbol" stroke="#8B949E" tick={{ fontSize: 12 }} />
                <YAxis stroke="#8B949E" domain={[0, 1]} tickFormatter={(val) => `${val * 100}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #30363D', borderRadius: '8px' }}
                  formatter={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <Bar dataKey="confidence" fill="#3FB950" name="Confidence" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.newsCard}>
          <h3 style={styles.newsTitle}><AlertCircle style={styles.newsIcon} />Recent Market News - {selectedSymbol}</h3>
          <div style={styles.newsContent}>
            {newsData.filter(news => news.symbols.includes(selectedSymbol)).length > 0 ? (
              newsData.filter(news => news.symbols.includes(selectedSymbol)).map((news, index) => (
                <div key={index} style={styles.newsItem}>
                  <div style={styles.newsItemHeader}>
                    <h4 style={styles.newsItemTitle}>{news.title}</h4>
                    <div style={{ ...styles.newsItemSentiment, ...getSignalStyles(news.sentiment_score > 0.1 ? 'BUY' : news.sentiment_score < -0.1 ? 'SELL' : 'HOLD') }}>
                      {formatSentimentValue(news.sentiment_score)}
                    </div>
                  </div>
                  <p style={styles.newsItemSummary}>{news.summary}</p>
                  <div style={styles.newsItemFooter}>
                    <div style={styles.newsItemMeta}>
                      <span>{news.source}</span>
                      <div style={styles.symbolTags}>
                        {news.symbols.slice(0, 3).map(s => <span key={s} style={styles.symbolTag}>{s}</span>)}
                        {news.symbols.length > 3 && <span style={styles.symbolExtra}>+{news.symbols.length - 3}</span>}
                      </div>
                    </div>
                    <span>{new Date(news.published).toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <AlertCircle style={styles.emptyIcon} />
                <p>No recent news available for {selectedSymbol}. Waiting for updates...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentDashboard;