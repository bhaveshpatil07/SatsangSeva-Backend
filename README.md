# SatsangSeva: Backend
# Bhajan-Booking-Backend
# bookMyBhajanBackend

# BackendAPIs:
1. /user:
    /signup: 
        { 
            "name": "Bhavesh Patil",
            "email": "xyz@email.com",
            "phoneNumber": "1234567890",
            "password": "123"
        }
    /login:
        Req: {   "email": "xyz@email.com", "password": "123" }
        Resp: { "message": "Login Successfull",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2YTYwMmEwNGQyMjUzZWZkYTU5YmUyNyIsImlhdCI6MTcyMjE1NTgzMSwiZXhwIjoxNzIyNzYwNjMxfQ.uf4FVuLYwVe7RdoN2qRtkaFKLztRdftcidRnrhr80w8",
                "id": "66a602a04d2253efda59be27"
            }
    / : getAllUsers
    /:id : getUserById
    /:id : deleteUser
    /:id : updateUser
        { 
            "name": "Mr. Bhavesh Patil",
            "email": "xyz@email.com",
            "phoneNumber": "0123456789",
            "password": "123"
        }
    /bookings/:id : getBookingsOfUser
    /events/:id : getBookingsOfUser

2. /events:
    / : addEvent
        Header-Auth-Bearer=Token
        { 
            "eventName": "Krishna Bhajan",
            "eventCategory": "Bhakti",
            "eventLang": "Hindi",
            "noOfAttendees": "12050",
            "performerName": "Narendra Chopra",
            "hostName": "Dummy",
            "hostWhatsapp": "1234567890",
            "sponserName": "Sponser Dummy",
            "eventLink": "https://www.youtube.com/watch?v=04x7qW_DS2Y",
            "location": "https://maps.app.goo.gl/nZ3FRXhztZvTM2Uh9",
            "eventAddress": "ABC Ganpati Temple, Banaglore highway, Mumbai, Maharashtra, 456798",
            "startDate": "2024-11-22 10:35",
            "endDate": "2024-12-02 17:55"
        }
        And Image file
    / : getAllEvents
    /:id : getEventById

3. /booking:
    / : newBooking
        {
            "event": "66a606cb19f8ec1c7673378f",
            "attendeeContact": "9456987456",
            "user": "66a60a7a2b68be8c008dbff9"
        }
    /:id : getBookingById
    /:id : deleteBooking

    

/event/search:
    get: ?name=...&add=...&date=...