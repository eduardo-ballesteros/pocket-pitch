const express = require('express');
const axios = require('axios');
const { Remarkable } = require('remarkable');

const router = express.Router();

router.post('/generate-info', async (req, res) => {
  const { serviceProvider, targetCustomer, context } = req.body;

  try {
    // Tavily API call
    const tavilyResponse = await axios.post('https://api.tavily.com/search', {
      query: `${serviceProvider.name} and ${targetCustomer.name} ${context}`,
      api_key: process.env.TAVILY_API_KEY,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.TAVILY_API_KEY
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
          content: `Generate a business insight report for ${serviceProvider.name} (${serviceProvider.url}) targeting ${targetCustomer.name} (${targetCustomer.url}). 
                    Additional Context: ${context}
                    Use this additional information: ${JSON.stringify(tavilyResponse.data)}`,
        },
      ],
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
    });

    const markdown = perplexityResponse.data.choices[0].message.content;
    const html = convertMarkdownToHTML(markdown);

    res.json({ result: html });
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message,
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY
    });
  }
});

function convertMarkdownToHTML(markdown) {
  const md = new Remarkable();
  return md.render(markdown);
}

module.exports = router;