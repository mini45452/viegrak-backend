FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf
COPY generate_certificates.sh /docker-entrypoint.d/generate_certificates.sh

RUN chmod +x /docker-entrypoint.d/generate_certificates.sh
