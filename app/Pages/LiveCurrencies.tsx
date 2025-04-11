import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

// Replace with your actual Alpha Vantage API key.
const ALPHA_API_KEY = 'QTISQI4HWA4IXQ31';

// Define 15 major currencies along with possible search terms.
const currencyList = [
  { code: 'EUR', names: ['euro', 'eur'] },
  { code: 'GBP', names: ['pound', 'gbp', 'british', 'sterling'] },
  { code: 'JPY', names: ['yen', 'jpy', 'japanese'] },
  { code: 'AUD', names: ['australian', 'aud', 'dollar'] },
  { code: 'CAD', names: ['canadian', 'cad', 'dollar'] },
  { code: 'CHF', names: ['swiss', 'chf', 'franc'] },
  { code: 'BRL', names: ['brazil', 'brl', 'real'] },
  { code: 'CNY', names: ['chinese', 'cny', 'yuan', 'renminbi'] },
  { code: 'INR', names: ['indian', 'inr', 'rupee'] },
  { code: 'RUB', names: ['ruble', 'rub', 'russian'] },
  { code: 'ZAR', names: ['south african', 'zar', 'rand'] },
  { code: 'SEK', names: ['swedish', 'sek', 'krona'] },
  { code: 'NOK', names: ['norwegian', 'nok', 'krone'] },
  { code: 'DKK', names: ['danish', 'dkk', 'krone'] },
  { code: 'SGD', names: ['singapore', 'sgd', 'dollar'] },
];

const LiveCurrencies: React.FC = () => {
  // Chart state
  const [dates, setDates] = useState<string[]>([]);
  // Each data point: [open, close, low, high]
  const [candlestickData, setCandlestickData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Time range state ("1d", "1w", "1m")
  const [timeRange, setTimeRange] = useState<string>('1m');
  // Search bar state and the active base currency (from_symbol). Defaults to EUR.
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [baseCurrency, setBaseCurrency] = useState<string>('EUR');

  // Fetch data whenever timeRange or baseCurrency changes.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDateObj = new Date();
        let startDateObj = new Date();

        // For daily data ("1w" and "1m"), set start date based on days difference.
        if (timeRange === '1w') {
          startDateObj.setDate(endDateObj.getDate() - 7);
        } else if (timeRange === '1m') {
          startDateObj.setDate(endDateObj.getDate() - 30);
        }
        // For intraday (1d), we'll use the full available intraday data.

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        let url = '';
        let timeSeriesKey = '';
        let filteredDates: string[] = [];

        if (timeRange === '1d') {
          // For 1d, use FX_INTRADAY with a 15min interval.
          url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${baseCurrency}&to_symbol=USD&interval=15min&apikey=${ALPHA_API_KEY}`;
          // In many cases, intraday data is keyed as "Time Series FX (15min)"
          timeSeriesKey = 'Time Series FX (15min)';
        } else {
          // For 1w and 1m, use FX_DAILY.
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${baseCurrency}&to_symbol=USD&apikey=${ALPHA_API_KEY}`;
          timeSeriesKey = 'Time Series FX (Daily)';
        }

        const response = await fetch(url);
        const json = await response.json();

        if (!json[timeSeriesKey]) {
          throw new Error(
            json['Error Message'] ||
              'No data available. Check your API key or rate limits.'
          );
        }

        const timeSeries = json[timeSeriesKey];

        if (timeRange === '1d') {
          // Intraday: sort by date+time.
          filteredDates = Object.keys(timeSeries).sort((a, b) =>
            new Date(a).getTime() - new Date(b).getTime()
          );
        } else {
          // Daily: filter dates between start and end.
          const allDates = Object.keys(timeSeries);
          const startDate = formatDate(startDateObj);
          const endDate = formatDate(endDateObj);
          filteredDates = allDates
            .filter((date) => date >= startDate && date <= endDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        }

        // Transform data: [open, close, low, high]
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
      }
      setLoading(false);
    };

    fetchData();
  }, [timeRange, baseCurrency]);

  // Handle search: when user submits the search, attempt to match to a currency.
  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    // Find a matching currency from the list.
    const match = currencyList.find(currency =>
      currency.names.some(name => name.includes(term))
    );

    if (match) {
      setBaseCurrency(match.code);
    } else {
      // If no match found, optionally you can set an error.
      setError('No matching currency found.');
    }
    setSearchTerm('');
  };

  // ECharts option for candlestick chart.
  const options = {
    title: {
      text: `${baseCurrency}/USD Candlestick Chart`,
      subtext: timeRange === '1d' ? 'Intraday (15min intervals)' : timeRange === '1w' ? 'Weekly Range (Daily Candles)' : 'Monthly Range (Daily Candles)',
      textStyle: { color: '#fff' },
    },
    backgroundColor: '#222',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#fff' } },
      boundaryGap: false,
      splitLine: { show: false },
      axisLabel: { 
        formatter: (value: string) => {
          if (timeRange === '1d') return value.split(' ')[1];
          return value;
        }
      }
    },
    yAxis: {
      scale: true,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#fff' } },
    },
    series: [
      {
        name: `${baseCurrency}/USD`,
        type: 'candlestick',
        data: candlestickData,
        itemStyle: {
          color: '#06B800',    // Bullish candle color
          color0: '#FA0000',   // Bearish candle color
          borderColor: '#06B800',
          borderColor0: '#FA0000'
        },
      },
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '25%',
    },
    dataZoom: [
      {
        type: 'inside',
        start: 70,
        end: 100,
      },
      {
        show: true,
        type: 'slider',
        top: '85%',
        start: 70,
        end: 100,
        textStyle: { color: '#fff' },
      },
    ],
  };

  return (
    <div style={{ backgroundColor: '#222', padding: '1rem', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff' }}>{baseCurrency}/USD Candlestick Chart</h1>
      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search (e.g., euro, pound, yen, gbp, eur)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '300px',
            marginRight: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#06B800',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Search
        </button>
      </div>

      {/* Time Range Selector */}
      <div style={{ marginBottom: '1rem' }}>
        {['1d', '1w', '1m'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            style={{
              backgroundColor: timeRange === range ? '#06B800' : '#444',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              marginRight: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {range}
          </button>
        ))}
      </div>
      {loading && <div style={{ color: '#fff' }}>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!loading && !error && (
        <ReactECharts option={options} style={{ height: '600px', width: '100%' }} />
      )}
    </div>
  );
};

export default LiveCurrencies;
