import { useState, useEffect } from 'react';

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // Store answers for each question
  const [showModal, setShowModal] = useState(false); // Control modal visibility
  const [currentQuestionId, setCurrentQuestionId] = useState(null); // Store current question id for the modal
  const [answerMessage, setAnswerMessage] = useState(""); // Store the answer message
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; // Get API base URL from env

  useEffect(() => {
    // Fetch the questions (replace with your actual API endpoint)
    fetch(`${API_BASE_URL}/questions`)
      .then((response) => response.json())
      .then((data) => {
        setQuestions(data);

        // Fetch answers for each question once questions are loaded
        data.forEach((question) => {
          fetchAnswers(question.questionid);
        });
      });
  }, [API_BASE_URL]);

  // Fetch answers for a specific question
  const fetchAnswers = (questionId) => {
    fetch(`${API_BASE_URL}/answers/${questionId}`)
      .then((response) => response.json())
      .then((data) => {
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          [questionId]: data, // Store answers for this question
        }));
      });
  };

  // Open the modal for submitting an answer
  const openModal = (questionId) => {
    setCurrentQuestionId(questionId);
    setShowModal(true);
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setAnswerMessage(""); // Clear the answer input field
  };

  // Handle answer submission
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
      .then((response) => response.json())
      .then((data) => {
        // Update the answers state with the newly posted answer
        setAnswers((prevAnswers) => {
          const updatedAnswers = prevAnswers[currentQuestionId]
            ? [...prevAnswers[currentQuestionId], data] // Add the new answer
            : [data]; // If no answers yet, create an array with the new answer
          
          return {
            ...prevAnswers,
            [currentQuestionId]: updatedAnswers,
          };
        });

        // Close the modal and clear the input field
        closeModal();
      })
      .catch((error) => {
        console.error('Error posting answer:', error);
      });
  };

  return (
    <section className="text-gray-600 body-font overflow-hidden">
      <div className="container px-5 py-24 mx-auto">
        <div className="-my-8 divide-y-2 divide-gray-100">
          {questions.map((question) => (
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

                {/* Display answers */}
                {answers[question.questionid] && answers[question.questionid].length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold">Answers:</h3>
                    <ul className="space-y-2"> {/* Reduce the space here */}
                      {answers[question.questionid].map((answer) => (
                        <li
                          key={answer.answerid}
                          className="bg-gray-100  rounded-lg" 
                        >
                          <p>{answer.message}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={() => openModal(question.questionid)} // Open modal for submitting answer
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
          ))}
        </div>
      </div>

      {/* Modal for submitting an answer */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-100 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Submit your answer</h3>
            <textarea
              value={answerMessage}
              onChange={(e) => setAnswerMessage(e.target.value)}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              placeholder="Type your answer here..."
            ></textarea>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeModal}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswerSubmit}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
