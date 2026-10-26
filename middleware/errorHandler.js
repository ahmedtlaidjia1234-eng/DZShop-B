export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
}

export function globalErrorHandler(err, req, res, _next) {
  console.error('❌ Server Error:', err);

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    success: false,
    message: isProduction
      ? 'An unexpected server error occurred. Please try again later.'
      : err.message || 'Internal server error.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
}
