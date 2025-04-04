import React, { useState, useEffect } from 'react';

interface ExchangeData {
  rates: { [key: string]: number };
  timestamp: number;
}

const CurrencyDisplay: React.FC = () => {
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search input

  // Define the currencies and their corresponding countries
  const currencyData = [
    { code: 'JPY', country: 'Japan', symbol: '¥' },
    { code: 'GBP', country: 'United Kingdom', symbol: '£' },
    { code: 'EUR', country: 'Eurozone', symbol: '€' },
    { code: 'BRL', country: 'Brazil', symbol: 'R$' },
    { code: 'CAD', country: 'Canada', symbol: 'CA$' },
    { code: 'AUD', country: 'Australia', symbol: 'A$' },
    { code: 'CHF', country: 'Switzerland' },
    { code: 'CNY', country: 'China', symbol: '¥' },
    { code: 'HKD', country: 'Hong Kong', symbol: 'HK$' },
    { code: 'INR', country: 'India', symbol: '₹' },
    { code: 'KRW', country: 'South Korea', symbol: '₩' },
    { code: 'MXN', country: 'Mexico', symbol: 'Mex$' },
    { code: 'RUB', country: 'Russia', symbol: '₽' },
    { code: 'ZAR', country: 'South Africa', symbol: 'R' },
    {code:'TRY', country:'Turkey', symbol:'₺'},
    {code:'SEK', country:'Sweden', symbol:'kr'}
  ];

  // Fetch exchange rates when the component mounts
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          'https://openexchangerates.org/api/latest.json?app_id=0967db9a52b54cf096af2d64888fe9a0'
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setExchangeData({ rates: data.rates, timestamp: data.timestamp });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        setError('Failed to fetch exchange rates');
        setIsLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Handle loading state
  if (isLoading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  // Handle error state
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  // Ensure data exists before rendering
  if (!exchangeData) {
    return <div className="text-white text-center">No data available</div>;
  }

  // Convert timestamp to readable format
  const lastUpdated = new Date(exchangeData.timestamp * 1000).toLocaleString();

  // Filter currency data based on search term
  const filteredCurrencyData = currencyData.filter((currency) =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#012512] text-white p-4 max-w-full mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Currency Exchange Rates (USD)</h2>
      <p className="mb-6 text-center">Last updated: {lastUpdated}</p>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-700 w-[275%] ml-[-87.5%]">
        {/* Header Row */}
        <div className="grid grid-cols-6 bg-white text-black font-semibold">
          <div className="p-4 text-center">Currency</div>
          <div className="p-4 text-center">Price (USD)</div>
          <div className="p-4 text-center">Country</div>
          <div className="p-4 text-center">1D %</div>
          <div className="p-4 text-center">7D %</div>
          <div className="p-4 text-center">1M %</div>
        </div>

        {/* Currency Rows */}
        <div className="divide-y divide-gray-700">
          {currencyData.map(({ code, country, symbol }) => (
            <div key={code} className="grid grid-cols-6 hover:bg-[#0e0e1f] transition-colors">
              <div className="p-4 text-center">{code} {symbol || ''}</div> {/* Display symbol if available */}
              <div className="p-4 text-center">{exchangeData.rates[code]?.toFixed(2) || 'N/A'}</div>
              <div className="p-4 text-center">{country}</div>
              <div className="p-4 text-center">—</div>
              <div className="p-4 text-center">—</div>
              <div className="p-4 text-center">—</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards with Search Bar */}
      <div className="md:hidden">
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by acronym or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-[#0e0e1f] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {/* Filtered Currency Cards */}
        <div className="space-y-3">
          {filteredCurrencyData.length > 0 ? (
            filteredCurrencyData.map(({ code, country, symbol }) => (
              <div key={code} className="bg-[#eeeeff] rounded-lg p-3 border border-gray-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold text-black">Currency:</div>
                  <div className='text-black'>{code} {symbol || ''}</div> {/* Display symbol if available */}
                  <div className="font-semibold text-black">Rate (USD):</div>
                  <div className='text-black'>{exchangeData.rates[code]?.toFixed(2) || 'N/A'}</div>
                  <div className="font-semibold text-black">Country:</div>
                  <div className='text-black'>{country}</div>
                  <div className="font-semibold text-black">1D %:</div>
                  <div className='text-black'>—</div>
                  <div className="font-semibold text-black">7D %:</div>
                  <div className='text-black'>—</div>
                  <div className="font-semibold text-black">1M %:</div>
                  <div className='text-black'>—</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">No matching currencies found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyDisplay;