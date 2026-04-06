# ---------- BACKEND ----------

# Start with a lightweight Node.js 20 image.
FROM node:20-alpine

# Backend files will be copied into WORKDIR (it will automatically create if not exist).
WORKDIR /app

# Copy package manifest only (do not copy lockfile).
COPY package.json ./

# Install the latest versions allowed by package.json ranges.
RUN npm install

# Copy all backend code into the container.
COPY . .

# Compile TypeScript files into JavaScript.
RUN npx tsc

# Tell Docker that the app uses this port (for backend).
EXPOSE 4000

# Start the backend server using the compiled JS file.
CMD ["node", "dist/server.js"]

