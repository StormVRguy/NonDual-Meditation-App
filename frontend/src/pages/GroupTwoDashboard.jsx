import Dashboard from './Dashboard'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>
          <p>Meditare quotidianamente in posizione seduta seguendo l&apos;ultima traccia audio.</p>
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>
          <p>
            Qualche volta provare ad addormentarsi osservando la mente, proprio come facciamo in meditazione, ma senza contrastare il processo di addormentamento. Meglio se questa esplorazione è svolta in una delle seguenti circostanze: dopo un risveglio notturno; al mattino; oppure di pomeriggio. Ciò ha due scopi:
          </p>
          <ul>
            <li>
              È di per sé interessante osservare la mente durante lo stato in cui i sensi sono quasi sopiti e le forme consuete di attività mentale cedono il passo a processi interiori più vividi e bizzarri – benché non facili da contemplare senza perdere coscienza.
            </li>
            <li>
              Questa attività potrebbe condurre, senza ulteriori pratiche, a sperimentare sogni lucidi (o comunque sogni più vividi e consapevoli del consueto), associati a questo tipo di meditazioni in varie fonti contemplative.
            </li>
          </ul>
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>
          <p>
            Provare ad accorgersi se, nella vita di tutti i giorni, si riesce a essere più consapevoli dei propri processi interiori, quasi come se questi venissero percepiti attraverso un senso interno. Riusciamo a sperimentare una relativa continuità di consapevolezza? Abbiamo l&apos;impressione che in tal modo si riduca il senso di identificazione con i contenuti e processi mentali più intensi e/o se ne limiti la durata?
          </p>
        </li>
      </ul>
    </div>
  )
}

function GroupTwoDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<GroupTwoIntro />}
      showBodyScanMeditation={false}
      showAdditionalLecture={false}
      useDefaultQualtricsUrl={false}
      questionnaireSurveyUrl={qualtricsSurveyUrls.secondary}
    />
  )
}

export default GroupTwoDashboard
