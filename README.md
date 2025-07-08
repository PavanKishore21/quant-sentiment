# Market Sentiment Analysis Dashboard

Real-time sentiment analysis of financial news with trading signals.

![Dashboard Preview](https://example.com/path/to/screenshot.png) <!-- Add actual screenshot later -->

## Features

- Real-time news aggregation from financial sources
- AI-powered sentiment analysis using FinBERT
- WebSocket-based live updates
- Interactive dashboard with charts
- Trading signal generation (BUY/SELL/HOLD)

## Setup for Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload