FROM node:22.20.0

# copying package.json and package-lock.json first to leverage Docker cache for npm install, so that it doesn't need to run 'npm install' on every code change
COPY package.json package.json
COPY package-lock.json package-lock.json

# RUN npm install      ------> will install all dependencies including devDependencies
# Using --production flag to install only production dependencies and skip devDependencies
RUN npm install --production

# This is okay. Docker will just overwrite the files that already exist — it won’t reinstall dependencies because the cache step already ran
COPY . .

# EXPOSE <port> doesn’t make your app listen on that port; It’s just a declaration: “Hey, this container will use this port at runtime.”
EXPOSE 5000
# NOTE: The -e flag in Docker allows you to set environment variables at runtime if they are not present in your .env file. If present, then it overrides whatever is in .env file. For example, you can run the container with a different PORT like this:
# docker run -e PORT=3000 -p 3000:3000 <image>  ; this will override the PORT variable in .env file which was 5000 and now the new port value is set to 3000

# since we did not install devDependencies, we cannot use 'npm run dev' command here as it is using nodemon which is a devDependency and is thus not installed
CMD ["npm", "run", "start"]