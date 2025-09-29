module.exports = (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    method: req.method,
    env: {
      tavily_key_set: !!process.env.TAVILY_API_KEY,
      perplexity_key_set: !!process.env.PERPLEXITY_API_KEY,
      tavily_key_length: process.env.TAVILY_API_KEY ? process.env.TAVILY_API_KEY.length : 0,
      perplexity_key_length: process.env.PERPLEXITY_API_KEY ? process.env.PERPLEXITY_API_KEY.length : 0
    }
  });
};