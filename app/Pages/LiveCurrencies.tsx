import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

const ALPHA_API_KEY = 'QTISQI4HWA4IXQ31';

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

const LiveCurrencies: React.FC = () => {
  const [dates, setDates] = useState<string[]>([]);
  const [candlestickData, setCandlestickData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('1m');
  const [searchInput, setSearchInput] = useState<string>('');
  const [fromSymbol, setFromSymbol] = useState<string>('EUR');

  // Handle search button click
  const handleSearch = () => {
    const input = searchInput.toLowerCase().replace(/\s/g, '');
    const currencyCode = currencyMapping[input];
    if (currencyCode) {
      setFromSymbol(currencyCode);
      setError(null);
    } else {
      setError('Currency not found. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const endDateObj = new Date();
        let startDateObj = new Date();

        if (timeRange === '1w') {
          startDateObj.setDate(endDateObj.getDate() - 10);
        } else if (timeRange === '1m') {
          startDateObj.setDate(endDateObj.getDate() - 30);
        }

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        let url = '';
        let timeSeriesKey = '';
        let filteredDates: string[] = [];

        if (timeRange === '1d') {
          url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${fromSymbol}&to_symbol=USD&interval=5min&apikey=${ALPHA_API_KEY}`;
          timeSeriesKey = 'Time Series FX (5min)';
        } else {
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${fromSymbol}&to_symbol=USD&outputsize=full&apikey=${ALPHA_API_KEY}`;
          timeSeriesKey = 'Time Series FX (Daily)';
        }

        const response = await fetch(url);
        const json = await response.json();

        if (json['Note']) {
          throw new Error(json['Note']);
        } else if (!json[timeSeriesKey]) {
          throw new Error(
            json['Error Message'] ||
              'No data available for this currency pair.'
          );
        }

        const timeSeries = json[timeSeriesKey];

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
  }, [timeRange, fromSymbol]);

  const options = {
    title: {
      text: `${fromSymbol}/USD`,
      subtext:
        timeRange === '1d'
          ? 'Intraday (5min intervals)'
          : timeRange === '1w'
          ? '10-Day Range'
          : '30-Day Range',
      sape: '10px',
      textStyle: { color: '#fff' },
    },
    backgroundColor: '#002200',
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
        formatter: function (value: string) {
          if (timeRange === '1d') return value.split(' ')[1];
          return value;
        },
      },
    },
    yAxis: {
      scale: true,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#fff' } },
    },
    series: [
      {
        name: `${fromSymbol}/USD`,
        type: 'candlestick',
        data: candlestickData,
        itemStyle: {
          color: '#06B800',
          color0: '#FA0000',
          borderColor: '#06B800',
          borderColor0: '#FA0000',
        },
      },
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '25%',
    },
  };

  return (
    <div style={{ padding: '1rem', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', fontSize:'30px',paddingBottom:'2rem', marginLeft:'0.42rem', fontFamily: "'Montserrat', sans-serif",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)" }}>1-Month Forex Charts</h1>
      <div style={{ marginBottom: '1rem' }}>
      <input
  type="text"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="Enter currency (GBP, Yen, etc.)"
  style={{
    padding: '0.5rem 1rem',
    color: '#fff', // Black text
    backgroundColor: '#444', // Dark background
    marginRight: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    paddingBottom: '0.5rem'
  }}
/>
<button
  onClick={handleSearch}
  style={{
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    fontWeight: 'bold',
    backgroundColor: '#fff',  // White button
    color: '#000',            // Black text
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  }}
>
  Search
</button>

      </div>
      {/* <div style={{ marginBottom: '1rem' }}>
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
              cursor: 'pointer',
            }}
          >
            {range}
          </button>
        ))}
      </div> */}
      {loading && <div style={{ color: '#fff' }}>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!loading && !error && (
        <ReactECharts option={options} style={{ height: '600px', width: '100%', paddingTop:'1rem' }} />
      )}
    </div>
  );
};

export default LiveCurrencies;