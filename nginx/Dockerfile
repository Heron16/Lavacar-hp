FROM nginx:1.25-alpine

# Copia a configuração e os certificados durante o build
# (evita problemas de bind mount de arquivo no Docker Desktop Windows)
COPY nginx.conf /etc/nginx/nginx.conf
COPY certs/meuapp.local.pem /etc/nginx/certs/meuapp.local.pem
COPY certs/meuapp.local-key.pem /etc/nginx/certs/meuapp.local-key.pem

EXPOSE 80 443
