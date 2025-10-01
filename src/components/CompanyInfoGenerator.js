import React, { useState } from 'react';

const Header = () => (
  <header className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 shadow-md">
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold">Pocket Pitch</h1>
      <p className="text-sm">Generate tailored business insights instantly</p>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-800 text-white p-4 mt-8">
    <div className="container mx-auto text-center">
      <p>&copy; 2024 Pocket Pitch. All rights reserved.</p>
    </div>
  </footer>
);

const CompanyInfoGenerator = () => {
  const [serviceProviderName, setServiceProviderName] = useState('');
  const [serviceProviderUrl, setServiceProviderUrl] = useState('');
  const [targetCustomerName, setTargetCustomerName] = useState('');
  const [targetCustomerUrl, setTargetCustomerUrl] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  const isDebugMode = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true';
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setResult('');
    setDebugInfo(null);

    try {
      const response = await fetch('/api/generate-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceProvider: { name: serviceProviderName, url: serviceProviderUrl },
          targetCustomer: { name: targetCustomerName, url: targetCustomerUrl },
          context,
          debug: isDebugMode()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate information');
      }

      const data = await response.json();
      setResult(data.result);
      if (data.debug) {
        setDebugInfo(data.debug);
      }
    } catch (err) {
      setError('An error occurred while generating the information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Service Provider</h2>
              <input
                type="text"
                placeholder="Service Provider Name"
                value={serviceProviderName}
                onChange={(e) => setServiceProviderName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="url"
                placeholder="Service Provider URL"
                value={serviceProviderUrl}
                onChange={(e) => setServiceProviderUrl(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Target Customer</h2>
              <input
                type="text"
                placeholder="Target Customer Name"
                value={targetCustomerName}
                onChange={(e) => setTargetCustomerName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="url"
                placeholder="Target Customer URL"
                value={targetCustomerUrl}
                onChange={(e) => setTargetCustomerUrl(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Context</h2>
              <textarea
                placeholder="Enter additional context or information"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full p-2 border rounded h-32"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : 'Generate Pitch'}
            </button>
          </div>
          {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
          {result && (
            <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Generated Pitch</h3>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: result }} />
            </div>
          )}
          {debugInfo && (
            <div className="mt-8 p-6 bg-gray-100 shadow-lg rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-red-600">Debug Information</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Request Data</h4>
                  <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(debugInfo.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Tavily API</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">Request:</p>
                      <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                        {JSON.stringify(debugInfo.tavily.request, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium">Response:</p>
                      <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                        {JSON.stringify(debugInfo.tavily.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-2">Perplexity API</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="font-medium">Request:</p>
                      <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                        {JSON.stringify(debugInfo.perplexity.request, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium">Response:</p>
                      <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                        {JSON.stringify(debugInfo.perplexity.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                {debugInfo.error && (
                  <div>
                    <h4 className="font-semibold text-lg mb-2 text-red-600">Error Details</h4>
                    <pre className="bg-white p-4 rounded overflow-x-auto text-xs text-red-600">
                      {JSON.stringify(debugInfo.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyInfoGenerator;