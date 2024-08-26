# SatsangSeva: Backend
# Bhajan-Booking-Backend
# bookMyBhajanBackend

## Environment Setup

To get started, create a `.env` file in the root of your project with the following variables:

### Required Environment Variables
---------------------------------

```markdown
# .env file configuration

# Backend Configuration
PORT=8000
SECRET_KEY=SAME as in Frontend .env
MONGODB_URL=YOUR_DB_URL

# Twilio Configuration
TWILIO_ACCOUNT_SID=Get it From Twilio
TWILIO_AUTH_TOKEN=Get it From Twilio
TWILIO_AUTH_SERVICES=Get it From Twilio
TWILIO_WHATSAPP_NUMBER=Get it From Twilio

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=Get it From Cloudinary.com
CLOUDINARY_API_KEY=Get it From Cloudinary.com
CLOUDINARY_API_SECRET=Get it From Cloudinary.com

# GMail Configuration
GMAIL_MAIL=YOUR_EMAIL
GMAIL_APP_PASSWORD=YOUR_APP_PASS

# Google Maps API Key
GMAP_KEY=Get it from the Google Cloud Console