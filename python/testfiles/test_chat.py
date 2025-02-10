import requests

# Environment variables
API_URL = "http://localhost:8000/chat/"  # Update with the correct URL

# Function to simulate chat interaction
def chat_with_api(session_id: str, chat_type: str = None, project_id: str = None, transcript_id: str = None):
    print("Chat started. Type 'exit' to end.")

    while True:
        # Get the user's question
        user_input = input("You: ")

        if user_input.lower() == "exit":
            print("Ending chat.")
            break

        # Prepare the payload for the API request
        payload = {
            "session_id": session_id,
            "question": user_input,
            "chat_type": chat_type,
            "project_id": project_id,
            "transcript_id": transcript_id
        }

        # Send the request to the FastAPI server
        # Make the API call to the chat endpoint (with streaming)
        response = requests.post(API_URL, json=payload, stream=True)

        if response.status_code == 200:
            print("Response received (streaming):")
            # Iterate through the streamed response, handling each chunk
            for chunk in response.iter_lines(decode_unicode=True):
                if chunk:
                    print(chunk)  # Print each chunk sequentially as it's received
        else:
            print(f"Failed to get a response. Status code: {response.status_code}")

# Function to handle session creation or validation
def handle_session():
    session_id = input("Enter session id: ")

    # Ask if the session exists
    session_exists = input(f"Does session ID '{session_id}' exist? (yes/no): ").lower()

    if session_exists == "yes":
        print("Session exists. Starting chat...")        
        chat_with_api(session_id)

    elif session_exists == "no":
        print("Session does not exist.")
        
        # Ask for chat_type and IDs for a new session
        chat_type = input("Enter chat_type (project/transcript): ").lower()
        
        if chat_type == "project":
            project_id = input("Enter project_id: ")
            transcript_id = None
        elif chat_type == "transcript":
            project_id = None
            transcript_id = input("Enter transcript_id: ")
        else:
            print("Invalid chat_type. Exiting.")
            return

        chat_with_api(session_id, chat_type, project_id, transcript_id)

    else:
        print("Invalid input. Please enter 'yes' or 'no'.")

if __name__ == "__main__":
    handle_session()
