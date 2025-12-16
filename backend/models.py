from sqlalchemy import Column, Integer, String, ForeignKey , Enum
from sqlalchemy.orm import relationship
from db import Base
import enum
class StatusEnum(enum.Enum):
    Pending = "Pending"
    Escalated = "Escalated"
    Answered = "Answered"


class Users(Base):
    __tablename__ = "users"

    userid: int = Column(Integer, primary_key=True, index=True)
    username: str = Column(String, unique=True, index=True)
    email: str = Column(String, unique=True, index=True)
    password: str = Column(String)
    role: str = Column(String, default="admin")
    # Relationships
    questions = relationship("Questions", back_populates="owner")
    answers = relationship("Answers", back_populates="owner")

class Questions(Base):
    __tablename__ = "questions"

    questionid: int = Column(Integer, primary_key=True, index=True)
    userid: int = Column(Integer, ForeignKey("users.userid"))
    message: str = Column(String)
    Status: str = Column(Enum(StatusEnum), default=StatusEnum.Pending.value)
    # Relationships
    owner = relationship("Users", back_populates="questions")
    answers = relationship("Answers", back_populates="question")

class Answers(Base):
    __tablename__ = "answers"

    answerid: int = Column(Integer, primary_key=True, index=True)
    questionid: int = Column(Integer, ForeignKey("questions.questionid"))
    userid: int = Column(Integer, ForeignKey("users.userid"))
    message: str = Column(String)

    # Relationships
    question = relationship("Questions", back_populates="answers")
    owner = relationship("Users", back_populates="answers")
