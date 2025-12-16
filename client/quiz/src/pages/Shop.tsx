
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonButton,
  IonModal, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton as IonButtonComponent,
  IonSpinner, IonAlert
} from '@ionic/react';
import {
  alertCircleOutline, gameControllerOutline,
  trophyOutline, giftOutline, walletOutline,
  closeOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import './Shop.css';
import { useAuth } from '../hooks/useAuth';
import { useHistory } from 'react-router-dom';
import TopRightBar from '../components/TopRightBar';
import { httpClient } from '../api/client';

interface PaymentResponse {
  paymentId: string;
  qrCode: string;
  pixCode: string;
  expiresAt: string;
  amount: number;
  coins: number;
}

interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt: string | null;
  amount: number;
  coins: number;
  createdAt: string;
}

const Shop: React.FC = () => {
  const { user, token } = useAuth();
  const history = useHistory();
  const coins = user?.wallet?.credits ?? 0;
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Lista de Pacotes de Moedas
  const packages = [
    {
      id: 1,
      name: 'Iniciante',
      coins: 500,
      total: 500,
      bonus: null,
      price: 9.90,
      priceFormatted: 'R$ 9,90',
      bestSeller: false
    },
    {
      id: 2,
      name: 'Intermediário',
      coins: 1200,
      total: 1400,
      bonus: '+200 BÔNUS',
      price: 24.90,
      priceFormatted: 'R$ 24,90',
      bestSeller: true
    },
  ];

  // Limpar polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (paymentData && paymentStatus?.status === 'pending') {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const status = await httpClient.get<PaymentStatus>(
            `/payment/v1/status/${paymentData.paymentId}`,
            token || undefined
          );
          setPaymentStatus(status);
          
          if (status.status === 'paid') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            setShowSuccessAlert(true);
            // Atualizar dados do usuário
            window.location.reload(); // Recarrega para atualizar saldo
          } else if (status.status === 'failed') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            setError('Pagamento falhou. Tente novamente.');
          }
        } catch (err) {
          console.error('Erro ao verificar status do pagamento:', err);
        }
      }, 5000); // Polling a cada 5 segundos
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [paymentData, paymentStatus, token]);

  const handlePurchase = async (pkg: typeof packages[0]) => {
    if (!token) {
      setError('Você precisa estar logado para comprar moedas');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const amountInCents = Math.round(pkg.price * 100);
      const response = await httpClient.post<PaymentResponse>(
        '/payment/v1/create',
        {
          packageId: pkg.id,
          amount: amountInCents,
          coins: pkg.total
        },
        token
      );

      setPaymentData(response);
      setPaymentStatus({
        paymentId: response.paymentId,
        status: 'pending',
        paidAt: null,
        amount: response.amount,
        coins: response.coins,
        createdAt: new Date().toISOString()
      });
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      setError(err?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (paymentData?.pixCode) {
      navigator.clipboard.writeText(paymentData.pixCode);
      // Mostrar feedback visual (pode usar toast do Ionic)
      alert('Código PIX copiado!');
    }
  };

  const closePaymentModal = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setShowPaymentModal(false);
    setPaymentData(null);
    setPaymentStatus(null);
    setError(null);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="shop-bg">

        <TopRightBar coins={coins} onInvite={() => history.push('/app/invite')} sticky />

        {/* 1. CARD DE SALDO (LARANJA) */}
        <div className="section-padding">
          <div className="balance-card">
            <div className="money-bag">💰</div>
            <p>Seu Saldo Atual</p>
            <h1>{coins}</h1>
            <span>moedas disponíveis</span>
          </div>
        </div>

        {/* 2. AVISO PIX */}
        <div className="section-padding pt-0">
          <div className="pix-info">
            <IonIcon icon={alertCircleOutline} />
            <div>
              <strong>Pagamento Seguro via PIX</strong>
              <p>Compre moedas de forma rápida e segura. Após o pagamento, suas moedas caem na hora.</p>
            </div>
          </div>
        </div>

        {/* 3. LISTA DE PACOTES */}
        <div className="section-header-shop">
          <h3>Escolha seu Pacote</h3>
          <p>Quanto maior o pacote, mais bônus você ganha!</p>
        </div>

        <div className="section-padding">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`package-card ${pkg.bestSeller ? 'best-seller-border' : ''}`}>
              {pkg.bestSeller && <div className="best-seller-badge">Mais Vendido</div>}

              <span className="pkg-name">{pkg.name}</span>

              {/* Ícone de Moeda Simulado */}
              <div className="coin-image-circle">
                <div className="inner-coin"></div>
              </div>

              <h2>{pkg.coins.toLocaleString('pt-BR')}</h2>

              {pkg.bonus && (
                <div className="bonus-tag">
                  <IonIcon icon={walletOutline} /> {pkg.bonus}
                </div>
              )}

              <p className="pkg-desc">Você recebe:<br /><strong>{pkg.total.toLocaleString('pt-BR')}</strong><br />moedas no total</p>

              <div className="price-box">
                <small>Por apenas</small>
                <h3>{pkg.priceFormatted}</h3>
              </div>

              <IonButton 
                expand="block" 
                className="shop-btn" 
                onClick={() => handlePurchase(pkg)}
                disabled={isProcessing || !token}
              >
                {isProcessing ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <IonIcon slot="start" icon={walletOutline} />
                    Comprar Agora
                  </>
                )}
              </IonButton>
            </div>
          ))}
        </div>

        {/* 4. O QUE FAZER COM AS MOEDAS */}
        <div className="white-container-bottom">
          <div className="section-header-shop text-center">
            <h3>O que você pode fazer com suas moedas?</h3>
            <p>Aproveite ao máximo sua experiência no Soccer Quiz</p>
          </div>

          <div className="feature-card purple-feat">
            <IonIcon icon={gameControllerOutline} />
            <h4>Criar Quiz Premiado</h4>
            <p>Organize quizzes com prêmios em moedas para seus amigos</p>
          </div>

          <div className="feature-card yellow-feat">
            <IonIcon icon={trophyOutline} />
            <h4>Participar de Torneios</h4>
            <p>Entre em competições emocionantes com grandes prêmios</p>
          </div>

          <div className="feature-card green-feat">
            <IonIcon icon={giftOutline} />
            <h4>Desbloquear Categorias</h4>
            <p>Acesse categorias especiais e conteúdo premium exclusivo</p>
          </div>

        {/* Espaço extra para não cortar o final */}
        <div style={{ height: '60px' }}></div>
      </div>

      {/* Modal de Pagamento PIX */}
      <IonModal isOpen={showPaymentModal} onDidDismiss={closePaymentModal}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Pagamento PIX</IonTitle>
            <IonButtons slot="end">
              <IonButtonComponent onClick={closePaymentModal}>
                <IonIcon icon={closeOutline} />
              </IonButtonComponent>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {paymentData && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h2>Escaneie o QR Code ou copie o código PIX</h2>
              
              {paymentData.qrCode && (
                <div style={{ margin: '20px 0' }}>
                  <img 
                    src={paymentData.qrCode} 
                    alt="QR Code PIX" 
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
              )}

              {paymentData.pixCode && (
                <div style={{ margin: '20px 0' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Código PIX:</p>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '15px', 
                    borderRadius: '8px',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}>
                    {paymentData.pixCode}
                  </div>
                  <IonButton onClick={copyPixCode} fill="outline" size="small">
                    Copiar Código
                  </IonButton>
                </div>
              )}

              {/* Botão de fallback para copiar URL diretamente */}
              {paymentData && paymentData.paymentId && (
                <div style={{ margin: '20px 0' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Ou acesse diretamente a página de confirmação:
                  </p>
                  <IonButton 
                    fill="outline" 
                    size="small"
                    onClick={() => {
                      const url = `${window.location.origin}/payment/confirm/${paymentData.paymentId}`;
                      navigator.clipboard.writeText(url).then(() => {
                        alert('URL copiada! Cole no navegador para confirmar o pagamento.');
                      }).catch(() => {
                        // Fallback se clipboard não funcionar
                        const textArea = document.createElement('textarea');
                        textArea.value = url;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        alert('URL copiada! Cole no navegador para confirmar o pagamento.');
                      });
                    }}
                  >
                    <IonIcon icon={walletOutline} slot="start" />
                    Copiar URL de Confirmação
                  </IonButton>
                </div>
              )}

              {paymentStatus?.status === 'pending' && (
                <div style={{ marginTop: '20px' }}>
                  <IonSpinner name="crescent" />
                  <p style={{ marginTop: '10px', color: '#666' }}>
                    Aguardando pagamento...
                  </p>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Após o pagamento, suas moedas serão creditadas automaticamente
                  </p>
                </div>
              )}

              {error && (
                <div style={{ marginTop: '20px', color: 'red' }}>
                  <IonIcon icon={alertCircleOutline} />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Alert de Sucesso */}
      <IonAlert
        isOpen={showSuccessAlert}
        onDidDismiss={() => {
          setShowSuccessAlert(false);
          closePaymentModal();
        }}
        header="Pagamento Confirmado!"
        message={`Você recebeu ${paymentStatus?.coins || 0} moedas!`}
        buttons={['OK']}
      />
    </IonContent>
  </IonPage>
);
};

export default Shop;
