FROM node:16.20.1-alpine3.18 as build

WORKDIR /app
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
ENV PATH /app/node/_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm install 

COPY . ./
CMD [ "node", "index.js" ]