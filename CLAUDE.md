# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pocket Pitch is a React app with Express backend that generates tailored business pitches using AI services. The application allows users to input service provider and target customer information, then generates business insights by combining web search results (Tavily API) with AI-generated analysis (Perplexity API).

## Development Commands

### Development
- `npm run dev` - Start React development server (port 3000)
- `npm run build` - Build React app for production
- `npm start` - Start Express server serving built React app (port 3000)

### Deployment (Vercel)
- `npm run vercel-build` - Build command for Vercel deployment
- Vercel configuration in `vercel.json` handles API routes and static file serving
- Environment variables needed: `TAVILY_API_KEY`, `PERPLEXITY_API_KEY`


## Architecture

### Frontend (React)
- **Entry point**: `src/index.js` - Standard React app bootstrap
- **Main component**: `src/App.js` - Simple wrapper around CompanyInfoGenerator
- **Core component**: `src/components/CompanyInfoGenerator.js` - Main UI component handling form inputs, API calls, and results display
- **Styling**: TailwindCSS with custom configuration in `tailwind.config.js`, includes typography plugin

### Backend (Express)
- **Entry point**: `server/server.js` - Express server with CORS, static file serving, and API routes
- **API routes**: `server/routes/generate-info.js` - Handles POST requests to `/api/generate-info`
- **API flow**:
  1. Receives service provider, target customer, and context data
  2. Makes web search request to Tavily API
  3. Sends search results + user input to Perplexity AI API
  4. Converts markdown response to HTML using Remarkable
  5. Returns formatted HTML to frontend

### Data Flow
1. User fills form with service provider info, target customer info, and context
2. Frontend sends POST to `/api/generate-info`
3. Backend searches web with Tavily API using company names + context
4. Backend sends search results to Perplexity AI for business insight generation
5. Perplexity returns markdown content which is converted to HTML
6. Frontend displays formatted business pitch in prose styling

## Key Dependencies
- **Frontend**: React 17, TailwindCSS, axios for API calls
- **Backend**: Express, cors, dotenv, axios for external APIs, Remarkable for markdown processing
- **External APIs**: Tavily (web search), Perplexity AI (content generation)

## Deployment Notes
- Configured for Vercel deployment with `vercel.json`
- API routes (`/api/*`) are handled by Express server (`server/server.js`)
- Static files are served from `/build` directory
- Frontend routing is handled by React (catch-all route in `vercel.json`)
- Environment variables must be configured in Vercel dashboard
- Error handling includes API key status in error responses
- Uses Perplexity Sonar model for AI-powered pitch generation
- Tested with Playwright E2E test suite