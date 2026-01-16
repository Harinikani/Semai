"# Semai " 

**1. Introduction**
This project introduces an AI-powered wildlife education and conservation website designed specifically for mobile users interested in Malaysia’s rich biodiversity. It allows outdoor enthusiasts to take photos of plants and animals, then instantly learn about them through detailed information and cultural stories. At the same time, the platform supports conservation efforts by automatically generating reports of endangered species sightings and sending them to the appropriate authorities.

**1.1 Purpose**
The primary aim of this project is to provide an engaging and interactive digital tool that helps users explore and appreciate Malaysia’s diverse wildlife. Beyond education, the system encourages active participation in conservation by simplifying the process of reporting endangered and protected species. The goal is to build a community of informed nature enthusiasts who contribute to the preservation of Malaysia’s natural heritage.

**1.2 Scope**
This project focuses on developing a website featuring an AI-powered identification system capable of recognizing both plants and animals native to Malaysia. It incorporates cultural storytelling and interactive educational tools such as quizzes and learning modules designed to enhance the user’s experience. 
Key features include (i) AI-powered species identification system, (ii) AI Information & Storytelling, (iii) Conservation Reporting, (iv) Interactive Educational Tools including quizzes and learning modules. The website also promotes community involvement and raises awareness about local flora and fauna through its integrated tools and features.

The project does not cover:
The platform is not intended to serve as a comprehensive scientific database or replace professional wildlife monitoring and research systems. It does not provide real-time animal tracking beyond user-submitted photos, or detailed ecological analysis. The system also does not handle law enforcement or direct wildlife management, which remain the responsibilities of authorities. Additionally, the project does not cover an app, it is accessed exclusively through a website and therefore requires a browser and an internet connection.


**2. General Description 
2.1 Product Perspective**
The Educational and Conservational Wildlife App is a web-based platform accessible through any browser. It uses AI-powered image recognition to detect flora and fauna, then provides educational content, storytelling, quizzes, and fun facts to make learning engaging. To ensure reports are not missed, it can also generate an email template that users may send to authorities such as PERHILITAN as a secondary option. The platform supports normal users, who explore and learn, and authority users, who review and validate reports. A rewarding system encourages participation, for example by giving points or vouchers to users who complete quizzes or submit valid reports.

**2.2 User Characteristics**
	The platform is designed for two main user groups.

Normal users: Hikers, bird watchers, families, and students who want to explore and learn about wildlife. They can take photos for species detection, read fun facts, enjoy storytelling, try quizzes, and submit reports of wildlife sightings. Validated reports may earn them rewards such as points, badges, or vouchers.

Authority users: Wildlife officers and groups like PERHILITAN who receive an email notification whenever a report is submitted. The email links back to the system, where they can view photos, details, and locations, then validate whether a report is true or false. This ensures email serves as a reminder, while official actions stay within the system. 

**2.3 Operating Environment**
The Educational and Conservational Wildlife App is designed as a responsive web platform that works across major browsers, including Chrome, Firefox, Safari, and Edge. It can be accessed on both desktop and mobile devices to ensure users can learn and report wildlife sightings anytime and anywhere. 

**3.0 Assumptions and Dependencies**  
This project is built based on the following assumptions: 
Assumptions:
Users will access the app mainly through mobile devices with a stable internet connection. Most users subscribe to mobile data plans to use the internet. However, connectivity challenges may arise in jungles or rural areas due to weaker mobile network signals which result in slower internet access.
Users will grant permissions to access the camera for capturing pictures of animals and access phone storage for uploading these pictures into the app.
Users will give the application permission to access GPS for sharing the location of endangered species to the authorities.
Users can read, understand and communicate in English or Bahasa Malaysia language.
Users will consent in providing personal details such as name, email and phone number to the authorities for further communication. 

Dependencies:
Gemini AI API for image classification and generating information about the animals, quizzes and reports.
Built-in camera and phone storage for taking and uploading pictures of animals into the app.
Built-in GPS for sharing location of endangered species to the authorities.



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

