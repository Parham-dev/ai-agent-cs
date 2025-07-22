#!/usr/bin/env python3
"""
Simple FastAPI MCP Server Example
Run with: python examples/simple-mcp-server.py
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime
import random

app = FastAPI(title="Simple MCP Server", version="1.0.0")

# Simple tools for testing
@app.get("/")
async def root():
    return {"message": "Simple MCP Server is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/random-fact")
async def get_random_fact():
    facts = [
        "The MCP protocol was designed to standardize AI tool integration",
        "Octopuses have three hearts and blue blood",
        "Honey never spoils - archaeologists have found edible honey in Egyptian tombs",
        "A group of flamingos is called a 'flamboyance'",
        "The shortest war in history lasted only 38-45 minutes"
    ]
    return {
        "fact": random.choice(facts),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/time")
async def get_current_time():
    return {
        "current_time": datetime.now().isoformat(),
        "timezone": "UTC",
        "unix_timestamp": datetime.now().timestamp()
    }

@app.post("/echo")
async def echo_message(data: dict):
    return {
        "echoed": data,
        "timestamp": datetime.now().isoformat(),
        "message": "Echo successful"
    }

# MCP endpoint (simplified)
@app.post("/mcp")
async def mcp_endpoint():
    return {
        "tools": [
            {
                "name": "get_random_fact",
                "description": "Get a random interesting fact",
                "url": "/random-fact",
                "method": "GET"
            },
            {
                "name": "get_current_time", 
                "description": "Get the current time",
                "url": "/time",
                "method": "GET"
            },
            {
                "name": "health_check",
                "description": "Check server health status",
                "url": "/health", 
                "method": "GET"
            }
        ],
        "server_info": {
            "name": "Simple MCP Server",
            "version": "1.0.0",
            "description": "A simple MCP server for testing"
        }
    }

if __name__ == "__main__":
    print("🚀 Starting Simple MCP Server on http://localhost:8000")
    print("🔗 MCP Endpoint: http://localhost:8000/mcp")
    print("📊 Health Check: http://localhost:8000/health")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")