# API Documentation

## Overview
This API provides endpoints for processing files, generating questions based on project transcripts, and handling chat sessions. It supports various file types and integrates with OpenAI for generating responses.

## Setting Up the API

### Prerequisites
- Python 3.7 or higher
- Conda (for environment management)
- MongoDB (for database)
- OpenAI API key
- AWS credentials (if using AWS Transcribe)

### Setting Up the Environment
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create a conda environment:
   ```bash
   conda env create --name uxr-api --file=environment.yml
   ```

3. Activate the conda environment:
   ```bash
   conda activate uxr-api
   ```

4. Set up environment variables in a `.env` file:
   ```plaintext
   OPENAI_API_KEY=<your_openai_api_key>
   MONGO_URL=<your_mongo_url>
   DB_NAME=<your_database_name>
   AWS_REGION=<your_aws_region>
   SARVAM_API_KEY=<your_sarvam_api_key>
   SARVAM_API_URL=<your_sarvam_api_url>
   CACHE_TIMER=<cache_timer_value>
   MAX_CHAT_HISTORY_SAVE_LENGTH=<max_chat_history_length>
   ```

### Running the API
To start the API, run the following command:
```bash
uvicorn api:app --reload
```
The API will be accessible at `http://127.0.0.1:8000`.

## Accessing Endpoints

### 1. Process File
**Endpoint:** `POST /process-file/`

**Input:**
```json
{
  "url": "http://example.com/path/to/file",
  "transcribe_method": "sarvam",
  "transcribe_lang": "en"
}
```

**Sample cURL Command:**
```bash
curl -X POST "http://127.0.0.1:8000/process-file/" -H "Content-Type: application/json" -d '{"url": "http://example.com/path/to/file", "transcribe_method": "sarvam", "transcribe_lang": "en"}'
```

**Sample JavaScript Fetch:**
```javascript
fetch("http://127.0.0.1:8000/process-file/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        url: "http://example.com/path/to/file",
        transcribe_method: "sarvam",
        transcribe_lang: "en"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 2. Generate Questions
**Endpoint:** `POST /generate-questions/`

**Input:**
```json
{
  "project_id": "your_project_id"
}
```

**Sample cURL Command:**
```bash
curl -X POST "http://127.0.0.1:8000/generate-questions/" -H "Content-Type: application/json" -d '{"project_id": "your_project_id"}'
```

**Sample JavaScript Fetch:**
```javascript
fetch("http://127.0.0.1:8000/generate-questions/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        project_id: "your_project_id"
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 3. Get Answer
**Endpoint:** `POST /get-answer/`

**Input:**
```json
{
  "project_id": "your_project_id",
  "question": "What is the main topic?",
  "top_n": 3
}
```

**Sample cURL Command:**
```bash
curl -X POST "http://127.0.0.1:8000/get-answer/" -H "Content-Type: application/json" -d '{"project_id": "your_project_id", "question": "What is the main topic?", "top_n": 3}'
```

**Sample JavaScript Fetch:**
```javascript
fetch("http://127.0.0.1:8000/get-answer/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        project_id: "your_project_id",
        question: "What is the main topic?",
        top_n: 3
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### 4. Chat
**Endpoint:** `POST /chat/`

**Input:**
```json
{
  "session_id": "your_session_id",
  "question": "Can you summarize the document?",
  "top_n": 3
}
```

**Sample cURL Command:**
```bash
curl -X POST "http://127.0.0.1:8000/chat/" -H "Content-Type: application/json" -d '{"session_id": "your_session_id", "question": "Can you summarize the document?", "top_n": 3}'
```

**Sample JavaScript Fetch:**
```javascript
fetch("http://127.0.0.1:8000/chat/", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        session_id: "your_session_id",
        question: "Can you summarize the document?",
        top_n: 3
    })
})
.then(response => response.text())
.then(data => console.log(data));
```

## Conclusion
This API provides a robust framework for processing files, generating questions, and handling chat sessions. Ensure that all environment variables are set correctly and that the necessary services (MongoDB, OpenAI, AWS) are accessible for optimal functionality.