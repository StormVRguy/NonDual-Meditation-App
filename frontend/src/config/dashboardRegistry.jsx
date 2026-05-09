import GroupOneDashboard from '../pages/GroupOneDashboard'
import GroupTwoDashboard from '../pages/GroupTwoDashboard'

const DASHBOARD_COMPONENTS = {
  groupOne: GroupOneDashboard,
  groupTwo: GroupTwoDashboard,
}

export function getDashboardComponent(variant) {
  return DASHBOARD_COMPONENTS[variant] ?? null
}
