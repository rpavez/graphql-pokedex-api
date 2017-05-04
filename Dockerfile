FROM node:6.6.0-slim

# Expose the default port
EXPOSE 3000

# Create/Set the working directory
RUN mkdir /app
WORKDIR /app

COPY package.json /app/package.json
RUN npm i -g yarn
RUN yarn

# Copy App
COPY . /app

# Set Command
CMD yarn start
