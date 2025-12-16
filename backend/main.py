from typing import Union, Annotated, List
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import auth
import models
from db import engine, SessionLocal
from auth import get_current_user
import json

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

models.Base.metadata.create_all(bind=engine)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[SessionLocal, Depends(get_db)]
user_dependency = Annotated[models.Users, Depends(get_current_user)]


@app.get("/")
async def read_root():
    return {"Health Check": "OK"}


@app.post("/question")
async def create_question(db: db_dependency, question: str):
    new_question = models.Questions(userid=67, message=question)
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    
    # Broadcast new question to all connected clients
    await manager.broadcast({
        "type": "new_question",
        "data": {
            "questionid": new_question.questionid,
            "userid": new_question.userid,
            "message": new_question.message,
            "Status": new_question.Status.value if hasattr(new_question.Status, 'value') else new_question.Status,
            "created_at": new_question.created_at.isoformat() if new_question.created_at else None
        }
    })
    
    return new_question


@app.get("/questions")
async def get_questions(db: db_dependency):
    questions = db.query(models.Questions).all()
    return questions


@app.post("/answer")
async def create_answer(db: db_dependency, questionid: int, answer: str):
    new_answer = models.Answers(questionid=questionid, userid=67, message=answer)
    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)
    
    # Broadcast new answer to all connected clients
    await manager.broadcast({
        "type": "new_answer",
        "data": {
            "answerid": new_answer.answerid,
            "questionid": new_answer.questionid,
            "userid": new_answer.userid,
            "message": new_answer.message
        }
    })
    
    return new_answer


@app.get("/answers/{questionid}")
async def get_answers(questionid: int, db: db_dependency):
    answers = db.query(models.Answers).filter(models.Answers.questionid == questionid).all()
    return answers


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back or handle client messages if needed
            await websocket.send_json({"type": "ping", "message": "connected"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)