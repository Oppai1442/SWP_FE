// constants/routes.ts

export const ROUTES = {
    // PUBLIC
    HOME: { path: '/', label: 'Trang chủ', public: true, getPath: () => '/' },
    CONTACT: { path: '/contact-us', label: 'Liên hệ', public: true, getPath: () => '/contact-us' },
    PRICING: { path: '/pricing', label: 'Bảng giá', public: true, getPath: () => '/pricing' },

    POLICY: { path: '/policy', label: 'Chính sách', public: true, getPath: () => '/policy' },
    TOS: { path: '/terms-of-service', label: 'Điều khoản dịch vụ', public: true, getPath: () => '/terms-of-service' },


    USER_DETAIL: { path: '/user/:id', getPath: (id: string) => `/user/${id}`, label: 'Người dùng', public: true },


    CHECKOUT: {
        path: '/checkout/:id',
        label: 'Thanh toán',
        public: true,
        getPath: (id: string) => `/checkout/${id}`
    },


    // AUTH
    DASHBOARD: {
        path: '/dashboard', label: 'Bảng điều khiển', authOnly: true,
        getPath: () => '/dashboard',
        child: {
            USER_MANAGEMENT: { path: 'user-list', label: 'Quản lý người dùng', getPath: () => '/dashboard/user-list' },
            PERMISSION_MANAGEMENT: { path: 'permissions', label: 'Quản lý quyền', getPath: () => '/dashboard/permissions' },
            MY_CLUB: { path: 'clubs/my', label: 'Club của tôi', getPath: () => '/dashboard/clubs/my' },

            // Notification
            NOTIFICATION_MANAGEMENT: {
                path: 'notification/notification-management', label: 'Quản lý thông báo',
                getPath: () => '/dashboard/notification/notification-management',

            },
            CLUB_QUEUE: {
                path: 'clubs/queue', label: 'Club chờ duyệt', getPath: () => '/dashboard/clubs/queue'
            },

            // Ticket
            TICKET_MANAGEMENT: { path: 'ticket/ticket-management', label: 'Quản lý Ticket', getPath: () => '/dashboard/ticket/ticket-management' },
            MY_TICKET: { path: 'ticket/my-ticket', label: 'Ticket của tôi', getPath: () => '/dashboard/ticket/my-ticket' },

            // Settings
            ACCOUNT_SETTINGS: { path: 'settings', label: 'Cài đặt', getPath: () => '/dashboard/settings' },
            // SECURITY_SETTINGS: { path: 'settings/security', label: 'Security' },
            // NOTIFICATION_SETTINGS: { path: 'settings/notification', label: 'Notification' },

            LOG: { path: 'log', label: 'Nhật ký', getPath: () => '/dashboard/log' },
        }
    },

    // NOT FOUND
    NOT_FOUND: { path: '/404', label: 'Không tìm thấy', public: true, getPath: () => '/404' },
};
