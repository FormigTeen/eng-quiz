
import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage, IonButton, IonSpinner,
  IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonAlert
} from '@ionic/react';
import {
  checkmarkCircleOutline, closeCircleOutline,
  walletOutline, cashOutline
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { httpClient } from '../api/client';

interface ConfirmResponse {
  success: boolean;
  message: string;
  paymentId: string;
  status: string;
  coins?: number;
  amount?: number;
}

const PaymentConfirm: React.FC = () => {
  const history = useHistory();
  const { paymentId } = useParams<{ paymentId: string }>();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [confirmData, setConfirmData] = useState<ConfirmResponse | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setError('ID do pagamento não fornecido');
    }
  }, [paymentId]);

  const handleConfirm = async () => {
    if (!paymentId) {
      setError('ID do pagamento não fornecido');
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const response = await httpClient.post<ConfirmResponse>(
        `/payment/v1/confirm/${paymentId}`,
        {}
      );

      setConfirmData(response);
      setIsConfirmed(true);
      setShowSuccessAlert(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        history.push('/app/shop');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao confirmar pagamento:', err);
      setError(err?.message || 'Erro ao confirmar pagamento. Tente novamente.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: '400px',
          padding: '20px'
        }}>
          <IonCard style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <IonCardHeader style={{ textAlign: 'center', paddingTop: '30px' }}>
              <IonIcon 
                icon={isConfirmed ? checkmarkCircleOutline : walletOutline} 
                style={{ fontSize: '64px', color: isConfirmed ? '#28a745' : '#667eea', marginBottom: '20px' }}
              />
              <IonCardTitle style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                {isConfirmed ? 'Pagamento Confirmado!' : 'Confirmar Pagamento'}
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              {!isConfirmed ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                      Clique no botão abaixo para confirmar o pagamento simulado.
                      Suas moedas serão creditadas automaticamente.
                    </p>
                  </div>

                  {error && (
                    <div style={{ 
                      background: '#fee', 
                      color: '#c33', 
                      padding: '12px', 
                      borderRadius: '8px',
                      marginBottom: '20px',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      <IonIcon icon={closeCircleOutline} style={{ marginRight: '8px' }} />
                      {error}
                    </div>
                  )}

                  <IonButton 
                    expand="block" 
                    onClick={handleConfirm}
                    disabled={isConfirming || !paymentId}
                    style={{ 
                      marginTop: '20px',
                      height: '50px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {isConfirming ? (
                      <>
                        <IonSpinner name="crescent" style={{ marginRight: '10px' }} />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <IonIcon icon={cashOutline} slot="start" />
                        Confirmar Pagamento
                      </>
                    )}
                  </IonButton>

                  <IonButton 
                    expand="block" 
                    fill="outline"
                    onClick={() => history.push('/app/shop')}
                    style={{ 
                      marginTop: '10px',
                      height: '44px'
                    }}
                  >
                    Voltar para Loja
                  </IonButton>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ 
                    background: '#d4edda', 
                    color: '#155724', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <IonIcon 
                      icon={checkmarkCircleOutline} 
                      style={{ fontSize: '48px', marginBottom: '10px' }}
                    />
                    <h3 style={{ margin: '10px 0', fontSize: '20px' }}>
                      Pagamento Confirmado!
                    </h3>
                    {confirmData?.coins && (
                      <p style={{ fontSize: '18px', marginTop: '10px', fontWeight: 'bold' }}>
                        +{confirmData.coins.toLocaleString('pt-BR')} moedas creditadas
                      </p>
                    )}
                  </div>
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Redirecionando para a loja...
                  </p>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>

        {/* Alert de Sucesso */}
        <IonAlert
          isOpen={showSuccessAlert}
          onDidDismiss={() => {
            setShowSuccessAlert(false);
            history.push('/app/shop');
          }}
          header="Pagamento Confirmado!"
          message={confirmData?.coins 
            ? `Você recebeu ${confirmData.coins.toLocaleString('pt-BR')} moedas!` 
            : 'Pagamento confirmado com sucesso!'}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default PaymentConfirm;

