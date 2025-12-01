// constants/routes.ts

export const ROUTES = {
    // PUBLIC
    HOME: { path: '/', label: 'Home', public: true, getPath: () => '/' },
    ABOUT: { path: '/about', label: 'About', public: true, getPath: () => '/about' },
    CONTACT: { path: '/contact-us', label: 'About', public: true, getPath: () => '/contact-us' },
    PRICING: { path: '/pricing', label: 'Pricing', public: true, getPath: () => '/pricing' },

    POLICY: { path: '/policy', label: 'Policy', public: true, getPath: () => '/policy' },
    TOS: { path: '/terms-of-service', label: 'Terms of Service', public: true, getPath: () => '/terms-of-service' },


    USER_DETAIL: { path: '/user/:id', getPath: (id: string) => `/user/${id}`, label: 'User', public: true },


    CHECKOUT: {
        path: '/checkout/:id',
        label: 'Checkout',
        public: true,
        getPath: (id: string) => `/checkout/${id}`
    },


    // AUTH
    DASHBOARD: {
        path: '/dashboard', label: 'Dashboard', authOnly: true,
        getPath: () => '/dashboard',
        child: {
            USER_MANAGEMENT: { path: 'user-list', label: 'User List', getPath: () => '/dashboard/user-list' },
            PERMISSION_MANAGEMENT: { path: 'permissions', label: 'Permission Management', getPath: () => '/dashboard/permissions' },
            MY_TRANSACTION: { path: 'transaction/my-transaction', label: 'My Transaction', getPath: () => '/dashboard/transaction/my-transaction' },
            TRANSACTION: { path: 'transactions', label: 'Transactions', getPath: () => '/dashboard/transactions' },


            // Notification
            NOTIFICATION_MANAGEMENT: {
                path: 'notification/notification-management', label: 'Notification Management',
                getPath: () => '/dashboard/notification/notification-management',

            },

            // Ticket
            TICKET_MANAGEMENT: { path: 'ticket/ticket-management', label: 'Ticket Management', getPath: () => '/dashboard/ticket/ticket-management' },
            MY_TICKET: { path: 'ticket/my-ticket', label: 'My Ticket', getPath: () => '/dashboard/ticket/my-ticket' },

            // Settings
            ACCOUNT_SETTINGS: { path: 'settings', label: 'Settings', getPath: () => '/dashboard/settings' },
            // SECURITY_SETTINGS: { path: 'settings/security', label: 'Security' },
            // NOTIFICATION_SETTINGS: { path: 'settings/notification', label: 'Notification' },

            LOG: { path: 'log', label: 'Log', getPath: () => '/dashboard/log' },
        }
    },

    // NOT FOUND
    NOT_FOUND: { path: '/404', label: 'Not Found', public: true, getPath: () => '/404' },
};
