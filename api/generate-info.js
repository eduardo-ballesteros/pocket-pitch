const axios = require('axios');
const Remarkable = require('remarkable');

module.exports = async (req, res) => {
  console.log('[generate-info] Request received:', req.method);

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
    const { serviceProvider, targetCustomer, context, debug } = req.body;

    // Support both old and new format
    const serviceProviderName = (serviceProvider && serviceProvider.name) || req.body.serviceProviderName;
    const serviceProviderUrl = (serviceProvider && serviceProvider.url) || req.body.serviceProviderUrl;
    const targetCustomerName = (targetCustomer && targetCustomer.name) || req.body.targetCustomerName;
    const targetCustomerUrl = (targetCustomer && targetCustomer.url) || req.body.targetCustomerUrl;

    const debugInfo = debug ? {
      request: { serviceProvider: { name: serviceProviderName, url: serviceProviderUrl }, targetCustomer: { name: targetCustomerName, url: targetCustomerUrl }, context },
      tavily: {},
      perplexity: {}
    } : null;

    console.log('[generate-info] Request body received:', {
      serviceProviderName,
      targetCustomerName,
      contextLength: context ? context.length : 0
    });

    // Log environment variable status
    const tavilyKey = process.env.TAVILY_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    console.log('[generate-info] Environment variables check:', {
      TAVILY_KEY_EXISTS: !!tavilyKey,
      TAVILY_KEY_LENGTH: tavilyKey ? tavilyKey.length : 0,
      TAVILY_KEY_STARTS: tavilyKey ? tavilyKey.substring(0, 8) : 'undefined',
      TAVILY_KEY_TYPE: typeof tavilyKey,
      TAVILY_KEY_HAS_QUOTES: tavilyKey ? (tavilyKey.includes('"') || tavilyKey.includes("'")) : false,
      PERPLEXITY_KEY_EXISTS: !!perplexityKey,
      PERPLEXITY_KEY_LENGTH: perplexityKey ? perplexityKey.length : 0,
      PERPLEXITY_KEY_STARTS: perplexityKey ? perplexityKey.substring(0, 8) : 'undefined',
      PERPLEXITY_KEY_TYPE: typeof perplexityKey,
      PERPLEXITY_KEY_HAS_QUOTES: perplexityKey ? (perplexityKey.includes('"') || perplexityKey.includes("'")) : false,
      PERPLEXITY_KEY_HAS_SPECIAL: perplexityKey ? /[^\x20-\x7E]/.test(perplexityKey) : false
    });

    // Clean the keys
    const cleanTavilyKey = tavilyKey ? tavilyKey.replace(/['"]/g, '').trim() : '';
    const cleanPerplexityKey = perplexityKey ? perplexityKey.replace(/['"]/g, '').trim() : '';

    console.log('[generate-info] Cleaned keys:', {
      TAVILY_CLEANED_LENGTH: cleanTavilyKey.length,
      PERPLEXITY_CLEANED_LENGTH: cleanPerplexityKey.length
    });

    // Tavily API search
    console.log('[generate-info] Making Tavily API request...');
    const searchQuery = `${serviceProviderName} ${targetCustomerName} ${context}`;

    let tavilyResponse;
    try {
      if (debug) {
        debugInfo.tavily.request = { query: searchQuery };
      }

      tavilyResponse = await axios.post('https://api.tavily.com/search', {
        api_key: cleanTavilyKey,
        query: searchQuery,
        search_depth: 'basic',
        max_results: 5
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('[generate-info] Tavily API success, results:', tavilyResponse.data.results ? tavilyResponse.data.results.length : 0);

      if (debug) {
        debugInfo.tavily.response = {
          status: tavilyResponse.status,
          data: tavilyResponse.data
        };
      }
    } catch (tavilyError) {
      console.error('[generate-info] Tavily API error:', {
        status: tavilyError.response ? tavilyError.response.status : 'no response',
        statusText: tavilyError.response ? tavilyError.response.statusText : 'no response',
        data: tavilyError.response ? JSON.stringify(tavilyError.response.data) : 'no data',
        message: tavilyError.message
      });
      throw new Error(`Tavily API failed: ${tavilyError.response ? tavilyError.response.status : tavilyError.message}`);
    }

    // Perplexity API call
    console.log('[generate-info] Making Perplexity API request...');

    // Build Authorization header carefully
    const authHeader = `Bearer ${cleanPerplexityKey}`;
    console.log('[generate-info] Auth header length:', authHeader.length);
    console.log('[generate-info] Auth header has special chars:', /[^\x20-\x7E]/.test(authHeader));

    let perplexityResponse;
    try {
      const perplexityRequestData = {
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
      };

      if (debug) {
        debugInfo.perplexity.request = perplexityRequestData;
      }

      perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', perplexityRequestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        }
      });

      console.log('[generate-info] Perplexity API success');

      if (debug) {
        debugInfo.perplexity.response = {
          status: perplexityResponse.status,
          data: perplexityResponse.data
        };
      }
    } catch (perplexityError) {
      console.error('[generate-info] Perplexity API error:', {
        status: perplexityError.response ? perplexityError.response.status : 'no response',
        statusText: perplexityError.response ? perplexityError.response.statusText : 'no response',
        data: perplexityError.response ? JSON.stringify(perplexityError.response.data) : 'no data',
        message: perplexityError.message,
        code: perplexityError.code
      });
      throw new Error(`Perplexity API failed: ${perplexityError.response ? perplexityError.response.status : perplexityError.message}`);
    }

    const markdown = perplexityResponse.data.choices[0].message.content;
    const md = new Remarkable.Remarkable();
    const htmlContent = md.render(markdown);

    console.log('[generate-info] Successfully generated response');

    const response = { result: htmlContent };
    if (debug) {
      response.debug = debugInfo;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('[generate-info] Final error handler:', error.message);

    if (debug && debugInfo) {
      debugInfo.error = {
        name: error.name,
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      };
    }

    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY,
      debug: debug ? debugInfo : undefined
    });
  }
};