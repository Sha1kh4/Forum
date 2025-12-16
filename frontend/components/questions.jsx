import { useState, useEffect } from 'react';
import useSWR from 'swr';

export default function Questions() {
  const [answers, setAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [answerMessage, setAnswerMessage] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const fetcher = (url) => fetch(url).then((res) => res.json());
  
  // Fetch questions using SWR (no auth required)
  const { data: questions, error: questionsError, mutate: mutateQuestions } = useSWR(
    `${API_BASE_URL}/questions`,
    fetcher
  );

  // Fetch answers for each question when questions load
  useEffect(() => {
    if (questions && questions.length > 0) {
      questions.forEach((question) => {
        fetch(`${API_BASE_URL}/answers/${question.questionid}`)
          .then((res) => res.json())
          .then((data) => {
            setAnswers((prevAnswers) => ({
              ...prevAnswers,
              [question.questionid]: data,
            }));
          })
          .catch((error) => {
            console.error(`Error fetching answers for question ${question.questionid}:`, error);
          });
      });
    }
  }, [questions, API_BASE_URL]);

  const openModal = (questionId) => {
    setCurrentQuestionId(questionId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setAnswerMessage("");
  };

  const openQuestionModal = () => {
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setQuestionMessage("");
  };

  const handleAnswerSubmit = () => {
    if (!answerMessage.trim()) {
      alert('Please enter an answer!');
      return;
    }

    fetch(`${API_BASE_URL}/answer?questionid=${currentQuestionId}&answer=${encodeURIComponent(answerMessage)}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to submit answer');
        }
        return response.json();
      })
      .then((data) => {
        setAnswers((prevAnswers) => {
          const updatedAnswers = prevAnswers[currentQuestionId]
            ? [...prevAnswers[currentQuestionId], data]
            : [data];
          
          return {
            ...prevAnswers,
            [currentQuestionId]: updatedAnswers,
          };
        });
        closeModal();
      })
      .catch((error) => {
        console.error('Error posting answer:', error);
        alert('There was an error submitting your answer.');
      });
  };

  const handleQuestionSubmit = () => {
    if (!questionMessage.trim()) {
      alert('Please enter a question!');
      return;
    }

    fetch(`${API_BASE_URL}/question?message=${encodeURIComponent(questionMessage)}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to submit question');
        }
        return response.json();
      })
      .then((data) => {
        mutateQuestions();
        closeQuestionModal();
      })
      .catch((error) => {
        console.error('Error posting question:', error);
        alert('There was an error submitting your question.');
      });
  };

  if (questionsError) return <div className="min-h-screen flex items-center justify-center text-red-600">Error loading questions!</div>;
  if (!questions) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    </div>
  );

  return (
    <>

      <section className="text-gray-600 body-font overflow-hidden">
        <div className="container px-5 py-24 mx-auto">
          <div className="-my-8 divide-y-2 divide-gray-100">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No questions yet. Be the first to ask!</p>
              </div>
            ) : (
              questions.map((question) => (
                <div key={question.questionid} className="py-8 flex flex-wrap md:flex-nowrap">
                  <div className="md:w-64 md:mb-0 mb-6 flex-shrink-0 flex flex-col">
                    <span className="font-semibold title-font text-gray-700">
                      {question.Status}
                    </span>
                    <span className="mt-1 text-gray-500 text-sm">
                      {new Date(question.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="md:flex-grow">
                    <h2 className="text-2xl font-medium text-gray-900 title-font mb-2">
                      {question.message}
                    </h2>

                    {answers[question.questionid] && answers[question.questionid].length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Answers:</h3>
                        <ul className="space-y-2">
                          {answers[question.questionid].map((answer) => (
                            <li
                              key={answer.answerid}
                              className="bg-gray-100 p-3 rounded-lg" 
                            >
                              <p className="text-gray-800">{answer.message}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => openModal(question.questionid)}
                        className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium py-2 px-4 rounded-lg inline-flex items-center mt-4 transition-colors duration-300"
                      >
                        Answer
                        <svg
                          className="w-4 h-4 ml-2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Floating button to add question */}
      <button
        onClick={openQuestionModal}
        className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:shadow-xl z-40"
        aria-label="Add Question"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Modal for submitting an answer */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-labelledby="answer-modal" aria-hidden={!showModal}>
          <div className="bg-white p-8 rounded-lg w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4" id="answer-modal">Submit your answer</h3>
            <textarea
              value={answerMessage}
              onChange={(e) => setAnswerMessage(e.target.value)}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your answer here..."
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswerSubmit}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding a question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-labelledby="question-modal" aria-hidden={!showQuestionModal}>
          <div className="bg-white p-8 rounded-lg w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4" id="question-modal">Ask a Question</h3>
            <textarea
              value={questionMessage}
              onChange={(e) => setQuestionMessage(e.target.value)}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type your question here..."
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeQuestionModal}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuestionSubmit}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}