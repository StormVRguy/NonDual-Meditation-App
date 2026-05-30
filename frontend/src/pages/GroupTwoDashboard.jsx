import Dashboard from './Dashboard'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function GroupTwoIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Se salti una sessione in presenza, completa il recupero video entro il giorno successivo.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Ogni giorno, praticare la meditazione sulla sfera mentale con la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, notare se qualche volta capita di essere fortemente immedesimate/i in uno stato mentale (emozione, giudizio, convinzione, bisogno etc.) ma poi, dopo qualche minuto, senza particolari ragioni esterne, quello stato appare lontano o poco rilevante. Notare che cosa cambia quando ci si disidentifica da quello stato.
        </li>
        <li>
          <strong>TASK CONTEMPLATIVO</strong>: Esplora lo spazio della mente entro il quale sorgono e si dissolvono i vari contenuti mentali: ha delle qualità che lo caratterizzano? Se sì, prova a descriverle.
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
