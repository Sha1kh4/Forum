from typing import Union , Annotated
from fastapi import FastAPI, Depends ,HTTPException
import auth
import models
from db import engine, SessionLocal 
from auth import get_current_user



app = FastAPI()

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