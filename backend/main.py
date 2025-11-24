from fastapi import FastAPI, websockets
from api import auth, dialogs, users, websocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Messenger API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # URL твоего React приложения
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"]) 
app.include_router(dialogs.router, prefix="/api/v1/dialogs", tags=["dialogs"])
app.include_router(websocket.router, prefix="/api/v1/websocket", tags=["websocket"])