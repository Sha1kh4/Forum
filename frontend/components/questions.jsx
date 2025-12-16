import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

export default function Questions() {
  const [answers, setAnswers] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [answerMessage, setAnswerMessage] = useState('');
  const [questionMessage, setQuestionMessage] = useState('');
  const [notification, setNotification] = useState(null);
  const wsRef = useRef(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const WS_URL = API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:8000';

  // Define the fetcher for SWR
  const fetcher = (url) => fetch(url).then((res) => res.json());

  // Fetch questions and answers together with SWR
  const { data: questions, error: questionsError, mutate: mutateQuestions } = useSWR(
    `${API_BASE_URL}/questions`,
    fetcher
  );

  // WebSocket connection
  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'new_question') {
        // Show notification
        setNotification({
          type: 'question',
          message: 'New question posted!',
          data: message.data
        });

        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);

        // Refresh questions list
        mutateQuestions();
      } else if (message.type === 'new_answer') {
        // Show notification
        setNotification({
          type: 'answer',
          message: 'New answer posted!',
          data: message.data
        });

        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);

        // Update answers for the specific question
        const questionId = message.data.questionid;
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [questionId]: [...(prevAnswers[questionId] || []), message.data]
        }));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [WS_URL, mutateQuestions]);

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

  // Sorting questions based on the "Escalated" status and then by "created_at"
  const sortedQuestions = questions
    ? [
        ...questions
          .filter((q) => q.Status === 'Escalated')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        ...questions
          .filter((q) => q.Status !== 'Escalated')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      ]
    : [];

  // Open answer modal
  const openModal = (questionId) => {
    setCurrentQuestionId(questionId);
    setShowModal(true);
  };

  // Close answer modal
  const closeModal = () => {
    setShowModal(false);
    setAnswerMessage('');
  };

  // Open add question modal
  const openQuestionModal = () => {
    setShowQuestionModal(true);
  };

  // Close add question modal
  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setQuestionMessage('');
  };

  // Function to make POST requests using XMLHttpRequest
  const postRequest = (url, data, onSuccess, onError) => {
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Accept', 'application/json');
    xhttp.setRequestHeader('Content-Type', 'application/json');

    xhttp.onload = function () {
      if (xhttp.status === 200) {
        try {
          const response = JSON.parse(xhttp.responseText);
          onSuccess(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          onError('There was an error processing the response.');
        }
      } else {
        console.error('Failed to submit:', xhttp.statusText);
        onError('There was an error submitting your request.');
      }
    };

    xhttp.onerror = function () {
      console.error('Network error');
      onError('There was an error submitting your request.');
    };

    xhttp.send(JSON.stringify(data));
  };

  // Handle submitting an answer
  const handleAnswerSubmit = () => {
    if (!answerMessage.trim()) {
      alert('Please enter an answer!');
      return;
    }

    const url = `${API_BASE_URL}/answer?questionid=${currentQuestionId}&answer=${encodeURIComponent(answerMessage)}`;
    const data = { message: answerMessage };

    postRequest(
      url,
      data,
      (data) => {
        // Don't manually update - WebSocket will handle it
        closeModal();
      },
      (errorMessage) => {
        alert(errorMessage);
      }
    );
  };

  // Handle submitting a new question
  const handleQuestionSubmit = () => {
    if (!questionMessage.trim()) {
      alert('Please enter a question!');
      return;
    }

    const url = `${API_BASE_URL}/question?question=${encodeURIComponent(questionMessage)}`;
    const data = { message: questionMessage };

    postRequest(
      url,
      data,
      () => {
        // Don't manually refresh - WebSocket will handle it
        closeQuestionModal();
      },
      (errorMessage) => {
        alert(errorMessage);
      }
    );
  };

  if (questionsError)
    return <div className="min-h-screen flex items-center justify-center text-red-600">Error loading questions!</div>;

  if (!questions)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questions...</p>
        </div>
      </div>
    );

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3 max-w-sm">
            <div className="flex-shrink-0">
              {notification.type === 'question' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{notification.message}</p>
              {notification.type === 'question' && (
                <p className="text-sm text-indigo-100 truncate">{notification.data.message}</p>
              )}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-white hover:text-indigo-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <section className="text-gray-600 body-font overflow-hidden">
        <div className="container px-5 py-24 mx-auto">
          <div className="-my-8 divide-y-2 divide-gray-100">
            {sortedQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No questions yet. Be the first to ask!</p>
              </div>
            ) : (
              sortedQuestions.map((question) => (
                <div key={question.questionid} className="py-8 flex flex-wrap md:flex-nowrap">
                  <div className="md:w-64 md:mb-0 mb-6 flex-shrink-0 flex flex-col">
                    <span className="font-semibold title-font text-gray-700">{question.Status}</span>
                    <span className="mt-1 text-gray-500 text-sm">{new Date(question.created_at).toLocaleString()}</span>
                  </div>
                  <div className="md:flex-grow">
                    <h2 className="text-2xl font-medium text-gray-900 title-font mb-2">{question.message}</h2>

                    {answers[question.questionid] && answers[question.questionid].length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Answers:</h3>
                        <ul className="space-y-2">
                          {answers[question.questionid].map((answer) => (
                            <li key={answer.answerid} className="bg-gray-100 p-3 rounded-lg">
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
                        <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
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