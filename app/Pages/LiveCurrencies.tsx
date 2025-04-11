import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

// Replace with your actual Alpha Vantage API key.
const ALPHA_API_KEY = 'QTISQI4HWA4IXQ31';

const LiveCurrencies: React.FC = () => {
  // State for dates (categories) and candlestick data values.
  const [dates, setDates] = useState<string[]>([]);
  // Each data point is an array: [open, close, low, high]
  const [candlestickData, setCandlestickData] = useState<number[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // State to track selected time range ("1d", "1w", "1m")
  const [timeRange, setTimeRange] = useState<string>('1m');

  useEffect(() => {
    // Fetch data based on the selected time range.
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine date range.
        const endDateObj = new Date();
        let startDateObj = new Date();
        // For daily data ("1w" and "1m"), set start date based on days difference.
        if (timeRange === '1w') {
          startDateObj.setDate(endDateObj.getDate() - 7);
        } else if (timeRange === '1m') {
          startDateObj.setDate(endDateObj.getDate() - 30);
        }
        // For intraday (1d) we will use the full available intraday data.
        
        // Function to format date as YYYY-MM-DD
        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        let url = '';
        let timeSeriesKey = '';
        let filteredDates: string[] = [];

        if (timeRange === '1d') {
          // For 1d, use FX_INTRADAY with a 15min interval.
          url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=15min&apikey=${ALPHA_API_KEY}`;
          // The returned JSON key for intraday data is usually "Time Series FX (15min)"
          timeSeriesKey = 'Time Series FX (15min)';
        } else {
          // For 1w and 1m, use FX_DAILY.
          url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${ALPHA_API_KEY}`;
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

        // For FX_INTRADAY, we usually have many data points for one day.
        // For FX_DAILY, we filter the dates based on the selected range.
        if (timeRange === '1d') {
          // Get all dates available (intraday data is keyed by date+time, e.g. "2025-04-11 15:45:00")
          // We'll extract just the date portion for sorting and display.
          filteredDates = Object.keys(timeSeries).sort((a, b) =>
            new Date(a).getTime() - new Date(b).getTime()
          );
        } else {
          // For FX_DAILY, filter dates between start and end.
          const allDates = Object.keys(timeSeries);
          const startDate = formatDate(startDateObj);
          const endDate = formatDate(endDateObj);
          filteredDates = allDates
            .filter((date) => date >= startDate && date <= endDate)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        }

        // Transform the filtered data into the candlestick format: [open, close, low, high]
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
  }, [timeRange]);

  // Build ECharts option for a candlestick chart.
  const options = {
    title: {
      text: 'EUR/USD Candlestick Chart',
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
      axisLabel: { formatter: function (value: string) {
          // For intraday data, you might want to show time only.
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
        name: 'EUR/USD',
        type: 'candlestick',
        data: candlestickData,
        itemStyle: {
          color: '#06B800',    // Bullish (up) candle color
          color0: '#FA0000',   // Bearish (down) candle color
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
      <h1 style={{ color: '#fff' }}>EUR/USD Candlestick Chart</h1>
      {/* Time Range Selector as buttons */}
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
