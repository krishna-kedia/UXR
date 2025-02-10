"""
API for processing files, generating questions, and handling chat sessions.

This module provides endpoints for processing various file types, generating questions based on project transcripts, 
getting answers to questions, and handling chat sessions with context from transcripts or projects.

Modules:
    - process_file: Process a file by extracting its transcript.
    - generate_questions: Generate questions based on project transcripts.
    - get_answer: Get an answer to a question based on project transcripts.
    - get_single_answer: Get an answer to a question based on a single transcript.
    - get_all_answer_single_transcript_grid: Get answers to multiple questions based on a single transcript in a grid format.
    - chat: Handle a chat session by generating responses based on chat history and context.

Error Codes:
    700: Cannot find project ID.
    701: No transcripts found for the project.
    702: Error finding transcript.
    703: Error processing transcript.
    704: No valid content found in transcripts.
    705: Cannot find Transcript ID.
    706: Transcript text is empty.
    707: Cannot find session ID.
    300: Failed to extract text from PDF.
    301: Failed to extract text from DOCX.
    302: Failed to read TXT file.
    303: Failed to extract audio from video.
    304: Diarized transcript not found in the API response.
    305: Failed to transcribe audio.
    306: Unsupported file type.
    400: Failed to generate questions from LLM.
    401: Failed to generate answers from LLM.
    402: Failed to generate answers from LLM in chat.
    403: Failed to stream chat.
    600: Couldn't download file from S3 link.
    601: Failed to start transcription job.
    602: Transcription job failed.
    603: HTTP error occurred.
"""

import os
import threading
import uuid

from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime, timedelta

from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from utils import *
from init import *
load_dotenv()

db, client, app, s3 = init_classes()
MAX_CHAT_HISTORY_SAVE_LENGTH, CHAT_SESSION_CACHE_DICT, CHAT_TRANSCRIPT_CACHE_DICT = init_cache()

cleanup_thread = threading.Thread(target=cleanup_cache, args=(CHAT_SESSION_CACHE_DICT, CHAT_TRANSCRIPT_CACHE_DICT), daemon=True)
cleanup_thread.start()

@app.post("/upload-s3file-to-s3bucket/{session_id}")
async def upload_s3file_to_s3bucket(session_id: str, request: s3Upload):
    TEMP_DIR = './temp/'
    S3_BUCKET = 'papyrus-ml-mvp1-uxr'
    os.makedirs(TEMP_DIR, exist_ok=True)

    file_extension = str(request.bot_url).split("?")[0].split(".")[-1].lower()

    if os.path.splitext(request.s3_file_path)[1] != '' and file_extension in ["mp3", "mp4", "wav"]:

        unique_id = uuid.uuid4().hex
        local_filename = os.path.basename(request.bot_url.split("?")[0])
        local_file_path = os.path.join(TEMP_DIR, f"{unique_id}_{local_filename}")

        try:
            response = requests.get(request.bot_url, stream=True)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=501,
                    detail="Failed to download file from presigned URL",
                )

            with open(local_file_path, "wb") as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)

            with open(local_file_path, "rb") as file:
                s3.upload_fileobj(file, S3_BUCKET, request.s3_file_path)
        except Exception as e:
            raise HTTPException(status_code=501, detail=f"Error processing bot url to s3 with message: {str(e)}")
        finally:
            if os.path.exists(local_file_path):
                os.remove(local_file_path)
        s3_path = f"s3://{S3_BUCKET}/{request.s3_file_path}"
        return s3_path
    else:
        raise HTTPException(
                status_code=306,
                detail="Unsupported file type or s3 save path is not a file path",
            )

@app.post("/transcribe-file/{transcript_id}")
async def process_file(transcript_id: str, request: transcribeCall):
    """
    Process a file by extracting its transcript based on the file type and method specified in the request.

    Args:
        request (FileProcessing): The request object containing the file URL, method, and transcription language.

    Returns:
        dict: A dictionary containing the extracted transcript.

    Raises:
        HTTPException: If the file type is unsupported or if there is an error during transcription.
    """
    allowed_types = ["mp3", "mp4", "wav", "pdf", "docx", "txt"]
    file_extension = str(request.url).split(".")[-1].lower()
    if file_extension not in allowed_types:
        raise HTTPException(status_code=306, detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}")
    
    if file_extension in ["mp3", "mp4", "wav"] and request.transcribe_method == 'aws':
        transcript = transcribe_aws(request.url, file_extension, request.transcribe_lang, request.transcribe_speaker_number)
    else:
        temp_file_path = s3_to_temp(request.url)
        if file_extension == "pdf":
            transcript = extract_text_from_pdf(temp_file_path)
        elif file_extension == "docx":
            transcript = extract_text_from_docx(temp_file_path)
        elif file_extension == "txt":
            transcript = extract_text_from_txt(temp_file_path)
        elif file_extension in ['mp4', "mp3", "wav"]:
            transcript = transcribe_audio_sarvam(temp_file_path, file_extension, request.transcribe_lang)
    
    return {"transcript": transcript}

