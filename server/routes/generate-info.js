const express = require('express');
const axios = require('axios');
const { Remarkable } = require('remarkable');

const router = express.Router();

router.post('/generate-info', async (req, res) => {
  const { serviceProvider, targetCustomer, context, debug } = req.body;

  console.log('=== API Request Started ===');
  console.log('Request body:', JSON.stringify({ serviceProvider, targetCustomer, context, debug }, null, 2));
  console.log('Environment check:', {
    tavily_key_present: !!process.env.TAVILY_API_KEY,
    tavily_key_length: process.env.TAVILY_API_KEY?.length,
    perplexity_key_present: !!process.env.PERPLEXITY_API_KEY,
    perplexity_key_length: process.env.PERPLEXITY_API_KEY?.length
  });

  const debugInfo = debug ? {
    request: { serviceProvider, targetCustomer, context },
    tavily: {},
    perplexity: {}
  } : null;

  try {
    // Tavily API call
    console.log('=== Calling Tavily API ===');
    const tavilyQuery = `${serviceProvider.name} and ${targetCustomer.name} ${context}`;
    console.log('Tavily query:', tavilyQuery);

    const tavilyRequestData = {
      query: tavilyQuery,
      api_key: process.env.TAVILY_API_KEY,
    };

    if (debug) {
      debugInfo.tavily.request = { query: tavilyQuery };
    }

    const tavilyResponse = await axios.post('https://api.tavily.com/search', tavilyRequestData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.TAVILY_API_KEY
      }
    });

    console.log('Tavily response status:', tavilyResponse.status);
    console.log('Tavily response data:', JSON.stringify(tavilyResponse.data, null, 2));

    if (debug) {
      debugInfo.tavily.response = {
        status: tavilyResponse.status,
        data: tavilyResponse.data
      };
    }

    // Perplexity API call
    console.log('=== Calling Perplexity API ===');
    const perplexityPrompt = `Generate a business insight report for ${serviceProvider.name} (${serviceProvider.url}) targeting ${targetCustomer.name} (${targetCustomer.url}).
                    Additional Context: ${context}
                    Use this additional information: ${JSON.stringify(tavilyResponse.data)}`;
    console.log('Perplexity prompt:', perplexityPrompt);

    const perplexityRequestData = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates business insights.',
        },
        {
          role: 'user',
          content: perplexityPrompt,
        },
      ],
    };

    if (debug) {
      debugInfo.perplexity.request = perplexityRequestData;
    }

    const perplexityResponse = await axios.post('https://api.perplexity.ai/chat/completions', perplexityRequestData, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Perplexity response status:', perplexityResponse.status);
    console.log('Perplexity response data:', JSON.stringify(perplexityResponse.data, null, 2));

    if (debug) {
      debugInfo.perplexity.response = {
        status: perplexityResponse.status,
        data: perplexityResponse.data
      };
    }

    const markdown = perplexityResponse.data.choices[0].message.content;
    console.log('Extracted markdown:', markdown);

    const html = convertMarkdownToHTML(markdown);
    console.log('Converted HTML length:', html.length);

    console.log('=== API Request Completed Successfully ===');

    const response = { result: html };
    if (debug) {
      response.debug = debugInfo;
    }

    res.json(response);
  } catch (error) {
    console.error('=== API Request Failed ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    }

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
      error_details: error.response?.data,
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY,
      debug: debug ? debugInfo : undefined
    });
  }
});

function convertMarkdownToHTML(markdown) {
  const md = new Remarkable();
  return md.render(markdown);
}

module.exports = router;