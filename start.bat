@echo off
echo Starting Server...
cd "C:\MONGO\bin"
start cmd /c mongo
start cmd /c mongod --dbpath C:\Users\Ethan\Desktop\node\greenAlliance\data
cd C:\Users\Ethan\Desktop\node\greenAlliance
nodemon npm start
pause