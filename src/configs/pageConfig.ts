import { ROUTES } from "@/constant/routes";

export interface PageConfig {
  showNav: boolean;
  showFooter: boolean;
}

const defaultConfig: PageConfig = {
  showNav: true,
  showFooter: true,
};

const config = (overrides: Partial<PageConfig>): PageConfig => ({
  ...defaultConfig,
  ...overrides,
});

// Toàn bộ cấu hình các page
export const pageConfigs: { [key: string]: PageConfig } = {
  [ROUTES.HOME.path]: config({}),
  [ROUTES.CONTACT.path]: config({}),
  [ROUTES.POLICY.path]: config({}),
  [ROUTES.TOS.path]: config({}),
  [ROUTES.CHECKOUT.path]: config({showNav: false, showFooter: false}),

  [`${ROUTES.DASHBOARD.path}/*`]: config({
    showNav: false,
    showFooter: false,
  }),

  [ROUTES.NOT_FOUND.path]: config({}),
};
