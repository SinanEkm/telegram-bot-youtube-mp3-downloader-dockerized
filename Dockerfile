FROM node:12
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENV PORT 443
CMD [ "npm", "start"]