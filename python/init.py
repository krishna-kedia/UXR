"""
This module initializes the necessary classes and configurations for the API, including database connections, 
OpenAI client setup, and application middleware. It also sets up caching mechanisms for chat sessions and transcripts.
"""

import os
from dotenv import load_dotenv
from collections import defaultdict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from openai import OpenAI
import boto3

load_dotenv()

def init_classes():
    """
    Initializes and returns the database client, OpenAI client, and FastAPI application instance.

    Returns:
        tuple: A tuple containing the database client, OpenAI client, and FastAPI app instance.

    Raises:
        RuntimeError: If required environment variables are missing.
    """
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MONGO_URL = os.getenv("MONGO_URL")
    DB_NAME = os.getenv("DB_NAME")
    if not OPENAI_API_KEY or not MONGO_URL or not DB_NAME:
        raise RuntimeError("Missing required environment variables")

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    openaiclient = OpenAI(api_key=OPENAI_API_KEY) 
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    s3 = boto3.client("s3")
    return db, openaiclient, app, s3


def init_cache():
    """
    Initializes and returns the cache settings for chat history and transcripts.

    Returns:
        tuple: A tuple containing the maximum chat history save length and two defaultdicts for session and transcript caches.
    """
    MAX_CHAT_HISTORY_SAVE_LENGTH = int(os.getenv('MAX_CHAT_HISTORY_SAVE_LENGTH'))
    return MAX_CHAT_HISTORY_SAVE_LENGTH, defaultdict(dict), defaultdict(dict)
