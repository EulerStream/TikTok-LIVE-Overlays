# Optimized multi-stage Dockerfile for serving static Vite build with nginx
# Stage 1: Serve with minimal nginx image
FROM nginx:alpine-slim

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Add optimized nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built static files (built externally via build.sh)
COPY dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
