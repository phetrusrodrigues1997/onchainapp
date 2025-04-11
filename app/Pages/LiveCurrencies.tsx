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

  useEffect(() => {
    // Fetch FX daily data for USD/EUR from Alpha Vantage.
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${ALPHA_API_KEY}`;
        const response = await fetch(url);
        const json = await response.json();

        // Check if the data was returned successfully.
        if (!json['Time Series FX (Daily)']) {
          throw new Error(json['Error Message'] || 'No data available. Check your API key or rate limits.');
        }

        const timeSeries = json['Time Series FX (Daily)'];
        // Sort dates in ascending order.
        const sortedDates = Object.keys(timeSeries).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        // For each date, extract open, high, low, close.
        // ECharts expects candlestick data in the form: [open, close, low, high]
        const transformedData = sortedDates.map(date => {
          const dayData = timeSeries[date];
          const open = parseFloat(dayData['1. open']);
          const high = parseFloat(dayData['2. high']);
          const low = parseFloat(dayData['3. low']);
          const close = parseFloat(dayData['4. close']);
          return [open, close, low, high];
        });

        setDates(sortedDates);
        setCandlestickData(transformedData);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // ECharts option for a candlestick chart.
  const options = {
    title: {
      text: 'USD/EUR Candlestick Chart (Daily)',
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
    },
    yAxis: {
      scale: true,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: '#fff' } },
    },
    series: [
      {
        name: 'USD/EUR',
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
      bottom: '15%',
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

  if (loading) return <div style={{ color: '#fff' }}>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ backgroundColor: '#222', padding: '1rem', minHeight: '100vh' }}>
      <ReactECharts option={options} style={{ height: '600px', width: '100%' }} />
    </div>
  );
};

export default LiveCurrencies;
