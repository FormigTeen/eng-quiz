import React from 'react';
import {
  IonContent, IonPage, IonIcon, IonAvatar,
  IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton,
  IonLabel
} from '@ionic/react';
import {
  trophyOutline, flashOutline, timeOutline,
  trendingUpOutline, peopleOutline, gameControllerOutline,
  ribbonOutline, medalOutline
} from 'ionicons/icons';
import './Ranking.css';

const Ranking: React.FC = () => {

  // Dados Falsos para a Tabela de Classificação
  const leaderboardData = [
    { rank: 1, name: 'João Silva', points: '9.850', level: 28, days: 12, avatar: 'avatar1.svg', color: 'gold' },
    { rank: 2, name: 'Maria Santos', points: '9.720', level: 27, days: 10, avatar: 'avatar2.svg', color: 'silver' },
    { rank: 3, name: 'Pedro Costa', points: '9.680', level: 26, days: 15, avatar: 'avatar3.svg', color: 'bronze' },
    { rank: 4, name: 'Ana Oliveira', points: '9.540', level: 25, days: 8, avatar: 'avatar4.svg', color: 'white' },
    { rank: 5, name: 'Carlos Mendes', points: '9.430', level: 24, days: 7, avatar: 'avatar2.svg', color: 'white' },
    { rank: 6, name: 'Juliana Lima', points: '9.320', level: 24, days: 9, avatar: 'avatar3.svg', color: 'white' },
    { rank: 7, name: 'Roberto Alves', points: '9.210', level: 23, days: 6, avatar: 'avatar1.svg', color: 'white' },
  ];

  return (
    <IonPage>
      <IonContent fullscreen className="ranking-bg">

        {/* 1. SEU DESEMPENHO (CARD VERDE GRANDE) */}
        <div className="performance-card section-margin">
          <div className="perf-header">
            <IonAvatar className="perf-avatar">
              <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="Eu" />
            </IonAvatar>
            <div className="perf-text">
              <h3>Seu Desempenho</h3>
              <p>Jogador</p>
            </div>
            <span className="badge-up">📈 +5 posições</span>
          </div>

          {/* Grid de Stats Pessoais */}
          <IonGrid className="perf-grid">
            <IonRow>
              <IonCol size="6">
                <div className="glass-stat">
                  <span>🏆 Posição Global</span>
                  <h4>#42</h4>
                  <small>de 2.847 jogadores</small>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="glass-stat">
                  <span>🪙 Pontos Totais</span>
                  <h4>7,250</h4>
                  <small>+420 esta semana</small>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="glass-stat">
                  <span>🎯 Taxa de Acerto</span>
                  <h4>87%</h4>
                  <small>0 erros</small>
                </div>
              </IonCol>
              <IonCol size="6">
                <div className="glass-stat">
                  <span>⚡ Sequência</span>
                  <h4>14</h4>
                  <small>dias seguidos</small>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Gráfico Simulado (SVG) */}
          <div className="chart-container">
            <div className="chart-header">
              <IonIcon icon={trendingUpOutline} /> Sua Evolução <small>(Últimas 4 semanas)</small>
            </div>
            <svg viewBox="0 0 300 100" className="line-chart">
              {/* Linhas de Grade */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" />

              {/* A Linha do Gráfico */}
              <polyline
                points="20,80 100,60 200,40 280,20"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Pontos no Gráfico */}
              <circle cx="20" cy="80" r="4" fill="white" />
              <circle cx="100" cy="60" r="4" fill="white" />
              <circle cx="200" cy="40" r="4" fill="white" />
              <circle cx="280" cy="20" r="4" fill="white" />
            </svg>
            <div className="chart-labels">
              <span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span>
            </div>
          </div>
        </div>

        {/* 2. ESTATÍSTICAS DA COMUNIDADE */}
        <div className="section-title">
          <div className="title-icon"><IonIcon icon={peopleOutline} /></div>
          <div>
            <strong>Comunidade</strong>
            <p>Estatísticas gerais da plataforma</p>
          </div>
        </div>

        <div className="community-stats section-margin">

          <div className="comm-card blue-theme">
            <div>
              <p>Jogadores Ativos</p>
              <h3>2,847</h3>
              <span className="pill-green">↗ +12% este mês</span>
            </div>
            <IonIcon icon={peopleOutline} className="big-icon" />
          </div>

          <div className="comm-card purple-theme">
            <div>
              <p>Quizzes Jogados</p>
              <h3>45.2K</h3>
              <span className="pill-green">↗ +8% esta semana</span>
            </div>
            <IonIcon icon={gameControllerOutline} className="big-icon" />
          </div>

          <div className="comm-card green-theme">
            <div>
              <p>Tempo Médio</p>
              <h3>4.5s</h3>
              <span className="pill-blue">↘ Melhorando!</span>
            </div>
            <IonIcon icon={flashOutline} className="big-icon" />
          </div>

        </div>

        {/* 3. TABELA DE CLASSIFICAÇÃO (RANKING) */}
        <div className="section-title mt-20">
          <div className="title-icon yellow"><IonIcon icon={trophyOutline} /></div>
          <strong>Tabelas de Classificação</strong>
        </div>

        {/* Seletor de Categoria */}
        <div className="section-margin">
          <IonSegment value="global" mode="ios" className="ranking-segment">
            <IonSegmentButton value="global">
              <IonIcon icon={trophyOutline} />
            </IonSegmentButton>
            <IonSegmentButton value="flash">
              <IonIcon icon={flashOutline} />
            </IonSegmentButton>
            <IonSegmentButton value="time">
              <IonIcon icon={timeOutline} />
            </IonSegmentButton>
          </IonSegment>

          <div className="top-global-label">
            <div className="icon-circle"><IonIcon icon={trophyOutline} /></div>
            <div>
              <strong>Top 10 Global</strong>
              <p>Jogadores com mais pontos acumulados</p>
            </div>
          </div>

          {/* LISTA DE JOGADORES */}
          <div className="leaderboard-list">
            {leaderboardData.map((player) => (
              <div key={player.rank} className={`rank-item ${player.color}`}>
                <div className="rank-pos">{player.rank}</div>

                <IonAvatar className="rank-avatar">
                  <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="P" />
                </IonAvatar>

                <div className="rank-info">
                  <h4>{player.name} {player.rank === 1 && '👑'}</h4>
                  <p>
                    <IonIcon icon={ribbonOutline} /> Nv. {player.level}
                    &nbsp;•&nbsp;
                    <IonIcon icon={flashOutline} /> {player.days} dias
                  </p>
                </div>

                <div className="rank-points">
                  <strong>{player.points}</strong>
                  <small>pontos</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Espaço para TabBar */}
        <div style={{ height: '80px' }}></div>

      </IonContent>
    </IonPage>
  );
};

export default Ranking;