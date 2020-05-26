import os.path
import pickle
from googleapiclient import discovery
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from flask import Flask, request

app = Flask('__name__')

@app.route('/submit', methods=['POST'])
def submit():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    else:
       return {
            "error": True,
            "error_msg": "Credentials don't exist."
        } 

    service = discovery.build('sheets', 'v4', credentials=creds)

    review = request.json

    api_call = service.spreadsheets().values().append(
        spreadsheetId='1AJO52gUTAElYGcfGMK07YkEfWdYNEITkjzS8hhOFTww',
        range=review['dept'],
        valueInputOption='USER_ENTERED',
        insertDataOption='INSERT_ROWS',
        body=review['rangeData']
    )
    return {
        "error": False,
        "data": api_call.execute()
    }