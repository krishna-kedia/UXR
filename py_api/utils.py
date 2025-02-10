"""
This module provides utility functions and classes for processing files, transcribing audio, and handling requests.

Functions:
    - cleanup_cache: Periodically cleans up expired cache entries for chat sessions and transcripts.
    - extract_text_from_pdf: Extracts text from a PDF file.
    - extract_text_from_docx: Extracts text from a DOCX file.
    - extract_text_from_txt: Extracts text from a TXT file.
    - extract_audio_from_video: Extracts audio from a video file.
    - transcribe_audio_sarvam: Transcribes audio using the Sarvam API.
    - s3_to_temp: Downloads a file from an S3 URL to a temporary file.
    - transcribe_aws: Transcribes audio using AWS Transcribe.

Classes:
    - ProjectIDRequest: Request model for project ID.
    - QuestionRequest: Request model for generating questions.
    - QuestionSingleRequest: Request model for generating a single answer.
    - QuestionSingleRequestGrid: Request model for generating answers in a grid format.
    - ChatRequest: Request model for chat.
    - FileProcessing: Request model for file processing.
"""

import os
import time
import requests
import ffmpeg
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

from PyPDF2 import PdfReader
from docx import Document

from pydantic import BaseModel
from fastapi import HTTPException

import boto3
from botocore.exceptions import BotoCoreError, ClientError

load_dotenv()

class generateQuestions(BaseModel):
    """
    Request model for project ID.
    """
    num_q: int = 10

class QuestionSingleRequestGrid(BaseModel):
    """
    Request model for generating answers in a grid format.
    """
    question: dict

class ChatRequest(BaseModel):
    """
    Request model for chat.
    """
    question: str
    top_n: int = 3 

class transcribeCall(BaseModel):
    """
    Request model for file processing.
    """
    url: str
    transcribe_method: str = 'aws'
    transcribe_lang: str = None
    transcribe_speaker_number: int = 2

class s3Upload(BaseModel):
    bot_url: str
    s3_file_path: str  

