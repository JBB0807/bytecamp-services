# docker commands to know

`sudo docker build . -t registry.fly.io/snaketest:uniqueid`

`docker push registry.fly.io/snaketest:uniqueid`

`fly machine update e82d4d9c690e08 --image registry.fly.io/snaketest:uniqueid`