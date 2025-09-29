const axios = require('axios');
const Remarkable = require('remarkable');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { serviceProviderName, serviceProviderUrl, targetCustomerName, targetCustomerUrl, context } = req.body;

    // Tavily API search
    const searchQuery = `${serviceProviderName} ${targetCustomerName} ${context}`;
    const tavilyResponse = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY.replace(/"/g, ''),
      query: searchQuery,
      search_depth: 'basic',
      max_results: 5
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Perplexity API call
    const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates business insights.',
        },
        {
          role: 'user',
          content: `Based on the following information, generate a comprehensive business pitch that ${serviceProviderName} can use to approach ${targetCustomerName}.

Service Provider: ${serviceProviderName} (${serviceProviderUrl})
Target Customer: ${targetCustomerName} (${targetCustomerUrl})
Context: ${context}

Search Results:
${JSON.stringify(tavilyResponse.data, null, 2)}

Please provide:
1. A brief overview of the target customer's business and needs
2. How the service provider's offerings align with these needs
3. Specific value propositions and benefits
4. Recommended approach and next steps

Format the response in clear, professional language that can be used in a business pitch.`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY.replace(/"/g, '')}`,
      }
    });

    const markdown = perplexityResponse.data.choices[0].message.content;
    const md = new Remarkable.Remarkable();
    const htmlContent = md.render(markdown);

    res.status(200).json({ result: htmlContent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY
    });
  }
};