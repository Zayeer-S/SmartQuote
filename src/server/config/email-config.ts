import { backEnv } from './env.backend';

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    address: string;
  };
  enabled: boolean;
}

export const emailConfig: EmailConfig = {
  smtp: {
    host: backEnv.SMTP_HOST,
    port: backEnv.SMTP_PORT,
    secure: backEnv.SMTP_SECURE,
    auth: {
      user: backEnv.SMTP_USER,
      pass: backEnv.SMTP_PASSWORD,
    },
  },
  from: {
    name: 'SmartQuote Support',
    address: backEnv.SMTP_USER,
  },
  enabled: backEnv.NODE_ENV !== 'test',
};
