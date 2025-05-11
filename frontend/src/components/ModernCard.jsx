import React from 'react';
import { Card, CardContent } from '@mui/material';
import colors from '../theme/colors';

const ModernCard = ({ children, light = false, ...props }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 6,
      background: light
        ? `linear-gradient(135deg, ${colors.surfaceLight} 80%, ${colors.surfaceAltLight} 100%)`
        : `linear-gradient(135deg, ${colors.surface} 80%, ${colors.surfaceAlt} 100%)`,
      color: light ? colors.textLight : colors.text,
      boxShadow: light
        ? '0 8px 32px rgba(0,0,0,0.08)'
        : '0 8px 32px rgba(0,0,0,0.12)',
      border: `1px solid ${light ? colors.borderLight : colors.border}`,
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        boxShadow: light
          ? '0 12px 48px rgba(0,0,0,0.10)'
          : '0 12px 48px rgba(0,0,0,0.18)',
        transform: 'translateY(-4px)',
      },
    }}
    {...props}
  >
    <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>{children}</CardContent>
  </Card>
);

export default ModernCard; 