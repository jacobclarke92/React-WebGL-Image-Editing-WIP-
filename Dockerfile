FROM garthk/node-for-headless-webgl:latest

ENV NODE_PATH /usr/local/lib/node_modules

RUN npm install babel-cli@6.10.1 -g --save

WORKDIR /app/app
ADD ./app /app/app
WORKDIR /app/backend
ADD ./backend /app/backend

WORKDIR /app
COPY package.json /app
RUN npm install

COPY test1.jpg /app

EXPOSE 80

WORKDIR /app

#ENTRYPOINT ["/usr/bin/dumb-init", "--", "xvfb-run", "-s", "-ac -screen 0 1x1x24", "babel-node", "/app/backend/index.js"]

#CMD ["input=test1.jpg", 'instructions="[{\"name\":\"adjustments\",\"steps\":[{\"key\":\"gamma\",\"value\":2.1}]}]"']

#RUN ["/usr/bin/dumb-init", "--", "xvfb-run", "-s", "-ac -screen 0 1x1x24", "babel-node", "/app/backend/index.js", "input=test1.jpg", 'instructions="[{\"name\":\"adjustments\",\"steps\":[{\"key\":\"gamma\",\"value\":2.1}]}]"']

ENTRYPOINT /bin/bash

# ps -ef | grep Xvfb | grep -v grep | awk '{print $2}' | xargs -r kill -9
# /usr/bin/dumb-init -- xvfb-run -s "-ac -screen 0 1x1x24" babel-node ./backend/index.js input=test1.jpg instructions="[{\"name\":\"utility\",\"steps\":[]},{\"name\":\"adjustments\",\"steps\":[{\"key\":\"gamma\",\"value\":2.1}]}]"

