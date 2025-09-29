const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const results = {};

  // Test Tavily API
  try {
    const tavilyResponse = await axios.post('https://api.tavily.com/search', {
      api_key: process.env.TAVILY_API_KEY,
      query: 'test query',
      search_depth: 'basic',
      max_results: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    results.tavily = {
      status: 'success',
      response_status: tavilyResponse.status
    };
  } catch (error) {
    results.tavily = {
      status: 'error',
      error: error.response ? error.response.status + ': ' + error.response.data : error.message
    };
  }

  // Test Perplexity API
  try {
    const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: 'Say hello'
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      }
    });
    results.perplexity = {
      status: 'success',
      response_status: perplexityResponse.status
    };
  } catch (error) {
    results.perplexity = {
      status: 'error',
      error: error.response ? error.response.status + ': ' + JSON.stringify(error.response.data) : error.message
    };
  }

  res.status(200).json({
    test_results: results,
    env_vars: {
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY,
      tavily_key_preview: process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.substring(0, 8) + '...' : 'not set',
      perplexity_key_preview: process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.substring(0, 8) + '...' : 'not set'
    }
  });
};