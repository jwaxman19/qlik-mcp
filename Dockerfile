FROM denoland/deno:alpine-1.43.0

WORKDIR /app

# Copy application code
COPY . .

# Cache the dependencies
RUN deno cache src/index.ts

# Expose port if needed for debugging
# EXPOSE 3000

# Run the application
CMD ["deno", "run", "--allow-all", "--env-file=.env", "src/index.ts"] 