def cleanup_cache(CHAT_SESSION_CACHE_DICT, CHAT_TRANSCRIPT_CACHE_DICT):
    """
    Periodically cleans up expired cache entries for chat sessions and transcripts.

    Args:
        CHAT_SESSION_CACHE_DICT (dict): Dictionary containing chat session cache.
        CHAT_TRANSCRIPT_CACHE_DICT (dict): Dictionary containing chat transcript cache.
    """
    while True:
        now = datetime.utcnow()
        expired_sessions = [key for key, session in CHAT_SESSION_CACHE_DICT.items() if session["delete_time"] < now]
        for session_id in expired_sessions:
            del CHAT_SESSION_CACHE_DICT[session_id]
        expired_transcripts = [key for key, transcript in CHAT_TRANSCRIPT_CACHE_DICT.items() if transcript["delete_time"] < now]
        for transcript_id in expired_transcripts:
            del CHAT_TRANSCRIPT_CACHE_DICT[transcript_id]
        time.sleep(int(os.getenv('CACHE_TIMER')))

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF file.

    Args:
        file_path (str): Path to the PDF file.

    Returns:
        str: Extracted text from the PDF.

    Raises:
        HTTPException: If there is an error extracting text from the PDF.
    """
    try:
        pdf_reader = PdfReader(file_path)
        text = "".join([page.extract_text() for page in pdf_reader.pages])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=300, detail=f"Failed to extract text from PDF: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def extract_text_from_docx(file_path):
    """
    Extracts text from a DOCX file.

    Args:
        file_path (str): Path to the DOCX file.

    Returns:
        str: Extracted text from the DOCX.

    Raises:
        HTTPException: If there is an error extracting text from the DOCX.
    """
    try:
        document = Document(file_path)
        return "\n".join([paragraph.text for paragraph in document.paragraphs]).strip()
    except Exception as e:
        raise HTTPException(status_code=301, detail=f"Failed to extract text from DOCX: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def extract_text_from_txt(file_path):
    """
    Extracts text from a TXT file.

    Args:
        file_path (str): Path to the TXT file.

    Returns:
        str: Extracted text from the TXT.

    Raises:
        HTTPException: If there is an error reading the TXT file.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read().strip()
    except Exception as e:
        raise HTTPException(status_code=302, detail=f"Failed to read TXT file: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def extract_audio_from_video(video_path, output_audio_path):
    """
    Extracts audio from a video file.

    Args:
        video_path (str): Path to the video file.
        output_audio_path (str): Path to save the extracted audio file.

    Raises:
        HTTPException: If there is an error extracting audio from the video.
    """
    try:
        ffmpeg.input(video_path).output(output_audio_path).run()
    except ffmpeg.Error as e:
        raise HTTPException(status_code=303, detail=f"Failed to extract audio from video: {str(e)}")

def transcribe_audio_sarvam(file_path, media_format, language_code):
    """
    Transcribes audio using the Sarvam API.

    Args:
        file_path (str): Path to the audio file.
        media_format (str): Format of the audio file (e.g., 'mp3', 'wav').
        language_code (str): Language code for transcription.

    Returns:
        str: Transcribed text.

    Raises:
        HTTPException: If there is an error transcribing the audio.
    """
    if media_format == 'mp4':
        audio_path = f"extracted_audio_{int(time.time())}.mp3"
        extract_audio_from_video(file_path, audio_path)
        file_path = audio_path
        media_format = 'mp3'

    try:
        with open(file_path, "rb") as file_file:
            files = [("file", (file_path, file_file, "audio/mpeg" if media_format == 'mp3' else "audio/wav"))]
            payload = {
                'model': 'saarika:v2',
                'language_code': language_code,
                'with_timesteps': 'true',
                'with_diarization': 'true'
            }
            headers = {'api-subscription-key': os.getenv('SARVAM_API_KEY')}
            response = requests.post(os.getenv('SARVAM_API_URL'), headers=headers, data=payload, files=files)

        if response.status_code == 200:
            result = response.json()
            if result.get('diarized_transcript'):
                transcript = ""
                for entry in result['diarized_transcript']['entries']:
                    speaker = entry.get('speaker_id', 'Unknown Speaker')
                    transcript += f"{speaker}: {entry.get('transcript')} \n"
                return transcript
            else:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(status_code=304, detail="Diarized transcript not found in the API response.")
        else:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
    except Exception as e:
        raise HTTPException(status_code=305, detail=f"Failed to transcribe audio: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

def s3_to_temp(url):
    """
    Downloads a file from an S3 URL to a temporary file.

    Args:
        url (str): S3 URL of the file.

    Returns:
        str: Path to the temporary file.

    Raises:
        HTTPException: If there is an error downloading the file from the S3 URL.
    """
    # Parse the S3 URL
    if not url.startswith("s3://"):
        raise HTTPException(status_code=400, detail="Invalid S3 URL")

    try:
        bucket_name, key = url[5:].split('/', 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid S3 URL format")

    # Extract the file extension for the temporary file
    file_extension = os.path.splitext(key)[1]
    temp_file_path = f"temp_from_url{file_extension}"

    # Initialize the S3 client
    s3_client = boto3.client('s3')

    try:
        # Download the file from S3
        with open(temp_file_path, 'wb') as f:
            s3_client.download_fileobj(bucket_name, key, f)
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"Error downloading file from S3: {e}")

    return temp_file_path


def transcribe_aws(file_url: str, media_format: str, language_code: str = None, max_speakers: int = 2) -> str:
    """
    Transcribes audio using AWS Transcribe with speaker diarization.

    Args:
        file_url (str): URL of the audio file.
        media_format (str): Format of the audio file (e.g., 'mp3', 'wav').
        language_code (str, optional): Language code for transcription.
        max_speakers (int, optional): Maximum number of speakers to identify.

    Returns:
        str: Transcribed text with speaker diarization.

    Raises:
        HTTPException: If there is an error during the transcription process.
    """

    transcribe_client = boto3.client('transcribe', region_name=os.getenv('AWS_REGION', 'ap-south-1'))
    job_name = f"transcription-job-{int(time.time())}"

    transcription_job_params = {
        'TranscriptionJobName': job_name,
        'Media': {'MediaFileUri': file_url},
        'MediaFormat': media_format,
        'Settings': {
            'ShowSpeakerLabels': True,
            'MaxSpeakerLabels': max_speakers
        }
    }

    if language_code is None:
        transcription_job_params["IdentifyLanguage"] = True
    else:
        transcription_job_params["LanguageCode"] = language_code

    try:
        response = transcribe_client.start_transcription_job(**transcription_job_params)

        if response['ResponseMetadata']['HTTPStatusCode'] != 200:
            raise HTTPException(status_code=601, detail=f"Failed to start transcription job. HTTP Status: {response['ResponseMetadata']['HTTPStatusCode']}")

        while True:
            status_response = transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
            status = status_response['TranscriptionJob']['TranscriptionJobStatus']

            if status == 'COMPLETED':
                transcript_url = status_response['TranscriptionJob']['Transcript']['TranscriptFileUri']
                transcript_response = requests.get(transcript_url)
                transcript_response.raise_for_status()
                transcript_json = transcript_response.json()

                transcript_text = ""
                for item in transcript_json['results']['audio_segments']:
                    if 'speaker_label' in item:
                        speaker = item['speaker_label']
                        transcript = item['transcript']
                        transcript_text += f"{speaker}: {transcript}\n"
                return transcript_text

            elif status == 'FAILED':
                raise HTTPException(status_code=602, detail="Transcription job failed.")

            time.sleep(10)

    except Exception as e:
        print(e)
        raise HTTPException(status_code=603, detail=f"HTTP error occurred: {e}")
