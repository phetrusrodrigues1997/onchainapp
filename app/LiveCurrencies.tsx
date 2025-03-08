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
    <div className="bg-[#080330] text-white p-4 max-w-full mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Currency Exchange Rates (USD)</h2>
      <p className="mb-6 text-center">Last updated: {lastUpdated}</p>
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-700 w-[275%] ml-[-87.5%]">
        {/* Header Row */}
        <div className="grid grid-cols-6 bg-white text-black font-semibold">
          <div className="p-4 text-center">Currency</div>
          <div className="p-4 text-center">Rate (per USD)</div>
          <div className="p-4 text-center">Country</div>
          <div className="p-4 text-center">1D %</div>
          <div className="p-4 text-center">7D %</div>
          <div className="p-4 text-center">1M %</div>
        </div>

        {/* Currency Rows */}
        <div className="divide-y divide-gray-700">
          {currencyData.map(({ code, country, symbol }) => (
            <div key={code} className="grid grid-cols-6 hover:bg-gray-950 transition-colors">
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
            placeholder="Search currency or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-950 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </div>

        {/* Filtered Currency Cards */}
        <div className="space-y-3">
          {filteredCurrencyData.length > 0 ? (
            filteredCurrencyData.map(({ code, country, symbol }) => (
              <div key={code} className="bg-gray-950 rounded-lg p-3 border border-gray-700">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-semibold">Currency:</div>
                  <div>{code} {symbol || ''}</div> {/* Display symbol if available */}
                  <div className="font-semibold">Rate (USD):</div>
                  <div>{exchangeData.rates[code]?.toFixed(2) || 'N/A'}</div>
                  <div className="font-semibold">Country:</div>
                  <div>{country}</div>
                  <div className="font-semibold">1D %:</div>
                  <div>—</div>
                  <div className="font-semibold">7D %:</div>
                  <div>—</div>
                  <div className="font-semibold">1M %:</div>
                  <div>—</div>
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