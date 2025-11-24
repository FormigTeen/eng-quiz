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

// --- MOCK DE PERGUNTAS (Banco de dados futuro) ---
const mockQuestions = [
  {
    id: 1,
    question: "Qual jogador é conhecido como 'Rei do Futebol'?",
    options: ["Maradona", "Pelé", "Messi", "Cristiano Ronaldo"],
    correct: 1 // Índice do array (Pelé)
  },
  {
    id: 2,
    question: "Em que ano o Brasil ganhou sua primeira Copa do Mundo?",
    options: ["1950", "1958", "1962", "1970"],
    correct: 1 // 1958
  },
  {
    id: 3,
    question: "Qual é a duração regulamentar de uma partida de futebol?",
    options: ["80 minutos", "90 minutos", "100 minutos", "120 minutos"],
    correct: 1 // 90 min
  },
  {
    id: 4,
    question: "Qual time brasileiro é conhecido como 'Timão'?",
    options: ["Palmeiras", "Santos", "Flamengo", "Corinthians"],
    correct: 3 // Corinthians
  }
];

const Quiz: React.FC = () => {
  const history = useHistory();

  // Estados do Jogo: 'intro' | 'countdown' | 'playing' | 'result'
  const [gameState, setGameState] = useState<'intro' | 'countdown' | 'playing' | 'result'>('intro');

  // Controle do Quiz
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdown, setCountdown] = useState(3); // Para a tela de preparação

  // --- LÓGICA DO JOGO ---

  // 1. Iniciar (Vai para contagem regressiva)
  const startQuiz = () => {
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
  const handleAnswer = (optionIndex: number) => {
    if (isChecked) return; // Evita clique duplo

    setSelectedOption(optionIndex);
    setIsChecked(true);

    const isCorrect = optionIndex === mockQuestions[currentQIndex].correct;

    if (isCorrect) {
      setScore(score + 100);
      setCorrectCount(correctCount + 1);
    }

    // Espera 1.5s para mostrar a cor (verde/vermelho) e passa para a próxima
    setTimeout(() => {
      if (currentQIndex < mockQuestions.length - 1) {
        nextQuestion();
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  const nextQuestion = () => {
    setCurrentQIndex(currentQIndex + 1);
    setSelectedOption(null);
    setIsChecked(false);
    setTimeLeft(15);
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
              <strong>{mockQuestions.length} questões</strong>
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
              Inciar Quiz
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
    const currentQ = mockQuestions[currentQIndex];
    const progress = (currentQIndex / mockQuestions.length);

    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg gray-bg">
          <div className="game-header">
            <div className="top-bar">
              <IonIcon icon={closeOutline} onClick={() => history.goBack()} />
              <div className="q-badge">⚡ {currentQIndex + 1}/{mockQuestions.length}</div>
              <div className={`timer-badge ${timeLeft < 5 ? 'danger' : ''}`}>
                <IonIcon icon={timeOutline} /> {timeLeft}s
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="progress-container">
              <small>Pergunta {currentQIndex + 1} de {mockQuestions.length}</small>
              <IonProgressBar value={progress} color="dark" className="thin-progress"></IonProgressBar>
            </div>

            {/* Pergunta */}
            <div className="question-card">
              <h3>{currentQ.question}</h3>
            </div>

            {/* Opções */}
            <div className="options-list">
              {currentQ.options.map((opt, index) => {
                let statusClass = '';
                if (isChecked) {
                  if (index === currentQ.correct) statusClass = 'correct'; // Sempre mostra o correto verde
                  else if (index === selectedOption && index !== currentQ.correct) statusClass = 'wrong'; // Se errou, mostra vermelho
                }

                return (
                  <div
                    key={index}
                    className={`option-btn ${statusClass} ${selectedOption === index ? 'selected' : ''}`}
                    onClick={() => handleAnswer(index)}
                  >
                    <span>{opt}</span>
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
            <span>{correctCount} de {mockQuestions.length} corretas</span>
          </div>
        </div>

        <div className="result-stats">
          <IonGrid>
            <IonRow>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c green"><IonIcon icon={statsChartOutline} /></div>
                  <span>Precisão</span>
                  <strong>{Math.round((correctCount / mockQuestions.length) * 100)}%</strong>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c orange"><IonIcon icon={ribbonOutline} /></div>
                  <span>Moedas</span>
                  <strong>+{Math.floor(score / 10)}</strong>
                </div>
              </IonCol>
              <IonCol size="4">
                <div className="res-card">
                  <div className="icon-c purple"><IonIcon icon={flashOutline} /></div>
                  <span>XP Ganho</span>
                  <strong>+{score}</strong>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          <div className="accuracy-box section-margin">
            <div className="acc-header">
              <span>Taxa de Acerto</span>
              <div className="tag-green">Done</div>
            </div>
            <IonProgressBar value={correctCount / mockQuestions.length} color="success"></IonProgressBar>
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