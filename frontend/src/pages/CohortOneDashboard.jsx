import Dashboard from './Dashboard'
import { dashboardFeatures } from '../config/dashboardFeatures'
import { qualtricsSurveyUrls } from '../config/qualtricsSurveyUrls'

function CohortOneIntro() {
  return (
    <div className="daily-practices">
      <h3 style={{ color: 'red' }}>Recupera sempre la lezione entro il giorno successivo se non hai partecipato in diretta.</h3>
      <h2>PRATICHE QUOTIDIANE</h2>
      <ul className="daily-practices-list">
        <li>
          <strong>PRATICA FORMALE</strong>: Praticare il body-scan ogni giorno, seguendo la traccia audio.
        </li>
        <li>
          <strong>PRATICA INFORMALE</strong>: Durante la giornata, quando hai qualche momento di tranquillità (bastano un paio di minuti), porta l&apos;attenzione al corpo e alle sue sensazioni, se possibile eseguendo una veloce scansione corporea. Poi, quando riprendi le tue attività, prova mantenere almeno un po&apos; questo tipo di consapevolezza.
        </li>
      </ul>
    </div>
  )
}

function CohortOneDashboard({ onLogout }) {
  return (
    <Dashboard
      onLogout={onLogout}
      pageTitle="Dashboard del Corso di Meditazione Non Duale"
      introContent={<CohortOneIntro />}
      {...dashboardFeatures.coreOnly}
      useDefaultQualtricsUrl={false}
      questionnaireSurveyUrl={qualtricsSurveyUrls.cohortOne}
    />
  )
}

export default CohortOneDashboard
