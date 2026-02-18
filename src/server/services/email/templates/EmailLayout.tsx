import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Hr, Link } from '@react-email/components';

export interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
}

export const EmailLayout = ({ children, previewText }: EmailLayoutProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>SmartQuote</Text>
          </Section>

          {/* Preview Text */}
          <Text style={preview}>{previewText}</Text>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated message from SmartQuote. Please do not reply to this email.
            </Text>
            <Text style={footerText}>
              Need help? Contact us at{' '}
              <Link href="mailto:support@smartquote.com" style={link}>
                support@smartquote.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  backgroundColor: '#1a1a2e',
  padding: '24px',
  textAlign: 'center' as const,
};

const headerText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const preview = {
  display: 'none',
  overflow: 'hidden',
  lineHeight: '1px',
  opacity: 0,
  maxHeight: '0',
  maxWidth: '0',
};

const content = {
  padding: '24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  padding: '0 24px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};
