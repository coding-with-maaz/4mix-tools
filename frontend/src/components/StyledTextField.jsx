import React from 'react';
import TextField from '@mui/material/TextField';
import colors from '../theme/colors';

const StyledTextField = React.forwardRef((props, ref) => (
  <TextField
    inputRef={ref}
    variant="outlined"
    fullWidth
    {...props}
    sx={{
      mb: 2,
      borderRadius: 3,
      backgroundColor: colors.surfaceAlt,
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        backgroundColor: colors.surfaceAlt,
        color: colors.text,
        transition: 'all 0.3s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        '& fieldset': {
          borderColor: colors.border,
        },
        '&:hover fieldset': {
          borderColor: colors.primaryLight,
          borderWidth: 2,
        },
        '&.Mui-focused fieldset': {
          borderColor: colors.primary,
          borderWidth: 2,
        },
      },
      '& .MuiInputLabel-root': {
        color: colors.textSecondary,
        fontWeight: 500,
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: colors.primary,
      },
      ...props.sx,
    }}
  />
));

export default StyledTextField; 