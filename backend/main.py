from typing import Union , Annotated
from fastapi import FastAPI, Depends ,HTTPException
import auth
import models
from db import engine, SessionLocal 
from auth import get_current_user
from fastapi.middleware.cors import CORSMiddleware

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
async def create_question(  db: db_dependency, question: str):
    new_question = models.Questions(userid=67, message=question)
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question

@app.get("/questions")
async def get_questions(db: db_dependency):
    questions = db.query(models.Questions).all()
    return questions

@app.post("/answer")
async def create_answer( db: db_dependency, questionid: int, answer: str):
    new_answer = models.Answers(questionid=questionid, userid=67, message=answer)
    db.add(new_answer)
    db.commit()
    db.refresh(new_answer)
    return new_answer


@app.get("/answers/{questionid}")
async def get_answers(questionid: int, db: db_dependency):
    answers = db.query(models.Answers).filter(models.Answers.questionid == questionid).all()
    return answers