@app.post("/generate-transcript-questions/{transcript_id}")
async def generate_transcript_questions(transcript_id: str):
    try:
        transcript = db.transcripts.find_one({"_id": ObjectId(transcript_id)})
    except Exception as e:
        raise HTTPException(status_code=705, detail=f"Cannot find transcript ID: {transcript_id}")
    
    try:
        transcript = transcript.get("text")
    except Exception as e:
        raise HTTPException(status_code=706, detail=f"Transcript ID: {transcript_id} Empty")
    
    try:
        transcript = transcript.replace('"', '\"').replace("'", "\'")
        prompt = f"Question to be answered: {os.getenv('QUESTION_PROMPT')} \n\n Answer Format Rules: {os.getenv('QUESTION_PROMPT_FORMAT')} \n\n Transcript as context: {transcript}"

        response = client.chat.completions.create(
            model=os.getenv("QUESTION_MODEL"),
            messages=[{"role": os.getenv("QUESTION_PROMPT_ROLE"), "content": prompt}],
            max_tokens=int(os.getenv("QUESTION_MAX_TOKENS")),
            n=1
        )
        generated_questions = eval(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate questions from LLM with error: {e}")
    return {'questions': generated_questions}

@app.post("/generate-questions/{project_id}")
async def generate_questions(project_id:str, request: generateQuestions):
    """
    Generate questions based on the transcripts associated with a project.

    Args:
        request (ProjectIDRequest): The request object containing the project ID.

    Returns:
        dict: A dictionary containing the generated questions.

    Raises:
        HTTPException: If there is an error finding the project, transcripts, or generating questions.
    """
    try:
        project = db.projects.find_one({"_id": ObjectId(project_id)})
    except Exception as e:
        raise HTTPException(status_code=700, detail=f"Cannot find project ID: {project_id}")

    try:
        transcript_ids = project.get("transcripts", [])
    except Exception as e:
        raise HTTPException(status_code=701, detail="No transcripts found for the project")

    all_transcripts_questions = ""
    for i, transcript_id in enumerate(transcript_ids):
        try:
            transcript = db.transcripts.find_one({"_id": ObjectId(transcript_id)})
        except Exception as e:
            raise HTTPException(status_code=702, detail=f"Error finding transcript {transcript_id}: {str(e)}")
        
        try:
            file_ques = transcript.get("questions")
            all_transcripts_questions += f"Transcript {i} \n Questions asked in transcript: {file_ques})\n\n"
        except Exception as e:
            raise HTTPException(status_code=703, detail=f"Error processing transcript {transcript_id}: {str(e)}")

    if not all_transcripts_questions:
        raise HTTPException(status_code=704, detail="No valid content found in transcripts") 
    
    try:
        prompt = "\n\n".join([os.getenv("QUESTION_AGG_PROMPT").replace('<n>', str(request.num_q)), os.getenv("QUESTION_AGG_PROMPT_FORMAT"), all_transcripts_questions])
        response = client.chat.completions.create(
            model=os.getenv("QUESTION_AGG_MODEL"),
            messages=[{"role": os.getenv("QUESTION_AGG_PROMPT_ROLE"), "content": prompt}],
            max_tokens=int(os.getenv("QUESTION_AGG_MAX_TOKENS")),
            n=1
        )
        generated_questions = eval(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate questions from LLM with error: {e}")
    return generated_questions

@app.post("/get-all-answer-single-transcript-grid/{transcript_id}")
async def get_answer(transcript_id:str, request: QuestionSingleRequestGrid):
    """
    Get answers to multiple questions based on a single transcript in a grid format.

    Args:
        request (QuestionSingleRequestGrid): The request object containing the transcript ID and questions.

    Returns:
        dict: A dictionary containing the answers.

    Raises:
        HTTPException: If there is an error finding the transcript or generating the answers.
    """
    try:
        transcript = db.transcripts.find_one({"_id": ObjectId(transcript_id)})
    except Exception as e:
        raise HTTPException(status_code=705, detail=f"Cannot find Transcript ID: {transcript_id}")

    try:
        transcript_text = transcript.get("text")
        if transcript_text is None:
            raise HTTPException(status_code=706, detail="Transcript text is empty")
    except Exception as e:
        raise HTTPException(status_code=706, detail="Transcript text is empty")

    try:
        prompt = "\n\n".join([
            os.getenv("QA_GRID_PROMPT"),
            f"Context: {transcript_text}",
            f"Question: {request.question}",
            f"Answer the question in the following format: {os.getenv('QA_GRID_PROMPT_FORMAT')}"
        ])
        response = client.chat.completions.create(
            model=os.getenv("QA_GRID_MODEL"),
            messages=[{"role": os.getenv("QA_GRID_PROMPT_ROLE"), "content": prompt}],
            max_tokens=int(os.getenv("QA_GRID_MAX_TOKENS")),
            n=1
        )
        answer = eval(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Failed to generate answers from LLM with error: {e}")
    return answer

@app.post("/chat/{session_id}")
async def chat(session_id: str, request: ChatRequest):
    """
    Handle a chat session by generating responses based on the chat history and context.

    Args:
        request (ChatRequest): The request object containing the session ID, question, and the number of top transcripts to consider.

    Returns:
        StreamingResponse: A streaming response containing the chat responses.

    Raises:
        HTTPException: If there is an error finding the session, transcripts, or generating the chat responses.
    """
    if session_id in CHAT_SESSION_CACHE_DICT:
        session = CHAT_SESSION_CACHE_DICT[session_id]
    else:
        try:
            session = db.chatsessions.find_one({"_id": ObjectId(session_id)})
        except Exception as e:
            raise HTTPException(status_code=707, detail=f"Cannot find Session ID: {session_id}")

        CHAT_SESSION_CACHE_DICT[session_id] = {
            "history": session["history"],
            "chat_type": session["chat_type"],
            "project_id": session["project_id"],
            "transcript_id": session["transcript_id"],
            "delete_time": session["delete_time"],
            "num_interactions" : session["num_interactions"],
            "conversation": session["conversation"]
        }

    n_itr = int(session['num_interactions'])
    chat_type = session["chat_type"]
    project_id = session["project_id"]
    transcript_id = session["transcript_id"]

    history = session["history"]
    conversation = session["conversation"]
    context = ""

    if n_itr % int(os.getenv("CHAT_CONTEXT_REPEAT")) == 0:
        if chat_type == "transcript":
            if transcript_id in CHAT_TRANSCRIPT_CACHE_DICT:
                transcript = CHAT_TRANSCRIPT_CACHE_DICT[transcript_id]
            else:
                try:
                    transcript = db.transcripts.find_one({"_id": ObjectId(transcript_id)})
                except Exception as e:
                    raise HTTPException(status_code=705, detail=f"Cannot find Transcript ID: {transcript_id}")

                CHAT_TRANSCRIPT_CACHE_DICT[transcript_id] = {
                    "text": transcript["text"],
                    "delete_time": datetime.utcnow() + timedelta(minutes=30)
                }
            context = f"Transcript: {transcript['text']}"
        
        elif chat_type == "project":
            try:
                project = db.projects.find_one({"_id": ObjectId(project_id)})
            except Exception as e:
                raise HTTPException(status_code=700, detail=f"Cannot find project ID: {project_id}")

            try:
                transcript_ids = project.get("transcripts", [])
            except Exception as e:
                raise HTTPException(status_code=701, detail="No transcripts found for the project")
            
            pipeline = [
                    {
                        "$search": {
                            "index": "default", 
                            "text": {
                                "query": request.question,
                                "path": "text" 
                            }
                        }
                    },
                    {"$match": {"_id": {"$in": [ObjectId(tid) for tid in transcript_ids]}}},
                    {"$limit": request.top_n}
                ]
            top_transcripts = list(db.transcripts.aggregate(pipeline))
            if not top_transcripts:
                HTTPException(status_code=704, detail="No valid content found in transcripts")
            context = "\n\n".join([f"Transcript: {t['text']}" for t in top_transcripts])

        if context:
            history.append({"role": "system", "content": f"Context: {context}"})

    prompt = "\n\n".join([
        os.getenv("CHAT_PROMPT"),
        f"Question: {request.question}",
        f'Format: {os.getenv("CHAT_PROMPT_FORMAT")}'
    ])
    history.append({"role": "user", "content": prompt})

    def stream_response():
        try:
            response = client.chat.completions.create(
                    model=os.getenv('CHAT_MODEL'),
                    messages=history,
                    max_tokens=int(os.getenv('CHAT_MAX_TOKENS')),
                    n=1,
                    stream=True
            )
        except Exception as e:
            raise HTTPException(status_code=402, detail=f"Failed to generate answers from LLM in chat with error: {e}") 
        
        assistant_response = ""
        for chunk in response:
            content = chunk.choices[0].delta.content if chunk.choices[0].delta.content is not None else ""
            assistant_response += content
            yield content

        history.append({"role": "assistant", "content": assistant_response})
        conversation.append({"role": "user", "message": request.question})
        conversation.append({"role": "bot", "message": assistant_response})

        trimmed_history = history[-(MAX_CHAT_HISTORY_SAVE_LENGTH * 2):] 
        new_delete_time = datetime.utcnow() + timedelta(minutes=30)

        db.chatsessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "last_updated": datetime.utcnow(),
                    "history": trimmed_history,
                    "delete_time": new_delete_time,
                    "chat_type": chat_type,
                    "project_id": project_id,
                    "transcript_id": transcript_id,
                    "num_interactions": n_itr + 1,
                    "conversation": conversation
                }
            },
            upsert=True
        )
        CHAT_SESSION_CACHE_DICT[session_id] = {
            "history": trimmed_history,
            "delete_time": new_delete_time,
            "chat_type": chat_type,
            "project_id": project_id,
            "transcript_id": transcript_id,
            "num_interactions": n_itr + 1,
            "conversation": conversation
        }
    try:
        return StreamingResponse(stream_response(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Failed to stream chat: {e}") 
