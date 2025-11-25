import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonProgressBar, IonHeader, IonToolbar, IonButtons, IonBackButton
} from '@ionic/react';
import {
  closeOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, trophyOutline, ribbonOutline,
  statsChartOutline, flashOutline, arrowRedoOutline, homeOutline,
  globeOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Quiz.css';
import { apiGet, apiPost } from '../api/client';
import { useAuth } from '../hooks/useAuth';

type EngineOption = { text: string };
type EngineQuestion = { uuid: string; text: string; options: EngineOption[] };
type RandomQuizResponse = { uuid: string; questions: EngineQuestion[] };
type TrackResponse = { correct: string | null };
type PickResponse = { positive: number; negative: number };

const Quiz: React.FC = () => {
  const history = useHistory();
  const { token } = useAuth();

  // Estados do Jogo: 'intro' | 'countdown' | 'playing' | 'result'
  const [gameState, setGameState] = useState<'intro' | 'countdown' | 'playing' | 'result'>('intro');

  // Controle do Quiz
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizUUID, setQuizUUID] = useState<string | null>(null);
  const [questions, setQuestions] = useState<EngineQuestion[]>([]);
  const [currentCorrectText, setCurrentCorrectText] = useState<string | null>(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdown, setCountdown] = useState(3); // Para a tela de preparação

  // --- LÓGICA DO JOGO ---

  // 1. Iniciar (Vai para contagem regressiva)
  const startQuiz = async () => {
    try {
      const res = await apiGet<RandomQuizResponse>('/engine/v1/quiz/random', token || undefined);
      setQuizUUID(res.uuid);
      setQuestions(res.questions || []);
      if (!res.questions || res.questions.length === 0) {
        // Não inicia se não houver perguntas
        return;
      }
      setGameState('countdown');
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setGameState('playing');
        }
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Timer da Pergunta
  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0 && !isChecked) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isChecked) {
      // Acabou o tempo: conta como erro e avança
      handleAnswer(-1);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isChecked]);

  // 3. Responder
  const handleAnswer = async (optionIndex: number) => {
    if (isChecked) return; // Evita clique duplo

    setSelectedOption(optionIndex);
    setIsChecked(true);
    const q = questions[currentQIndex];
    try {
      const chosenText = optionIndex >= 0 ? (q?.options?.[optionIndex]?.text || '') : '';
      const track = await apiPost<TrackResponse>('/engine/v1/track', {
        quiz_uuid: quizUUID,
        question_uuid: q?.uuid,
        answer: chosenText
      }, token || undefined);
      const correctText = track?.correct || null;
      setCurrentCorrectText(correctText);
      if (optionIndex >= 0 && correctText && chosenText === correctText) {
        setScore(prev => prev + 100);
        setCorrectCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }

    // Espera 1.5s para mostrar a cor (verde/vermelho) e passa para a próxima
    setTimeout(async () => {
      if (currentQIndex < (questions.length - 1)) {
        nextQuestion();
      } else {
        setGameState('result');
        try {
          if (quizUUID) {
            const res = await apiPost<PickResponse>('/engine/v1/pick', { quiz_uuid: quizUUID }, token || undefined);
            setCorrectCount(res.positive);
            setScore(res.positive * 100);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }, 1500);
  };

  const nextQuestion = () => {
    setCurrentQIndex(currentQIndex + 1);
    setSelectedOption(null);
    setIsChecked(false);
    setTimeLeft(15);
    setCurrentCorrectText(null);
  };

  const resetGame = () => {
    setGameState('intro');
    setCurrentQIndex(0);
    setScore(0);
    setCorrectCount(0);
    setTimeLeft(15);
    setCountdown(3);
    setIsChecked(false);
    setSelectedOption(null);
    setQuizUUID(null);
    setQuestions([]);
    setCurrentCorrectText(null);
  };

  // --- RENDERIZAÇÃO DAS TELAS ---

  // TELA 1: INTRODUÇÃO
  if (gameState === 'intro') {
    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg">
          <div className="intro-header">
            <IonButton fill="clear" className="back-btn" onClick={() => history.goBack()}>
              <IonIcon icon={closeOutline} />
            </IonButton>
            <div className="globe-icon">
              <IonIcon icon={globeOutline} />
            </div>
            <h1>Geral</h1>
            <p>Quiz de Conhecimentos</p>
          </div>

          <div className="intro-card-container">
            <div className="info-row">
              <span>Total de Perguntas</span>
              <strong>{(questions && questions.length > 0) ? questions.length : 5} questões</strong>
            </div>
            <div className="info-row">
              <span>Tempo por Pergunta</span>
              <strong>15 segundos</strong>
            </div>
            <div className="info-row">
              <span>Pontos por Acerto</span>
              <strong className="green-text">+100 pontos</strong>
            </div>

            <div className="instructions-box">
              <h4>Instruções:</h4>
              <ul>
                <li>• Responda todas as perguntas no tempo limite</li>
                <li>• Cada resposta correta vale 100 pontos</li>
                <li>• Não é possível voltar às perguntas anteriores</li>
                <li>• Boa sorte! ⚽</li>
              </ul>
            </div>
          </div>

          <div className="bottom-action">
            <IonButton expand="block" className="start-btn" onClick={startQuiz}>
              Iniciar Quiz
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // TELA 2: CONTAGEM REGRESSIVA
  if (gameState === 'countdown') {
    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg white-bg">
          {/* MUDANÇA: Criei essa DIV wrapper com a classe centered-content */}
          <div className="centered-content">
            <div className="countdown-circle">
              <span>{countdown}</span>
              <small>segundos</small>
            </div>
            <div className="countdown-text">
              <h2>Prepare-se!</h2>
              <p>O quiz começará em instantes...</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // TELA 3: JOGO (PLAYING)
  if (gameState === 'playing') {
    const currentQ = questions[currentQIndex];
    const progress = (questions.length > 0) ? (currentQIndex / questions.length) : 0;

    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg gray-bg">
          <div className="game-header">
            <div className="top-bar">
              <IonIcon icon={closeOutline} onClick={() => history.goBack()} />
              <div className="q-badge">⚡ {currentQIndex + 1}/{questions.length || 5}</div>
              <div className={`timer-badge ${timeLeft < 5 ? 'danger' : ''}`}>
                <IonIcon icon={timeOutline} /> {timeLeft}s
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="progress-container">
              <small>Pergunta {currentQIndex + 1} de {questions.length || 5}</small>
              <IonProgressBar value={progress} color="dark" className="thin-progress"></IonProgressBar>
            </div>

            {/* Pergunta */}
            <div className="question-card">
              <h3>{currentQ?.text}</h3>
            </div>

            {/* Opções */}
            <div className="options-list">
              {currentQ?.options?.map((opt, index) => {
                let statusClass = '';
                if (isChecked) {
                  const correctIndex = currentCorrectText && currentQ?.options ? currentQ.options.findIndex(o => o.text === currentCorrectText) : -1;
                  if (index === correctIndex) statusClass = 'correct';
                  else if (index === selectedOption && index !== correctIndex) statusClass = 'wrong';
                }

                return (
                  <div
                    key={index}
                    className={`option-btn ${statusClass} ${selectedOption === index ? 'selected' : ''}`}
                    onClick={() => handleAnswer(index)}
                  >
                    <span>{opt.text}</span>
                    {statusClass === 'correct' && <IonIcon icon={checkmarkCircleOutline} />}
                    {statusClass === 'wrong' && <IonIcon icon={closeCircleOutline} />}
                  </div>
                )
              })}
            </div>
          </div>
        </IonContent>
      </IonPage>
    )
  }

  // TELA 4: RESULTADO
  return (
    <IonPage>
      <IonContent fullscreen className="quiz-bg white-bg">
        <div className="result-header">
          <p>Sua Pontuação</p>
          <h1>{score}</h1>
          <div className="sub-result">
            <IonIcon icon={trophyOutline} />
            <span>{correctCount} de {(questions && questions.length > 0) ? questions.length : 5} corretas</span>
          </div>
        </div>

        <div className="result-stats">
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c green"><IonIcon icon={statsChartOutline} /></div>
                  <span>Precisão</span>
                  <strong>{(() => { const denom = (questions && questions.length > 0) ? questions.length : 5; return denom > 0 ? Math.round((correctCount / denom) * 100) : 0; })()}%</strong>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c orange"><IonIcon icon={ribbonOutline} /></div>
                  <span>Moedas</span>
                  <div className="tag-red">Em breve</div>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c purple"><IonIcon icon={flashOutline} /></div>
                  <span>XP Ganho</span>
                  <div className="tag-red">Em breve</div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          <div className="accuracy-box section-margin">
            <div className="acc-header">
              <span>Taxa de Acerto</span>
              <div className="tag-green">Done</div>
            </div>
            <IonProgressBar value={(questions && questions.length > 0) ? (correctCount / questions.length) : (correctCount / 5)} color="success"></IonProgressBar>
          </div>

          <div className="action-buttons section-margin">
            <IonRow>
              <IonCol>
                <IonButton expand="block" fill="outline" color="medium" onClick={() => history.replace('/app/home')}>
                  <IonIcon slot="start" icon={homeOutline} /> Início
                </IonButton>
              </IonCol>
              <IonCol>
                <IonButton expand="block" color="success" onClick={resetGame}>
                  <IonIcon slot="start" icon={arrowRedoOutline} /> Jogar Novamente
                </IonButton>
              </IonCol>
            </IonRow>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Quiz;
