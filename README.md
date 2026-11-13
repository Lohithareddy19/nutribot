# NutriBot – food nutrition chatbot with diet plans

**Stack:** Node.js + Express (REST API) · MongoDB + Mongoose (daily log, saved plans) · HTML/CSS/JavaScript frontend

## Run
1. Install Node.js 18+ and MongoDB Community (or create a free MongoDB Atlas cluster).
2. In this folder:
```
npm install
copy .env.example .env      (macOS/Linux: cp .env.example .env)
npm start
```
3. Open http://localhost:5000

## API
| Method | Route | Purpose |
|---|---|---|
| POST | /api/chat | Nutrition label, compare, rankings, log foods from a message |
| GET / POST / DELETE | /api/log | Today's food log |
| POST | /api/dietplan | Build a 7-day plan (Mifflin-St Jeor + goal) and save it |
| GET | /api/dietplan/latest | Last saved plan |

## Structure
```
server.js              app setup, MongoDB connection
src/routes/api.js      routes
src/models/            Mongoose models (LogEntry, Plan)
src/services/          nutrition parsing, chat logic, diet-plan engine
src/data/foods.js      food data (per 100 g) and meal templates
public/                frontend
```
Nutrition values are approximate; plans are general guidance, not medical advice.
