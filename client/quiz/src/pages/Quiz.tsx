import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonProgressBar, IonHeader, IonToolbar, IonButtons, IonBackButton, IonSpinner, IonTitle
} from '@ionic/react';
import {
  closeOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, trophyOutline, ribbonOutline,
  statsChartOutline, flashOutline, arrowRedoOutline, homeOutline,
  globeOutline
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom'; // <--- ADICIONEI useParams
import './Quiz.css';
import { useAuth } from '../hooks/useAuth';

// --- TIPOS (Adaptados para o Strapi) ---

// Tipo do dado puro que vem do Strapi
type StrapiQuestion = {
  id: number;
  documentId: string;
  enunciado: string;
  opcaoA: string;
  opcaoB: string;
  opcaoC: string;
  opcaoD: string;
  respostaCorreta: 'A' | 'B' | 'C' | 'D';
};

// Tipo interno usado pelo seu layout (Mantive sua estrutura, adicionei o correctIndex)
type EngineOption = { text: string };
type EngineQuestion = {
  uuid: string;
  text: string;
  options: EngineOption[];
  correctIndex: number; // Armazena qual o índice certo (0, 1, 2 ou 3)
};

const Quiz: React.FC = () => {
  const history = useHistory();
  const { teamId } = useParams<{ teamId: string }>(); // <--- PEGA O ID DO TIME
  const { user } = useAuth(); // Mantive caso precise do user depois

  // Estados do Jogo
  const [gameState, setGameState] = useState<'intro' | 'loading' | 'countdown' | 'playing' | 'result'>('intro');

  const location = useLocation<{ themeColor?: string; teamName?: string }>();
  const themeColor = location.state?.themeColor || '#428cff'; // Cor padrão (azul) se não vier nada
  const themeName = location.state?.teamName;

  // Controle do Quiz
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [questions, setQuestions] = useState<EngineQuestion[]>([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState(15);
  const [countdown, setCountdown] = useState(3);

  // --- FUNÇÃO AUXILIAR: EMBARALHAR PERGUNTAS ---
  const shuffleArray = (array: any[]) => {
    return array.sort(() => Math.random() - 0.5);
  };

  // --- LÓGICA DO JOGO ---

  // 1. Iniciar (Busca no Strapi -> Converte -> Inicia Countdown)
  const startQuiz = async () => {
    setGameState('loading'); // Mostra spinner enquanto busca
    try {
      // Define a URL baseada se tem ID do time ou não
      let url = 'http://localhost:1337/api/perguntas';

      if (teamId) {
        // Filtra pelo Time se tiver ID
        url = `http://localhost:1337/api/perguntas?filters[equipe][documentId][$eq]=${teamId}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.data || result.data.length === 0) {
        alert("Nenhuma pergunta encontrada para este tema ainda!");
        setGameState('intro');
        return;
      }

      // CONVERSÃO MÁGICA: Strapi -> Formato do seu Quiz
      const loadedQuestions: EngineQuestion[] = result.data.map((q: StrapiQuestion) => {
        // Mapeia letras A,B,C,D para índices 0,1,2,3
        const mapAnswer: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

        return {
          uuid: q.documentId,
          text: q.enunciado,
          options: [
            { text: q.opcaoA },
            { text: q.opcaoB },
            { text: q.opcaoC },
            { text: q.opcaoD }
          ],
          correctIndex: mapAnswer[q.respostaCorreta] // Guarda a resposta certa localmente
        };
      });

      // Embaralha as perguntas para não ser sempre a mesma ordem
      const randomizedQuestions = shuffleArray(loadedQuestions);

      // Limita a 10 perguntas se tiver muitas (opcional)
      const finalQuestions = randomizedQuestions.slice(0, 10);

      setQuestions(finalQuestions);

      // Inicia contagem regressiva
      setGameState('countdown');
      let count = 3;
      setCountdown(3); // Garante reset visual
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          setGameState('playing');
        }
      }, 1000);

    } catch (e) {
      console.error("Erro ao buscar do Strapi:", e);
      alert("Erro de conexão com o servidor.");
      setGameState('intro');
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
      handleAnswer(-1); // Tempo esgotou
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isChecked]);

  // 3. Responder (Validação Local)
  const handleAnswer = (optionIndex: number) => {
    if (isChecked) return; // Evita clique duplo

    setSelectedOption(optionIndex);
    setIsChecked(true);

    const currentQ = questions[currentQIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    // Atualiza pontuação
    if (isCorrect) {
      setScore(prev => prev + 100);
      setCorrectCount(prev => prev + 1);
    }

    // Espera 1.5s visualizando o acerto/erro e avança
    setTimeout(() => {
      if (currentQIndex < (questions.length - 1)) {
        nextQuestion();
      } else {
        setGameState('result');
        // Se quiser salvar o score no banco depois, faria um POST aqui
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
    setQuestions([]);
  };

  // --- RENDERIZAÇÃO ---

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
              <IonIcon icon={teamId ? trophyOutline : globeOutline} />
            </div>
            <h1>{teamId ? 'Quiz do Time' : 'Jogo Rápido'}</h1>
            <p>{teamId ? 'Mostre que sabe tudo!' : 'Perguntas Gerais'}</p>
          </div>

          <div className="intro-card-container">
            <div className="info-row">
              <span>Questões</span>
              <strong>Aleatórias</strong>
            </div>
            <div className="info-row">
              <span>Tempo</span>
              <strong>15s / pergunta</strong>
            </div>
            <div className="info-row">
              <span>Prêmio</span>
              <strong className="green-text">+100 pts</strong>
            </div>

            <div className="instructions-box">
              <h4>Como jogar:</h4>
              <ul>
                <li>• Selecione a alternativa correta</li>
                <li>• Seja rápido para pontuar</li>
                <li>• Divirta-se!</li>
              </ul>
            </div>
          </div>

          <div className="bottom-action">
            <IonButton expand="block" className="start-btn" onClick={startQuiz}>
              COMEÇAR AGORA
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // TELA: CARREGANDO (Spinner)
  if (gameState === 'loading') {
    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg white-bg centered-content">
          <IonSpinner name="crescent" color="primary" />
          <p style={{ marginTop: 20 }}>Buscando perguntas...</p>
        </IonContent>
      </IonPage>
    );
  }

  // TELA 2: CONTAGEM REGRESSIVA
  if (gameState === 'countdown') {
    return (
      <IonPage>
        <IonContent fullscreen className="quiz-bg white-bg">
          <div style={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', height: '100%'
          }}>
            <div className="countdown-circle">
              <span>{countdown}</span>
            </div>
            <div className="countdown-text" style={{ textAlign: 'center', marginTop: 20 }}>
              <h2>Prepare-se!</h2>
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
              <IonIcon icon={closeOutline} onClick={() => setGameState('result')} /> {/* Atalho para sair */}
              <div className="q-badge">⚡ {currentQIndex + 1}/{questions.length}</div>
              <div className={`timer-badge ${timeLeft < 5 ? 'danger' : ''}`}>
                <IonIcon icon={timeOutline} /> {timeLeft}s
              </div>
            </div>

            <div className="progress-container">
              <IonProgressBar value={progress} color="dark" className="thin-progress"></IonProgressBar>
            </div>

            <div className="question-card">
              <h3>{currentQ?.text}</h3>
            </div>

            <div className="options-list">
              {currentQ?.options?.map((opt, index) => {
                let statusClass = '';
                const isCorrectAnswer = index === currentQ.correctIndex;
                const isSelected = selectedOption === index;

                // Lógica das Classes CSS (para ícones e background)
                if (isChecked) {
                  if (isCorrectAnswer) statusClass = 'correct';
                  else if (isSelected && !isCorrectAnswer) statusClass = 'wrong';
                }

                // LÓGICA DAS CORES (Prioridade: Correto/Errado > Cor do Time)
                let finalBorderColor = 'transparent';
                let finalBoxShadow = '';

                if (isChecked) {
                  if (statusClass === 'correct') {
                    finalBorderColor = '#2dd36f'; // Verde (Sucesso)
                    finalBoxShadow = '0 0 15px rgba(45, 211, 111, 0.4)';
                  } else if (statusClass === 'wrong') {
                    finalBorderColor = '#eb445a'; // Vermelho (Erro)
                    finalBoxShadow = '0 0 15px rgba(235, 68, 90, 0.4)';
                  } else if (isSelected) {
                    // Caso raro onde está selecionado mas não caiu nas lógicas acima
                    finalBorderColor = themeColor;
                  }
                } else {
                  // Ainda não respondeu, mas selecionou (efeito de hover/active)
                  if (isSelected) {
                    finalBorderColor = themeColor;
                    finalBoxShadow = `0 0 10px ${themeColor}`;
                  }
                }

                return (
                  <div
                    key={index}
                    className={`option-btn ${statusClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswer(index)}
                    style={{
                      borderColor: finalBorderColor,
                      boxShadow: finalBoxShadow,
                      // Se estiver errado, o fundo fica levemente vermelho, se não, usa lógica padrão
                      backgroundColor: (statusClass === 'wrong' && isSelected) ? 'rgba(235, 68, 90, 0.1)' :
                        (isSelected ? 'rgba(255,255,255,0.05)' : '')
                    }}
                  >
                    <span>{opt.text}</span>

                    {/* Ícones */}
                    {statusClass === 'correct' && <IonIcon icon={checkmarkCircleOutline} style={{ color: '#2dd36f' }} />}
                    {statusClass === 'wrong' && <IonIcon icon={closeCircleOutline} style={{ color: '#eb445a' }} />}
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
          <p>Resultado Final</p>
          <h1>{score} pts</h1>
          <div className="sub-result">
            <IonIcon icon={trophyOutline} />
            <span>{correctCount} de {questions.length} acertos</span>
          </div>
        </div>

        <div className="result-stats">
          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <div className="res-card">
                  <div className="icon-c green"><IonIcon icon={statsChartOutline} /></div>
                  <span>Precisão</span>
                  <strong>{questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%</strong>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="res-card">
                  <div className="icon-c orange"><IonIcon icon={ribbonOutline} /></div>
                  <span>Total</span>
                  <strong>{questions.length}</strong>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          <div className="action-buttons section-margin" style={{ marginTop: '40px' }}>
            <IonRow>
              <IonCol>
                <IonButton expand="block" fill="outline" color="medium" onClick={() => history.replace('/app/home')}>
                  <IonIcon slot="start" icon={homeOutline} /> Sair
                </IonButton>
              </IonCol>
              <IonCol>
                <IonButton expand="block" color="success" onClick={resetGame}>
                  <IonIcon slot="start" icon={arrowRedoOutline} /> Jogar
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