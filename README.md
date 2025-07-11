# Quant Sentiment: Real-Time Financial News Analysis and Trading Signal Platform

[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Framework](https://img.shields.io/badge/framework-FastAPI-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

A high-performance, real-time platform designed to aggregate financial news, perform advanced sentiment analysis using a fine-tuned Transformer model, and generate actionable trading signals for major stock symbols.

**Live Demo:** [https://market-sentiment-frontend.onrender.com/](https://market-sentiment-frontend.onrender.com/)



## Core Features

* **Real-Time Data Pipeline:** Aggregates news from dozens of RSS feeds every 5 minutes using an asynchronous, non-blocking architecture.
* **Advanced NLP Analysis:** Utilizes a `DistilRoBERTa` model specifically fine-tuned for financial news to achieve high-accuracy sentiment classification (Positive, Negative, Neutral).
* **Confidence-Weighted Sentiment Scoring:** Generates a sophisticated aggregate sentiment score for each stock by weighting individual news article sentiments by the model's confidence level.
* **Live Trading Signals:** Translates aggregated sentiment data into actionable `BUY`, `SELL`, or `HOLD` signals.
* **WebSocket Streaming:** Pushes news, sentiment scores, and trading signals to all connected clients in real-time using a robust WebSocket manager with a server-side heartbeat.
* **Asynchronous FastAPI Backend:** Built on a modern, high-performance web framework for scalability and speed.

## System Architecture

The platform is designed with a scalable, event-driven architecture to ensure low-latency data processing and delivery.

```
+----------------+      +-----------------------+      +-----------------+
|  RSS Feeds     |----->|  Async News Fetcher   |----->|  NLP Sentiment  |
| (Yahoo, etc.)  |      |  (aiohttp)            |      |  Pipeline       |
+----------------+      +-----------------------+      |  (Transformers) |
                                                       +--------+--------+
                                                                |
                                                                v
+----------------+      +-----------------------+      +-----------------+
|  React Frontend|<-+    |  FastAPI Backend      |      |  Sentiment      |
|  (Live Charts) |  |    |  (WebSocket Manager)  |<-----|  Aggregator     |
+----------------+  +--->|                       |      |  (Weighted Avg) |
                      (WebSocket)                    +-----------------+
```

## Technology Stack

* **Backend:** Python 3.9+, FastAPI, Uvicorn
* **Frontend:** React
* **NLP:** Hugging Face Transformers (`mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis`)
* **Asynchronous Networking:** `aiohttp` for fetching, `websockets` for real-time communication
* **Data Parsing:** `feedparser`
* **Frontend:** React, Real-time charting libraries

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/PavanKishore21/quant-sentiment.git](https://github.com/PavanKishore21/quant-sentiment.git)
    cd quant-sentiment
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    The first time you run this, the Transformers library will download the sentiment model (approx. 300-400MB).
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: You will need to create a `requirements.txt` file by running `pip freeze > requirements.txt` in your local environment.)*

4.  **Run the application:**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The API will be available at `http://localhost:8000`.

## API Endpoints

* `GET /`: Root endpoint with a status message.
* `GET /health`: Health check for monitoring.
* `GET /news`: Returns the 20 most recent news items.
* `GET /sentiment/{symbol}`: Returns the sentiment history for a given stock symbol.
* `GET /sentiment`: Returns the latest sentiment data for all tracked symbols.
* `WS /ws`: The main WebSocket endpoint for real-time data streaming.

## Future Improvements

* **Data Persistence:** Integrate a time-series database (like InfluxDB or Redis) to persist sentiment scores and news data, allowing for richer historical analysis.
* **Backtesting Module:** Develop a backtesting framework to evaluate the performance of the generated trading signals against historical price data (calculating P&L, Sharpe Ratio, etc.).
