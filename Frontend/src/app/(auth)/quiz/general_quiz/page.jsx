"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import ProgressBar from "@/app/components/ProgressBar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/Breadcrumb";

// Define a key for localStorage
const QUIZ_CACHE_KEY = "generalQuizState";

const Page = () => {
  // --- State ---
  const [questions, setQuestions] = useState([]); // will hold LLM-generated questions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false);
  const [currentSelectedAnswer, setCurrentSelectedAnswer] = useState(null);
  const [expandedQuestions, setExpandQuestions] = useState([]);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || ""; // set in env or leave empty for same origin
  const [authToken, setAuthToken] = useState(null);

  const saveQuizState = useCallback(() => {
    const stateToSave = {
      questions,
      currentQuestionIndex,
      score,
      selectedAnswers,
      showResults,
      showDetailedAnswers,
      expandedQuestions,
    };
    try {
      localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(stateToSave));
    } catch (err) {
      console.error("Failed to save quiz state to localStorage", err);
    }
  }, [questions, currentQuestionIndex, score, selectedAnswers, showResults, showDetailedAnswers, expandedQuestions]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setAuthToken(token);
  }, []);

  useEffect(() => {
    try {
      const cachedState = localStorage.getItem(QUIZ_CACHE_KEY);
      if (cachedState) {
        const parsedState = JSON.parse(cachedState);
        setQuestions(parsedState.questions || []);
        setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0);
        setScore(parsedState.score || 0);
        setSelectedAnswers(parsedState.selectedAnswers || []);
        setShowResults(parsedState.showResults || false);
        setShowDetailedAnswers(parsedState.showDetailedAnswers || false);
        setExpandQuestions(parsedState.expandedQuestions || []);
        setLoading(false);
        setError(null);
        console.log("Quiz state loaded from cache.");
        return;
      }
    } catch (err) {
      console.error("Failed to load quiz state from localStorage", err);
      localStorage.removeItem(QUIZ_CACHE_KEY);
    }
    setLoading(true);
  }, []);

  // --- Fetch LLM quizzes on mount ---
  useEffect(() => {
    const fetchQuizzes = async () => {
      // Only fetch if questions are empty (not loaded from cache) and authToken is available
      if (questions.length > 0) {
        if (!authToken) {
          setError("Authentication token not found. Please log in.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/quiz/generate-general-quiz?token=${authToken}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} - ${text}`);
        }

        const data = await res.json();

        // Expected shape: { quizzes: [ { question, options: [...], correct_answer, explaination } ] }
        if (!data || !Array.isArray(data.quizzes)) {
          throw new Error("Invalid response shape from server");
        }

        // Map into the shape your UI expects:
        // answers: [{ text, correct }]
        const mapped = data.quizzes.map((q, idx) => {
          // Ensure options exist and are strings
          const opts = Array.isArray(q.options) ? q.options : [];
          const correctText = q.correct_answer ?? q.correctAnswer ?? "";
          const explanation = q.explaination ?? q.explanation ?? "";

          // Build answers array with a boolean correct flag
          const answers = opts.map((opt) => ({
            text: opt,
            correct:
              typeof correctText === "string" &&
              opt.trim() === correctText.trim(),
          }));

          // In case the model returned shuffled options without marking correct, ensure at least one correct exists:
          if (!answers.some((a) => a.correct) && correctText && opts.length) {
            // If exact match failed, try a more lenient inclusion match
            for (let a of answers) {
              if (
                correctText.toLowerCase().includes(a.text.toLowerCase()) ||
                a.text.toLowerCase().includes(correctText.toLowerCase())
              ) {
                a.correct = true;
                break;
              }
            }
          }

          return {
            id: idx + 1,
            question: q.question || "Missing question text",
            answers: answers.length
              ? answers
              : [
                  { text: "Option A", correct: false },
                  { text: "Option B", correct: false },
                  { text: "Option C", correct: false },
                  { text: "Option D", correct: false },
                ],
            explanation,
          };
        });

        setQuestions(mapped);
      } catch (err) {
        console.error("Failed fetching quizzes", err);
        setError(err.message || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch quizzes if authToken exists AND questions are not already loaded (from cache or previous fetch)
    if (authToken && questions.length === 0 && loading) {
      fetchQuizzes();
    }
  }, [authToken, questions.length, loading]); // Add authToken, questions.length and loading as dependencies

  useEffect(() => {
    if (questions.length > 0) {
      saveQuizState();
    }
  }, [questions, currentQuestionIndex, score, selectedAnswers, showResults, showDetailedAnswers, expandedQuestions, saveQuizState]);

  const currentQuestion = questions[currentQuestionIndex] || { answers: [] };
  const totalQuestions = questions.length;

  // --- Core handlers (same logic as your original code) ---
  const handleAnswerClick = (answerText, isCorrect) => {
    if (!hasAnswered) setHasAnswered(true);
    setCurrentSelectedAnswer(answerText);

    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedAnswer: answerText,
      isCorrect: isCorrect,
    };
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNextClick = () => {
    // Update score for the current question first
    const currentAnswer = selectedAnswers[currentQuestionIndex];
    if (currentAnswer && currentAnswer.isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setHasAnswered(false);
      setCurrentSelectedAnswer(null);
    } else {
      setShowResults(true);
      // Calculate rewards AFTER updating the score
      setTimeout(() => {
        const finalScore = score + (currentAnswer && currentAnswer.isCorrect ? 1 : 0);
        const rewards = calculateRewards(finalScore, totalQuestions);
        console.log("Final score:", finalScore, "Rewards:", rewards);
        addUserRewards(rewards.points, rewards.currency);
        localStorage.removeItem(QUIZ_CACHE_KEY);
      }, 100);
    }
  };

  const toggleQuestion = (questionId) => {
    setExpandQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setHasAnswered(false);
    setShowResults(false);
    setSelectedAnswers([]);
    setShowDetailedAnswers(false);
    setCurrentSelectedAnswer(null);
    setExpandQuestions([]);
    // Optionally refetch new questions:
    window.location.reload();
  };

  const toggleDetailedAnswers = () => {
    setShowDetailedAnswers(!showDetailedAnswers);
  };

  const calculateRewards = (score, totalQuestions) => {
    const percentage = (score / totalQuestions) * 100;
    
    if (percentage === 100) {
      return { points: 50, currency: 25 }; // Perfect score
    } else if (percentage >= 75) {
      return { points: 30, currency: 15 }; // Great score
    } else if (percentage >= 50) {
      return { points: 20, currency: 10 }; // Good score
    } else {
      return { points: 10, currency: 5 }; // Participation
    }
  };

  const addUserRewards = async (points, currency) => {
    try {
      const response = await fetch(`${API_BASE}/quiz/add-user-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ points, currency }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add rewards: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Rewards added:", data);
      return data;
    } catch (error) {
      console.error("Error adding rewards:", error);
    }
  };

  const resultMessage = useMemo(() => {
    const percentage =
      totalQuestions === 0 ? 0 : (score / totalQuestions) * 100;
    if (percentage === 100) {
      return "Amazing! You're a true Nature Expert!";
    } else if (percentage >= 75) {
      return "Great Job! You have strong nature knowledge.";
    } else if (percentage >= 50) {
      return "Good Effort! Keep exploring the natural world.";
    } else {
      return "Time to hit the books! Keep learning about nature.";
    }
  }, [score, totalQuestions]);

  const getButtonClasses = (answerText) => {
    let classes =
      "answer-btn w-full py-3 px-4 text-left font-medium rounded-lg shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 ";

    if (answerText === currentSelectedAnswer) {
      classes += "bg-green-100 border-2 border-green-500 text-green-700";
    } else {
      classes +=
        "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-green-100 hover:border-green-500 focus:ring-green-500";
    }

    return classes;
  };

  // --- Render helpers ---
  const renderQuiz = () => (
    <>
      <ProgressBar
        currentStep={currentQuestionIndex + 1}
        totalSteps={totalQuestions}
      />

      <div id="question-area" className="mb-8">
        <p
          id="question-text"
          className="text-xl font-semibold text-gray-700 leading-relaxed mb-4"
        >
          {currentQuestionIndex + 1}. {currentQuestion.question}
        </p>
        <div id="answer-buttons" className="grid grid-cols-1 gap-4">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              className={getButtonClasses(answer.text)}
              onClick={() => handleAnswerClick(answer.text, answer.correct)}
            >
              {answer.text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          id="next-btn"
          className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={!currentSelectedAnswer}
        >
          {currentQuestionIndex === totalQuestions - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </>
  );

  const renderDetailedAnswers = () => (
    <div className="mt-8 text-left">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Detailed Answers:
      </h3>
      <div className="space-y-4">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers.find(
            (answer) => answer.questionId === question.id
          );
          const correctAnswer = question.answers.find(
            (answer) => answer.correct
          );
          const isExpanded = expandedQuestions.includes(question.id);

          return (
            <div
              key={question.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                className="w-full p-4 text-left font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none transition duration-150 ease-in-out"
                onClick={() => toggleQuestion(question.id)}
              >
                <div className="flex justify-between items-center">
                  <span>Question {index + 1}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isExpanded ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div 
                  id={`detailed-answer-${question.id}`}
                  className="p-4 border-t border-gray-200 bg-gray-50"
                >
                  <div className="mb-4">
                    <span className="font-medium text-gray-700">
                      Question:{" "}
                    </span>
                    <span className="text-gray-800 font-semibold">
                      {question.question}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="font-medium text-gray-700">
                      Your answer:{" "}
                    </span>
                    <span
                      className={
                        userAnswer && userAnswer.isCorrect
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {userAnswer ? userAnswer.selectedAnswer : "Not answered"}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="font-medium text-gray-700">
                      Correct answer:{" "}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {correctAnswer ? correctAnswer.text : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">
                      Explanation:{" "}
                    </span>
                    <span className="text-gray-600">
                      {question.explanation ||
                        question.explaination ||
                        "No explanation provided."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-center mt-8">
        <button 
          onClick={() => window.scrollTo({top: 0, behavior: 'auto'})}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition duration-150 ease-in-out"
        >
          Back to Top
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    const rewards = calculateRewards(score, totalQuestions);
    
    return (
      <div id="result-card" className="text-center m-0">
        <h2 className="text-2xl font-bold text-green-800 mb-3">Quiz Finished!</h2>
        <p id="final-score" className="text-xl text-gray-700 mb-4">
          You scored{" "}
          <span className="text-green-600 font-extrabold">
            {score} out of {totalQuestions}
          </span>
          ! <br />
          {resultMessage}
        </p>
        
        {/* Add rewards earned display */}
        <div className="space-y-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-lg font-semibold text-green-800">
               Points Earned: <span className="text-green-600">{rewards.points}</span>
            </p>
            <p className="text-sm text-green-600 mt-1">
              Keep learning to earn more points!
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-lg font-semibold text-yellow-800">
               Currency Earned: <span className="text-yellow-600">{rewards.currency}</span>
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Use currency to unlock premium features!
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            id="detailed-answers-btn"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:from-green-700 hover:to-green-800 transition duration-150 ease-in-out"
            onClick={toggleDetailedAnswers}
          >
            {showDetailedAnswers ? "Hide Answers" : "Show Answers"}
          </button>

          <button
            id="restart-btn"
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:from-amber-700 hover:to-amber-800 transition duration-150 ease-in-out"
            onClick={restartQuiz}
          >
            Play Again
          </button>
        </div>

        {showDetailedAnswers && renderDetailedAnswers()}
      </div>
    );
  };

  // --- Top-level render ---
  return (
    <>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-md mx-auto pb-20">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/learn">Learn</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>General Quiz</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div
            id="quiz-container"
            className="p-6"
          >
            {loading && (
              <div className="text-center py-8">
                  <img 
                  src="/loading.gif" 
                  alt="Loading..." 
                  className="h-64 w-64 mx-auto"
                />
                <p className="mt-4 text-gray-600">Loading quiz questions...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-600">
                <p className="mb-4">Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && totalQuestions === 0 && (
              <div className="text-center py-8">No quiz available.</div>
            )}
            {!loading &&
              !error &&
              (showResults ? renderResults() : renderQuiz())}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;