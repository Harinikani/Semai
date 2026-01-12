"# Semai2.0" 
# Installation Guide

Follow these steps to run the project locally:

### 1. Clone the repository
git clone [link]

### 2. Navigate to Frontend folder and install package
cd Frontend                         #Go to Frontend directory
npm install                         #Install js packages
create a .env file
NEXT_PUBLIC_API_BASE_URL= [Backend_Link] #Get link from step 3


### 3. Navigate to Backend folder and create enviroment
cd ..                               #Go back to root directory
cd Backend                          #Go to Backend directory
py -m venv Semai_env                #Create a enviroment
Semai_env\Scripts\activate          #Activate env
pip install -r requirements.txt     #Install dependencies for backend
create a .env file
DB_USER = 
DB_PASSWORD = 
DB_HOST = 
DB_PORT = 
DB_NAME=
INSTANCE_CONNECTION_NAME=
GEMINI_API_KEY= 
GCP_TYPE=
GCP_PROJECT_ID=
GCP_PRIVATE_KEY_ID=
GCP_PRIVATE_KEY=
GCP_CLIENT_EMAIL=
GCP_CLIENT_ID=
GCP_BUCKET_NAME=
#Deploy on GCP Cloud Run [Backend_Link]

### 4 Deploy Frontend and Admin-panel as well

