#!/bin/bash

mkdir -p /etc/nginx/certs

openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -subj "/CN=localhost" -keyout /etc/nginx/certs/localhost.key -out /etc/nginx/certs/localhost.crt
