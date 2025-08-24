'use client'

import React, { useState, useEffect } from 'react';
import { Play, Settings, RotateCcw, ChevronRight, Volume2, Award, RefreshCw, Eye, EyeOff } from 'lucide-react';

const MusicScaleTrainer = () => {
  const notes = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
  const [level, setLevel] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [direction, setDirection] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [mistakes, setMistakes] = useState([]);
  const [isReview, setIsReview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [sequenceType, setSequenceType] = useState(''); // 'up' or 'down'
  const [expectedSequence, setExpectedSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [previousStartNote, setPreviousStartNote] = useState('');
  const [showStars, setShowStars] = useState(false);
  const [questionCount, setQuestionCount] = useState(5); // Default a 5 domande
  const [timerDuration, setTimerDuration] = useState(10); // Default a 10 secondi
  const [timeLeft, setTimeLeft] = useState(10); // Timer attuale
  const [timerActive, setTimerActive] = useState(false); // Timer spento di default
  const [timerEnabled, setTimerEnabled] = useState(false); // Nuovo stato per abilitare/disabilitare timer
  const [inputMode, setInputMode] = useState('keyboard'); // 'keyboard' o 'text'
  const [keyboardSequence, setKeyboardSequence] = useState([]); // Sequenza inserita via tastiera
  const [showInstructions, setShowInstructions] = useState(true); // Nuovo stato per le istruzioni
  const [previousSequenceType, setPreviousSequenceType] = useState(''); // Per evitare sequenze ripetute
  // Nuovo stato per la memoria delle domande recenti
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [maxRecentQuestions] = useState(15); // Memoria delle ultime 15 domande

  const getLevelDescription = (level) => {
    switch(level) {
      case 1: return "Note singole - Puoi guardare il cerchio";
      case 2: return "Note singole - Non guardare!";
      case 3: return "Sequenze complete - Con aiuto visivo";
      case 4: return "Sequenze complete - Solo memoria";
      default: return "";
    }
  };

  // Funzione per aggiornare la memoria delle domande
  const updateRecentQuestions = (question) => {
    const questionId = question.type === 'single' 
      ? `${question.note}-${question.direction}`
      : `${question.startNote}-${question.sequenceType}`;
    
    const questionWithId = { ...question, questionId };
    
    setRecentQuestions(prev => {
      const newRecent = [...prev, questionWithId];
      // Mantieni solo le ultime maxRecentQuestions domande
      if (newRecent.length > maxRecentQuestions) {
        return newRecent.slice(-maxRecentQuestions);
      }
      return newRecent;
    });
  };

  const generateQuestion = (reviewMistakes = []) => {
    let attempts = 0;
    const maxAttempts = 100; // Aumentato significativamente per evitare loop infiniti
    
    do {
      attempts++;
      
      if (level <= 2) {
        // Livelli 1 e 2: domande singole
        const questionPool = reviewMistakes.length > 0 ? reviewMistakes.map(m => m.note) : notes;
        const randomNote = questionPool[Math.floor(Math.random() * questionPool.length)];
        const directions = ['successiva', 'precedente'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        const newQuestion = {
          type: 'single',
          note: randomNote,
          direction: randomDirection,
          answer: getCorrectAnswer(randomNote, randomDirection)
        };
        
        // Controlla se la domanda è troppo recente
        const questionId = `${randomNote}-${randomDirection}`;
        const isRecent = recentQuestions.some(q => q.questionId === questionId);
        
        if (!isRecent) {
          return newQuestion;
        }
      } else {
        // Livelli 3 e 4: sequenze complete
        let startNote;
        let sequenceType;
        
        startNote = notes[Math.floor(Math.random() * notes.length)];
        const sequenceTypes = ['up', 'down'];
        sequenceType = sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)];
        
        const newQuestion = {
          type: 'sequence',
          startNote: startNote,
          sequenceType: sequenceType,
          expectedSequence: generateSequence(startNote, sequenceType)
        };
        
        // Controlla se la domanda è troppo recente
        const questionId = `${startNote}-${sequenceType}`;
        const isRecent = recentQuestions.some(q => q.questionId === questionId);
        
        if (!isRecent) {
          setPreviousStartNote(startNote);
          setPreviousSequenceType(sequenceType);
          return newQuestion;
        }
      }
      
      // Se abbiamo esaurito i tentativi, resetta la memoria
      if (attempts >= maxAttempts) {
        setRecentQuestions([]);
        attempts = 0;
      }
    } while (attempts < maxAttempts);
    
    // Fallback: genera una domanda qualsiasi
    return generateFallbackQuestion();
  };

  // Funzione fallback per generare domande quando la memoria è piena
  const generateFallbackQuestion = () => {
    if (level <= 2) {
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      const directions = ['successiva', 'precedente'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      
      return {
        type: 'single',
        note: randomNote,
        direction: randomDirection,
        answer: getCorrectAnswer(randomNote, randomDirection)
      };
    } else {
      const startNote = notes[Math.floor(Math.random() * notes.length)];
      const sequenceTypes = ['up', 'down'];
      const sequenceType = sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)];
      
      setPreviousStartNote(startNote);
      setPreviousSequenceType(sequenceType);
      
      return {
        type: 'sequence',
        startNote: startNote,
        sequenceType: sequenceType,
        expectedSequence: generateSequence(startNote, sequenceType)
      };
    }
  };

  const generateSequence = (startNote, type) => {
    const startIndex = notes.indexOf(startNote);
    const sequence = [];
    
    if (type === 'up') {
      // Dall'ottava sotto all'ottava corrente - includi 8 note (con ripetizione)
      for (let i = 0; i <= notes.length; i++) {
        const noteIndex = (startIndex + i) % notes.length;
        sequence.push(notes[noteIndex]);
      }
    } else {
      // Dall'ottava sopra all'ottava corrente - includi 8 note (con ripetizione)
      for (let i = 0; i <= notes.length; i++) {
        const noteIndex = (startIndex - i + notes.length) % notes.length;
        sequence.push(notes[noteIndex]);
      }
    }
    
    return sequence;
  };

  const getCorrectAnswer = (note, direction) => {
    const noteIndex = notes.indexOf(note);
    if (direction === 'successiva') {
      return notes[(noteIndex + 1) % notes.length];
    } else {
      return notes[(noteIndex - 1 + notes.length) % notes.length];
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setMistakes([]);
    setShowResults(false);
    setIsReview(false);
    setPreviousStartNote('');
    setPreviousSequenceType('');
    // Reset della memoria delle domande recenti
    setRecentQuestions([]);
    // Reset della tastiera all'inizio del gioco
    setKeyboardSequence([]);
    
    const newQuestions = Array.from({ length: questionCount }, () => generateQuestion());
    setQuestions(newQuestions);
    loadQuestion(newQuestions[0]);
  };

  const startReview = () => {
    if (mistakes.length === 0) return;
    
    setIsReview(true);
    setCurrentQuestion(0);
    setScore(0); // Reset score for review
    setShowResults(false); // Make sure results are hidden
    // Reset della memoria delle domande recenti
    setRecentQuestions([]);
    // Reset della tastiera per il ripasso
    setKeyboardSequence([]);
    setPreviousStartNote('');
    setPreviousSequenceType('');
    
    const reviewQuestions = mistakes.map(mistake => {
      if (mistake.type === 'single') {
        return {
          type: 'single',
          note: mistake.note,
          direction: mistake.direction,
          answer: mistake.correctAnswer
        };
      } else {
        return {
          type: 'sequence',
          startNote: mistake.startNote,
          sequenceType: mistake.sequenceType,
          expectedSequence: mistake.expectedSequence
        };
      }
    });
    
    setQuestions(reviewQuestions);
    loadQuestion(reviewQuestions[0]);
  };

  const loadQuestion = (question) => {
    // Aggiorna la memoria delle domande recenti
    updateRecentQuestions(question);
    
    if (question.type === 'single') {
      setCurrentNote(question.note);
      setDirection(question.direction);
      setUserAnswer('');
    } else {
      setCurrentNote(question.startNote);
      setSequenceType(question.sequenceType);
      setExpectedSequence(question.expectedSequence);
      setUserSequence([]);
      setUserAnswer('');
    }
    setFeedback('');
    // Reset sempre la tastiera per ogni nuova domanda
    setKeyboardSequence([]);
    
    if (timerEnabled) {
      setTimeLeft(timerDuration);
      setTimerActive(true);
    } else {
      setTimeLeft(0);
      setTimerActive(false);
    }
    
    // Assicurati che la tastiera sia sempre pronta
    console.log('Domanda caricata, tastiera resettata e pronta');
  };

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (timerEnabled && timerActive && timeLeft > 0 && !feedback) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setTimerActive(false);
            // Tempo scaduto - risposta automatica sbagliata
            if (!feedback) {
              setFeedback('incorrect');
              if (!isReview) {
                setMistakes([...mistakes, {
                  type: questions[currentQuestion]?.type === 'single' ? 'single' : 'sequence',
                  note: questions[currentQuestion]?.type === 'single' ? currentNote : currentNote,
                  direction: questions[currentQuestion]?.type === 'single' ? direction : '',
                  correctAnswer: questions[currentQuestion]?.type === 'single' ? questions[currentQuestion].answer : '',
                  startNote: questions[currentQuestion]?.type === 'sequence' ? currentNote : '',
                  sequenceType: questions[currentQuestion]?.type === 'sequence' ? sequenceType : '',
                  expectedSequence: questions[currentQuestion]?.type === 'sequence' ? expectedSequence : [],
                  userAnswer: 'Tempo scaduto'
                }]);
              }
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerEnabled, timerActive, timeLeft, feedback, currentQuestion, questions, mistakes, isReview, currentNote, direction, sequenceType, expectedSequence]);

  const checkAnswer = () => {
    if (questions[currentQuestion].type === 'single') {
      checkSingleAnswer();
    } else {
      checkSequenceAnswer();
    }
  };

  const checkSingleAnswer = () => {
    if (!userAnswer.trim()) return;
    
    setTimerActive(false); // Ferma il timer quando si risponde
    const correct = userAnswer.toLowerCase().trim() === questions[currentQuestion].answer;
    
    if (correct) {
      setFeedback('correct');
      setScore(score + 1);
      // Se è corretto, prosegui automaticamente dopo 1.5 secondi
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } else {
      setFeedback('incorrect');
      if (!isReview) {
        setMistakes([...mistakes, {
          type: 'single',
          note: currentNote,
          direction: direction,
          correctAnswer: questions[currentQuestion].answer,
          userAnswer: userAnswer
        }]);
      }
      // Se è sbagliato, non proseguire automaticamente
    }
  };

  const addNoteToSequence = (note) => {
    if (questions[currentQuestion]?.type !== 'sequence') return;
    
    // Non aggiungere la nota se è già nella sequenza
    if (keyboardSequence.includes(note)) return;
    
    const newSequence = [...keyboardSequence, note];
    setKeyboardSequence(newSequence);
    
    // Possibili lunghezze valide:
    // 1. Sequenza completa con 8 note (include ripetizione della nota iniziale)
    const fullLength = expectedSequence.length;
    // 2. Sequenza con 7 note (si ferma prima della ripetizione)
    const shortLength = expectedSequence.length - 1;
    
    if (newSequence.length === fullLength || newSequence.length === shortLength) {
      const sequenceToCheck = expectedSequence.slice(0, newSequence.length);
      const correct = newSequence.every((note, index) => note === sequenceToCheck[index]);
      
      if (correct) {
        setFeedback('correct');
        setScore(score + 1);
        // Se è corretto, prosegui automaticamente dopo 2 secondi
        setTimeout(() => {
          nextQuestion();
        }, 2000);
      } else {
        setFeedback('incorrect');
        if (!isReview) {
          setMistakes([...mistakes, {
            type: 'sequence',
            startNote: currentNote,
            sequenceType: sequenceType,
            expectedSequence: expectedSequence,
            userSequence: newSequence
          }]);
        }
        // Se è sbagliato, non proseguire automaticamente
      }
    }
  };

  const checkSequenceAnswer = () => {
    if (!userAnswer.trim()) return;
    
    setTimerActive(false); // Ferma il timer quando si risponde
    const inputNotes = userAnswer.toLowerCase().split(/[\s,]+/).map(n => n.trim()).filter(n => n);
    
    // Possibili sequenze corrette:
    // 1. Sequenza completa con 8 note (include ripetizione della nota iniziale)
    const fullSequence = [...expectedSequence];
    
    // 2. Sequenza con 7 note (si ferma prima della ripetizione)
    const shortSequence = expectedSequence.slice(0, -1);
    
    const correctFull = inputNotes.length === fullSequence.length && 
                       inputNotes.every((note, index) => note === fullSequence[index]);
                       
    const correctShort = inputNotes.length === shortSequence.length && 
                         inputNotes.every((note, index) => note === shortSequence[index]);
    
    if (correctFull || correctShort) {
      setFeedback('correct');
      setScore(score + 1);
      // Mostra stelline per risposta corretta
      setShowStars(true);
      setTimeout(() => {
        setShowStars(false);
        nextQuestion();
      }, 3000);
    } else {
      setFeedback('incorrect');
      if (!isReview) {
        setMistakes([...mistakes, {
          type: 'sequence',
          startNote: currentNote,
          sequenceType: sequenceType,
          expectedSequence: expectedSequence,
          userSequence: inputNotes
        }]);
      }
      // Se è sbagliato, non proseguire automaticamente
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      const nextQ = currentQuestion + 1;
      setCurrentQuestion(nextQ);
      // Reset della tastiera prima di caricare la prossima domanda
      setKeyboardSequence([]);
      loadQuestion(questions[nextQ]);
    } else {
      setShowResults(true);
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setShowResults(false);
    setIsReview(false);
    setCurrentQuestion(0);
    setScore(0);
    setMistakes([]);
    setPreviousStartNote('');
    setPreviousSequenceType('');
    // Reset della memoria delle domande recenti
    setRecentQuestions([]);
    // Reset della tastiera all'inizio del gioco
    setKeyboardSequence([]);
    
    if (timerEnabled) {
      setTimeLeft(timerDuration);
      setTimerActive(false);
    } else {
      setTimeLeft(0);
      setTimerActive(false);
    }
  };

  const shouldShowCircle = () => {
    return level === 1 || level === 3;
  };

  const getHiddenNotes = () => {
    if (level === 3) {
      return ['re', 'fa', 'la', 'do'];
    }
    return [];
  };

  const CircleView = () => {
    const hiddenNotes = getHiddenNotes();
    return (
      <div className="relative w-48 h-48 mx-auto mb-3">
        {/* Immagine personalizzata del cerchio delle note */}
        <img 
          src="/cerchio delle note.png" 
          alt="Cerchio delle note" 
          className="w-full h-full object-contain"
        />
        
        {/* Indicatore centrale per la direzione nelle sequenze */}
        {level >= 3 && questions[currentQuestion]?.type === 'sequence' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-3xl transition-all duration-700 ${
              sequenceType === 'up' ? 'text-green-500' : 'text-orange-500'
            }`}>
              {sequenceType === 'up' ? '↗' : '↙'}
            </div>
          </div>
        )}
        
        {/* Freccia direzionale per i livelli 1-2 */}
        {level <= 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-3xl transition-transform duration-500 text-blue-500 ${
              direction === 'successiva' ? 'rotate-0' : 'rotate-180'
            }`}>
              ↻
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleKeyClick = (note) => {
    if (feedback !== '') return; // Non permettere input durante il feedback
    
    // Prevenire chiamate multiple
    if (keyboardSequence.includes(note)) return;
    
    // Se è una domanda singola, controlla subito la risposta
    if (questions[currentQuestion]?.type === 'single') {
      setUserAnswer(note);
      // Controlla immediatamente la risposta senza chiamare checkAnswer()
      const correct = note.toLowerCase().trim() === questions[currentQuestion].answer;
      
      if (correct) {
        setFeedback('correct');
        setScore(score + 1);
        // Se è corretto, prosegui automaticamente dopo 1.5 secondi
        setTimeout(() => {
          nextQuestion();
        }, 1500);
      } else {
        setFeedback('incorrect');
        if (!isReview) {
          setMistakes([...mistakes, {
            type: 'single',
            note: currentNote,
            direction: direction,
            correctAnswer: questions[currentQuestion].answer,
            userAnswer: note
          }]);
        }
        // Se è sbagliato, non proseguire automaticamente
      }
    } else {
      // Se è una sequenza, aggiungi la nota alla sequenza
      setKeyboardSequence(prev => [...prev, note]);
      addNoteToSequence(note);
    }
  };

  // Componente tastiera virtuale
  const VirtualPiano = () => {
    const whiteKeys = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
    const blackKeys = ['do#', 're#', 'fa#', 'sol#', 'la#'];
    const blackKeyPositions = [0, 1, 3, 4, 5];
    
    // Versione mobile con tasti molto sottili
    const MobilePiano = () => (
      <div className="flex justify-center overflow-x-auto pb-2 px-1">
        <div className="relative inline-block">
          {/* Tasti bianchi - mobile sottili */}
          <div className="flex">
            {whiteKeys.map((note, index) => (
              <button
                key={`white-${note}`}
                onClick={() => handleKeyClick(note)}
                disabled={feedback !== ''}
                className={`w-8 h-16 bg-white border border-slate-300 rounded-b-lg mx-0.5 transition-all duration-200 ${
                  feedback !== ''
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
                } ${
                  keyboardSequence.includes(note) ? 'ring-2 ring-emerald-400' : ''
                }`}
                type="button"
              />
            ))}
          </div>
          
          {/* Tasti neri - mobile sottili */}
          <div className="absolute top-0">
            {blackKeys.map((note, index) => {
              const whiteKeyIndex = blackKeyPositions[index];
              // Calcolo per spostare i tasti neri in posizioni differenziate
              // w-8 = 32px, mx-0.5 = 2px, quindi spazio totale per tasto = 34px
              // Larghezza tasto nero = 24px
              let leftOffset;
              if (index === 0) {
                // do# - spostato di 1/4 larghezza a sinistra
                leftOffset = whiteKeyIndex * 34 + 27 - 6; // 27 - 6 = 21
              } else if (index === 3) {
                // sol# (quarto tasto) - spostato di 1/5 larghezza a sinistra
                leftOffset = whiteKeyIndex * 34 + 27 + 8 - 4.8; // 35 - 4.8 = 30.2
              } else if (index === 4) {
                // la# (quinto tasto) - spostato di 1/3 larghezza a destra
                leftOffset = whiteKeyIndex * 34 + 27 + 8; // 27 + 8 = 35
              } else {
                // re# e fa# - posizione normale
                leftOffset = whiteKeyIndex * 34 + 27;
              }
              
              return (
                <button
                  key={`black-${note}`}
                  onClick={() => handleKeyClick(note)}
                  disabled={feedback !== ''}
                  style={{ left: `${leftOffset}px` }}
                  className={`absolute w-6 h-10 bg-slate-800 border border-slate-600 rounded-b-lg transition-all duration-200 z-10 ${
                    feedback !== ''
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-slate-700 active:bg-slate-900 cursor-pointer'
                  } ${
                    keyboardSequence.includes(note) ? 'ring-2 ring-emerald-400' : ''
                  }`}
                  type="button"
                />
              );
            })}
          </div>
        </div>
      </div>
    );

    // Versione desktop con dimensioni proporzionate alla mobile
    const DesktopPiano = () => (
      <div className="flex justify-center overflow-x-auto pb-4 px-1">
        <div className="relative inline-block">
          {/* Tasti bianchi - desktop proporzionati alla mobile */}
          <div className="flex">
            {whiteKeys.map((note, index) => (
              <button
                key={`white-${note}`}
                onClick={() => handleKeyClick(note)}
                disabled={feedback !== ''}
                className={`w-12 h-20 md:w-14 md:h-24 lg:w-16 lg:h-28 bg-white border border-slate-300 rounded-b-lg mx-0.5 transition-all duration-200 ${
                  feedback !== ''
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-100 active:bg-slate-200 cursor-pointer'
                } ${
                  keyboardSequence.includes(note) ? 'ring-2 ring-emerald-400' : ''
                }`}
                type="button"
              />
            ))}
          </div>
          
          {/* Tasti neri - desktop proporzionati alla mobile */}
          <div className="absolute top-0">
            {blackKeys.map((note, index) => {
              const whiteKeyIndex = blackKeyPositions[index];
              let leftOffset;
              
              // Calcolo proporzionato basato sulla tastiera mobile
              // Mobile: w-8 (32px) + mx-0.5 (2px) = 34px per tasto
              // Desktop: proporzioni mantenute per ogni breakpoint
              // Offset personalizzati per ogni tasto nero
              let baseOffset;
              if (index === 0) {
                // do# - spostato di 1/5 larghezza a destra
                baseOffset = 4.8; // 1/5 * 24px = 4.8px
              } else if (index === 1) {
                // re# - spostato di 1/4 larghezza a destra
                baseOffset = 6;
              } else if (index === 2) {
                // fa# - spostato di 1/3 larghezza a destra
                baseOffset = 8;
              } else if (index === 3) {
                // sol# - spostato di 2/3 - 1/5 = 7/15 larghezza a destra
                baseOffset = 11.2; // 7/15 * 24px = 11.2px
              } else if (index === 4) {
                // la# - spostato di 2/4 = 1/2 larghezza a destra
                baseOffset = 12; // 1/2 * 24px = 12px
              }
              
              if (window.innerWidth < 768) {
                // Small: w-12 (48px) + mx-0.5 (2px) = 50px per tasto
                leftOffset = whiteKeyIndex * 50 + 25 + (baseOffset * 1.47); // 1.47 = 50/34
              } else if (window.innerWidth < 1024) {
                // Medium: w-14 (56px) + mx-0.5 (2px) = 58px per tasto
                leftOffset = whiteKeyIndex * 58 + 29 + (baseOffset * 1.71); // 1.71 = 58/34
              } else {
                // Large: w-16 (64px) + mx-0.5 (2px) = 66px per tasto
                leftOffset = whiteKeyIndex * 66 + 33 + (baseOffset * 1.94); // 1.94 = 66/34
              }
              
              return (
                <button
                  key={`black-${note}`}
                  onClick={() => handleKeyClick(note)}
                  disabled={feedback !== ''}
                  style={{ left: `${leftOffset}px` }}
                  className={`absolute w-8 h-12 md:w-10 md:h-14 lg:w-12 lg:h-16 bg-slate-800 border border-slate-600 rounded-b-lg transition-all duration-200 z-10 ${
                    feedback !== ''
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-slate-700 active:bg-slate-900 cursor-pointer'
                  } ${
                    keyboardSequence.includes(note) ? 'ring-2 ring-emerald-400' : ''
                  }`}
                  type="button"
                />
              );
            })}
          </div>
        </div>
      </div>
    );

    // Scegli versione in base alla dimensione schermo
    return (
      <>
        {/* Versione mobile (sempre visibile su mobile) */}
        <div className="block sm:hidden">
          <MobilePiano />
        </div>
        
        {/* Versione desktop (visibile solo su schermi più grandi) */}
        <div className="hidden sm:block">
          <DesktopPiano />
        </div>
      </>
    );
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-4xl w-full text-center border border-slate-600">
          <div className="flex justify-center mb-8">
            <img 
              src="/Logo sip bianco verticale.png" 
              alt="Logo Il Cerchio delle Note" 
              className="h-32 object-contain animate-logo-entrance"
            />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Il Cerchio delle Note
          </h1>
          
          {/* Configurazione semplice - ottimizzata per mobile */}
          <div className="bg-slate-700 rounded-2xl p-4 mb-6 border border-slate-600">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">Livello</div>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-500 focus:border-emerald-400 focus:outline-none text-center text-sm"
                >
                  <option value={1}>1 - Note singole con cerchio</option>
                  <option value={2}>2 - Note singole senza cerchio</option>
                  <option value={3}>3 - Sequenze con aiuto</option>
                  <option value={4}>4 - Sequenze senza aiuto</option>
                </select>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">Domande</div>
                <select 
                  value={questionCount} 
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-500 focus:border-emerald-400 focus:outline-none text-center text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">Timer</div>
                <select 
                  value={timerEnabled ? timerDuration : 0} 
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setTimerEnabled(value > 0);
                    if (value > 0) setTimerDuration(value);
                  }}
                  className="w-full bg-slate-600 text-slate-200 px-3 py-2 rounded-lg border border-slate-500 focus:border-emerald-400 focus:outline-none text-center text-sm"
                >
                  <option value={0}>Off</option>
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Istruzioni semplici */}
          <div className="mb-8">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full bg-slate-600 text-slate-200 py-3 px-6 rounded-xl font-medium hover:bg-slate-500 transition-colors border border-slate-500"
            >
              {showInstructions ? '▼' : '▶'} Istruzioni
            </button>
            
            {showInstructions && (
              <div className="mt-4 p-4 bg-slate-700 rounded-xl border border-slate-500 text-left">
                <div className="space-y-2 text-slate-200 text-sm">
                  <div>• <strong>Inizia dal livello 1</strong> rispondendo alle domande aiutandoti con il cerchio</div>
                  <div>• <strong>Osserva e rispondi</strong> finché non riesci quasi ad anticipare la risposta</div>
                  <div>• <strong>Alterna</strong> il ritrovamento delle note sulla tastiera virtuale e come testo</div>
                  <div>• <strong>Poi passa</strong> al livello 2 e successivi</div>
                  <div>• <strong>Non partire dal Do</strong> per fare i conteggi perché non servirebbe</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottone principale */}
          <button 
            onClick={startGame} 
            className="w-full bg-emerald-500 text-white py-4 px-8 rounded-xl font-bold text-xl hover:bg-emerald-600 transition-colors transform hover:scale-105"
          >
            Inizia Gioco
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border border-slate-600">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Award className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-200 mb-6">
            {isReview ? 'Ripasso Completato!' : 'Livello Completato!'}
          </h2>
          
          <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-6 mb-8 border border-slate-500">
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-slate-300 font-medium">Risposte corrette</div>
          </div>
          
          {mistakes.length > 0 && !isReview && (
            <div className="mb-8">
              <h3 className="font-bold text-slate-200 mb-4 text-lg">Errori commessi:</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {mistakes.map((mistake, index) => (
                  <div key={index} className="text-sm bg-slate-700 p-4 rounded-lg border border-slate-500">
                    {mistake.type === 'single' ? (
                      <>
                        <div className="text-red-300 font-medium">
                          Nota {mistake.direction} al <strong>{mistake.note}</strong>
                        </div>
                        <div className="text-slate-300 mt-1">
                          Hai risposto: <span className="text-red-400 font-medium">{mistake.userAnswer}</span>
                        </div>
                        <div className="text-slate-300">
                          Risposta corretta: <span className="text-emerald-400 font-medium">{mistake.correctAnswer}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-red-300">
                          Sequenza da <strong>{mistake.startNote}</strong> verso {mistake.sequenceType === 'up' ? 'l\'alto' : 'il basso'}
                        </div>
                        <div className="text-slate-300 mt-1">
                          Sequenza corretta: <span className="text-emerald-400 font-medium">{mistake.expectedSequence.join(' - ')}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {mistakes.length > 0 && !isReview && (
              <button
                onClick={startReview}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <RefreshCw className="w-6 h-6" />
                Ripassa Errori
              </button>
            )}
            
            <button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-8 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <RotateCcw className="w-6 h-6" />
              Nuovo Gioco
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header compatto */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={resetGame}
              className="w-8 h-8 bg-slate-700 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 border border-slate-500 hover:bg-slate-600"
            >
              <RotateCcw className="w-4 h-4 text-slate-300" />
            </button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {isReview ? 'Ripasso Errori' : `Il Cerchio delle Note`}
              </h1>
              <div className="text-xs text-slate-300 font-medium">
                Domanda {currentQuestion + 1} di {questions.length}
              </div>
              {level === 1 && (
                <div className="text-xs text-amber-400 mt-1 font-medium">
                  💡 Suggerimento: Prova a non guardare il cerchio!
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {score}
            </div>
            <div className="text-xs text-slate-300 font-medium">Punteggio</div>
          </div>
        </div>

        {/* Progress bar compatta */}
        <div className="w-full bg-slate-700 rounded-full h-2 mb-3 shadow-inner border border-slate-500">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Game area compatta */}
        <div className="bg-slate-800 rounded-2xl shadow-xl p-4 border border-slate-600 max-h-[75vh] overflow-y-auto">
          {shouldShowCircle() && <CircleView />}
          
          {/* Mostra tastiera o campo testo per livelli 1-2 (note singole) */}
          {level <= 2 && (
            <div className="mb-4">
              {/* Toggle per scegliere modalità input */}
              <div className="text-center mb-3">
                <div className="inline-flex bg-slate-700 rounded-lg p-1 border border-slate-500">
                  <button
                    onClick={() => setInputMode('keyboard')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      inputMode === 'keyboard'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    🎹 Tastiera
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      inputMode === 'text'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    ✏️ Testo
                  </button>
                </div>
              </div>

              {/* Tastiera Virtuale */}
              {inputMode === 'keyboard' && (
                <div>
                  <div className="text-center mb-2">
                    <h3 className="text-base font-bold text-slate-200 mb-1">🎹 Tastiera Virtuale</h3>
                  </div>
                  
                  <VirtualPiano />
                </div>
              )}


            </div>
          )}


          
          {/* Question area compatta */}
          <div className="text-center">
            {questions[currentQuestion]?.type === 'single' ? (
              <>
                <h2 className="text-2xl font-bold text-slate-200 mb-4">
                  Qual è la nota <span className="text-emerald-400">{direction}</span> al{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {currentNote}
                  </span>?
                </h2>
                
                {/* Timer display - posizionato vicino alla risposta */}
                {timerEnabled && timerActive && (
                  <div className="mb-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-full border border-slate-500">
                      <div className="w-5 h-5">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                          <polyline points="12,6 12,12 16,14" strokeWidth="2"></polyline>
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-slate-200">
                        {timeLeft}
                      </span>
                      <span className="text-slate-300 text-xs">sec</span>
                    </div>
                  </div>
                )}
                
                {inputMode === 'text' && (
                  <div className="max-w-sm mx-auto">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                      placeholder="Scrivi la nota..."
                      className={`w-full p-4 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 ${
                        feedback === 'correct' 
                          ? 'border-green-400 bg-green-50 focus:ring-green-200' 
                          : feedback === 'incorrect' 
                          ? 'border-red-400 bg-red-50 focus:ring-red-200' 
                          : 'border-slate-300 bg-slate-50 focus:ring-slate-200'
                      }`}
                      disabled={feedback !== ''}
                    />
                    
                    {!feedback && (
                      <button
                        onClick={checkAnswer}
                        disabled={!userAnswer.trim()}
                        className="mt-4 bg-emerald-500 text-white py-3 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mx-auto hover:bg-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                      >
                        Conferma
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-200 mb-3">
                  Percorri la scala partendo da{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {currentNote}
                  </span>
                </h2>
                <p className="text-base text-slate-300 mb-4">
                  Direzione: {sequenceType === 'up' ? '↗ Verso l\'ottava superore' : '↙ Verso l\'ottava inferiore'}
                </p>
                
                {/* Timer display - posizionato vicino alla risposta */}
                {timerEnabled && timerActive && (
                  <div className="mb-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-full border border-slate-500">
                      <div className="w-5 h-5">
                        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                          <polyline points="12,6 12,12 16,14" strokeWidth="2"></polyline>
                        </svg>
                      </div>
                      <span className="text-xl font-bold text-slate-200">
                        {timeLeft}
                      </span>
                      <span className="text-slate-300 text-xs">sec</span>
                    </div>
                  </div>
                )}
                
                {/* Campo di testo per sequenze (livelli 3-4) */}
                <div className="max-w-2xl mx-auto">
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={currentQuestion === 0 ? "Scrivi: do re mi fa sol la si do" : ""}
                    className={`w-full p-4 text-center text-lg font-medium border-3 rounded-xl focus:outline-none focus:ring-4 transition-all duration-300 h-24 resize-none ${
                      feedback === 'correct' 
                        ? 'border-emerald-400 bg-emerald-900/20 focus:ring-emerald-900/30' 
                        : feedback === 'incorrect' 
                        ? 'border-red-400 bg-red-900/20 focus:ring-red-900/30' 
                        : 'border-slate-500 bg-slate-700 focus:ring-slate-600'
                    } text-slate-200 placeholder-slate-400`}
                    disabled={feedback !== ''}
                  />
                  
                  {!feedback && (
                    <button
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim()}
                      className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mx-auto hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      Conferma Sequenza
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </>
            )}
            
            {/* Feedback area compatta */}
            {feedback && (
              <div className={`mt-8 p-6 rounded-xl text-lg font-medium ${
                feedback === 'correct' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {feedback === 'correct' ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <span>Perfetto!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="text-2xl">❌</span>
                      <span>Non è corretto!</span>
                    </div>
                    <div className="text-base mb-4 bg-white bg-opacity-50 rounded-lg p-3">
                      {questions[currentQuestion]?.type === 'single' ? `La risposta corretta è: ${questions[currentQuestion].answer}` : `Sequenza corretta: ${expectedSequence.join(' → ')}` }
                    </div>
                    <button onClick={nextQuestion} className="bg-red-600 hover:bg-red-700 text-white py-3 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-105">
                      Continua
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicScaleTrainer;