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
          <strong>PRATICA INFORMALE</strong>: Scegliere un&apos;attività quotidiana da svolgere in modo consapevole - per es. lavarsi i denti, bere il caffè, scendere o salire le scale, etc.
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
