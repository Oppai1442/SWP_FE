import { Navigate } from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { ROUTES } from '@/constant/routes';
import { Log, MyTicket, NotificationManagement, TicketManagement } from '@/modules/dashboard';

// Lazy load components
const Home = lazy(() => import('@/modules/home'));
const ContactUs = lazy(() => import('@/modules/contactUs'));
const NotFound = lazy(() => import('@/modules/notFound'));
const Policy = lazy(() => import('@/modules/policy'));
const ToSPage = lazy(() => import('@/modules/tos'));

// Dashboard components
const DashboardLayout = lazy(() => import('@/modules/dashboard/DashboardLayout'));
const AccountSettings = lazy(() => import('@/modules/dashboard/pages/settings/AccountSettings'));
const PermissionManagement = lazy(() => import('@/modules/dashboard/pages/permission-management/PermissionManagement'));
const ClubCreationQueue = lazy(() => import('@/modules/dashboard/pages/club-queue/ClubCreationQueue'));
const ClubManagement = lazy(() => import('@/modules/dashboard/pages/club-management/ClubManagement'));
const MyClubs = lazy(() => import('@/modules/dashboard/pages/my-club/MyClubs'));
// const NotificationManagement = lazy(() => import('@/modules/dashboard/pages/notification/notification-management/NotificationManagement'));
const UserManagement = lazy(() => import('@/modules/dashboard/pages/user-management/UserManagement'));


// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

type AppRoute = 
  | { path: string; element: ReactNode; authOnly?: boolean; children?: AppRoute[] }
  | { index: true; element: ReactNode };


const routes: AppRoute[] = [
  { path: ROUTES.HOME.path, element: withSuspense(Home) },
  { path: ROUTES.CONTACT.path, element: withSuspense(ContactUs) },

  //Nằm ở footer
  { path: ROUTES.POLICY.path, element: <Policy /> },
  { path: ROUTES.TOS.path, element: <ToSPage /> },

  {
    path: ROUTES.DASHBOARD.path,
    element: <DashboardLayout />, 
    authOnly: false,
    children: [
      { path: ROUTES.DASHBOARD.child.USER_MANAGEMENT.path, element: <UserManagement />},
      { path: ROUTES.DASHBOARD.child.PERMISSION_MANAGEMENT.path, element: <PermissionManagement /> },
      { path: ROUTES.DASHBOARD.child.MY_CLUB.path, element: <MyClubs /> },
      { path: ROUTES.DASHBOARD.child.CLUB_MANAGEMENT.path, element: <ClubManagement /> },
      { path: ROUTES.DASHBOARD.child.CLUB_QUEUE.path, element: <ClubCreationQueue /> },
      //Notification
      { path: ROUTES.DASHBOARD.child.NOTIFICATION_MANAGEMENT.path, element: <NotificationManagement /> },


      { path: ROUTES.DASHBOARD.child.TICKET_MANAGEMENT.path, element: <TicketManagement />},
      { path: ROUTES.DASHBOARD.child.MY_TICKET.path, element: <MyTicket />},
      
      //Settings
      { path: ROUTES.DASHBOARD.child.ACCOUNT_SETTINGS.path, element: <AccountSettings /> },
      // { path: ROUTES.DASHBOARD.child.SECURITY_SETTINGS.path, element: <SecuritySettings /> },
      // { path: ROUTES.DASHBOARD.child.NOTIFICATION_SETTINGS.path, element: <NotificationSettings /> },

      { path: ROUTES.DASHBOARD.child.LOG.path, element: <Log />}
    ]
  },

  //2 cái này sẽ luôn nằm ở cuối cùng
  { path: '*', element: <Navigate to={ROUTES.NOT_FOUND.path} replace /> },
  { path: ROUTES.NOT_FOUND.path, element: <NotFound /> },
];

export default routes;
