import React, { useEffect, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

// Constants
const ALPHA_API_KEY = 'QTISQI4HWA4IXQ31';

// Theme configuration
const theme = {
  primary: '#d3c81a',
  secondary: '#ff006e',
  success: '#38b000',
  danger: '#d90429',
  background: 'transparent',
  cardBg: 'transparent',
  text: '#f8f9fa',
  border: '#495057',
};

// Currency mapping to handle various user inputs
const currencyMapping: Record<string, string> = {
  pound: 'GBP',
  gbp: 'GBP',
  yen: 'JPY',
  jpy: 'JPY',
  yuan: 'CNY',
  cny: 'CNY',
  euro: 'EUR',
  eur: 'EUR',
  cad: 'CAD',
  aud: 'AUD',
  australian: 'AUD',
  chf: 'CHF',
  swiss: 'CHF',
  nzd: 'NZD',
  newzealand: 'NZD',
  inr: 'INR',
  indian: 'INR',
  real: 'BRL',
  brl: 'BRL',
  ruble: 'RUB',
  rub: 'RUB',
  peso: 'MXN',
  mxn: 'MXN',
  dirham: 'AED',
  aed: 'AED',
  hkd: 'HKD',
  hongkong: 'HKD',
  krw: 'KRW',
  won: 'KRW',
  sek: 'SEK',
  nok: 'NOK',
  brazil: 'BRL',
  europe: 'EUR',
  unitedstates: 'USD',
  japan: 'JPY',
  unitedkingdom: 'GBP',
  canada: 'CAD',
  australia: 'AUD',
  switzerland: 'CHF',
  india: 'INR',
  china: 'CNY',
  southkorea: 'KRW',
  southafrica: 'ZAR',
  mexico: 'MXN',
  russia: 'RUB',
  singapore: 'SGD',
};

// Time range options
const TIME_RANGES = [
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
];

// Popular currencies
const POPULAR_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CAD'];

// Component styles
const styles = {
  container: {
    padding: '2rem',
    minHeight: '100vh',
    background: theme.background,
    fontFamily: "'Montserrat', sans-serif",
    color: theme.text,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    marginBottom: '0.5rem',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
    color: theme.text,
  },
  subtitle: {
    fontSize: '1rem',
    color: 'rgba(248, 249, 250, 0.7)',
    marginBottom: '1.5rem',
  },
  card: {
    background: theme.cardBg,
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.border}`,
    marginBottom: '2rem',
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  input: {
    padding: '0.75rem 1rem',
    color: theme.text,
    backgroundColor: 'rgba(73, 80, 87, 0.5)',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    fontSize: '16px',
    outline: 'none',
    flex: '1',
    minWidth: '200px',
    transition: 'all 0.2s ease',
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    backgroundColor: theme.primary,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  timeRangeButton: (active: boolean) => ({
    backgroundColor: active ? theme.primary : 'rgba(00, 80, 00, 0.5)',
    color: theme.text,
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: active ? 'bold' : 'normal',
  }),
  popularCurrencies: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginTop: '1rem',
  },
  currencyChip: (active: boolean) => ({
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    backgroundColor: active ? theme.primary : 'rgba(73, 80, 87, 0.5)',
    color: theme.text,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    border: active ? 'none' : `1px solid ${theme.border}`,
  }),
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
  },
  loadingSpinner: {
    border: '4px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    borderTop: `4px solid ${theme.primary}`,
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  errorMessage: {
    color: theme.danger,
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(217, 4, 41, 0.1)',
    border: `1px solid ${theme.danger}`,
    marginBottom: '1rem',
  },
  chartContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    height: '600px',
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center' as const,
    fontSize: '0.9rem',
    color: 'rgba(248, 249, 250, 0.5)',
  },
};

/**
 * LiveCurrencies Component
 * Displays real-time forex exchange rates against USD
 */
const LiveCurrencies: React.FC = () => {
  // State
  const [dates, setDates] = useState<string[]>([]);
  const [candlestickData, setCandlestickData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('3m');
  const [searchInput, setSearchInput] = useState<string>('');
  const [fromSymbol, setFromSymbol] = useState<string>('EUR');

  /**
   * Handles search button click
   */
  const handleSearch = useCallback(() => {
    const input = searchInput.toLowerCase().replace(/\s/g, '');
    const currencyCode = currencyMapping[input];
    if (currencyCode) {
      setFromSymbol(currencyCode);
      setError(null);
    } else {
      setError('Currency not found. Please try again.');
    }
  }, [searchInput]);

  /**
   * Handles key press for search input
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  /**
   * Handles popular currency selection
   */
  const handlePopularCurrencyClick = useCallback((currency: string) => {
    setFromSymbol(currency);
    setSearchInput('');
    setError(null);
  }, []);

  /**
   * Fetches currency data from Alpha Vantage API
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDateObj = new Date();
        let startDateObj = new Date();

        // Calculate date range based on selected time range
        switch (timeRange) {
          case '1w':
            startDateObj.setDate(endDateObj.getDate() - 10);
            break;
          case '1m':
            startDateObj.setDate(endDateObj.getDate() - 30);
            break;
          case '3m':
            startDateObj.setDate(endDateObj.getDate() - 90);
            break;
          default:
            break;
        }

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        // Determine API endpoint based on time range
        let url = '';
        let timeSeriesKey = '';
        
        if (timeRange === '1d') {
          url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${fromSymbol}&to_symbol=USD&interval=5min&apikey=${ALPHA_API_KEY}`;
          timeSeriesKey = 'Time Series FX (5min)';
        } else {
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=USD&outputsize=full&apikey=${ALPHA_API_KEY}`;
          timeSeriesKey = 'Time Series FX (Daily)';
        }

        // Fetch data from API
        const response = await fetch(url);
        const json = await response.json();

        // Handle API errors
        if (json['Note']) {
          throw new Error(json['Note']);
        } else if (!json[timeSeriesKey]) {
          throw new Error(
            json['Error Message'] ||
              'No data available for this currency pair.'
          );
        }

        const timeSeries = json[timeSeriesKey];
        let filteredDates: string[] = [];

        // Filter dates based on time range
        if (timeRange === '1d') {
          filteredDates = Object.keys(timeSeries).sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
          );
        } else {
          const allDates = Object.keys(timeSeries);
          const startDate = formatDate(startDateObj);
          const endDate = formatDate(endDateObj);
          filteredDates = allDates
            .filter((date) => date >= startDate && date <= endDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        }

        // Transform data for candlestick chart
        const transformedData = filteredDates.map((date) => {
          const dayData = timeSeries[date];
          const open = parseFloat(dayData['1. open']);
          const high = parseFloat(dayData['2. high']);
          const low = parseFloat(dayData['3. low']);
          const close = parseFloat(dayData['4. close']);
          return [open, close, low, high];
        });

        setDates(filteredDates);
        setCandlestickData(transformedData);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, fromSymbol]);

  /**
   * Creates chart options for ECharts
   */
  const getChartOptions = useCallback(() => {
    return {
      title: {
        text: `${fromSymbol}/USD Exchange Rate`,
        subtext: TIME_RANGES.find(range => range.value === timeRange)?.label,
        left: 'center',
        textStyle: { 
          color: theme.text,
          fontSize: 18,
          fontWeight: 'normal',
          fontFamily: "'Montserrat', sans-serif",
        },
        subtextStyle: {
          color: theme.text,
          fontSize: 14,
        }
      },
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { 
          type: 'cross',
          lineStyle: {
            color: theme.border,
            width: 1,
            opacity: 0.5,
          }
        },
        backgroundColor: theme.cardBg,
        borderColor: theme.border,
        textStyle: {
          color: theme.text
        }
      },
      legend: {
        data: [`${fromSymbol}/USD`],
        textStyle: {
          color: theme.text
        },
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: theme.border } },
        boundaryGap: false,
        splitLine: { 
          show: true,
          lineStyle: {
            color: 'rgba(73, 80, 87, 0.2)',
            type: 'dashed'
          }
        },
        axisLabel: {
          formatter: function (value: string) {
            if (timeRange === '1d') return value.split(' ')[1];
            return value;
          },
          color: theme.text,
          fontSize: 10,
          rotate: timeRange === '1m' || timeRange === '3m' ? 45 : 0
        },
      },
      yAxis: {
        scale: true,
        splitArea: { 
          show: true,
          areaStyle: {
            color: ['rgba(73, 80, 87, 0.02)', 'rgba(73, 80, 87, 0.05)']
          }
        },
        axisLine: { lineStyle: { color: theme.border } },
        splitLine: { 
          show: true,
          lineStyle: {
            color: 'rgba(73, 80, 87, 0.2)',
            type: 'dashed'
          }
        },
        axisLabel: {
          color: theme.text,
          fontSize: 10,
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          bottom: 60,
          height: 20,
          borderColor: theme.border,
          textStyle: {
            color: theme.text
          },
          handleStyle: {
            color: theme.primary,
            borderColor: theme.primary
          },
          fillerColor: 'rgba(58, 134, 255, 0.2)'
        }
      ],
      series: [
        {
          name: `${fromSymbol}/USD`,
          type: 'candlestick',
          data: candlestickData,
          itemStyle: {
            color: theme.success,
            color0: theme.danger,
            borderColor: theme.success,
            borderColor0: theme.danger,
          },
        },
      ],
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      animation: true
    };
  }, [dates, candlestickData, fromSymbol, timeRange]);

  return (
    <div style={styles.container}>
      {/* Header */}
      

      {/* Main Card */}
      <div style={styles.card}>
        

        {/* Time Range Selector */}
      <div style={styles.timeRangeContainer}>
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              style={styles.timeRangeButton(timeRange === range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && <div style={styles.errorMessage}>Error: {error}</div>}
        
        {/* Chart or Loading Spinner */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
          </div>
        ) : !error && (
          <div style={styles.chartContainer}>
            <ReactECharts 
              option={getChartOptions()} 
              style={{ height: '100%', width: '100%' }} 
              opts={{ renderer: 'canvas' }}
            />
          </div>
        )}
      </div>
      
      
        {/* Search Section */}
        <div style={styles.searchContainer}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter currency (GBP, Yen, Euro, etc.)"
              style={styles.input}
            />
            <button
              onClick={handleSearch}
              style={styles.button}
            >
              Search
            </button>
          </div>
          
          {/* Popular Currencies */}
          <div>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Popular currencies:</p>
            <div style={styles.popularCurrencies}>
              {POPULAR_CURRENCIES.map((currency) => (
                <div
                  key={currency}
                  onClick={() => handlePopularCurrencyClick(currency)}
                  style={styles.currencyChip(currency === fromSymbol)}
                >
                  {currency}/USD
                </div>
              ))}
            </div>
          </div>
        </div>
      
      {/* CSS Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
        `
      }} />
    </div>
  );
};

export default LiveCurrencies;
